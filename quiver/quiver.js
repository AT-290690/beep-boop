export class Quiver {
  arrows = {};
  nodes = {};
  current;
  root = null;
  visited = {};

  setNodes(nodes) {
    this.nodes = Object.freeze(nodes);
  }

  path(nodes) {
    const Nodes = {};
    let prev = null;
    const qvr = new Quiver();
    nodes.forEach((n, index, array) => {
      Nodes[n] = {
        key: n,
        next: [],
        type: 'branch'
      };
      qvr.arrows[n] = this.arrows[n];
      if (index === 0) {
        Nodes[n].type = 'root';
      } else if (index === array.length - 1) {
        Nodes[n].type = 'leaf';
      }
      if (Nodes[prev]) {
        Nodes[prev].next = [n];
      }
      Nodes[n].prev = prev;
      prev = n;
    });
    qvr.setNodes(Nodes);
    qvr.setRoot(nodes[0]);
    return qvr;
  }

  trace(root, leaf, out = []) {
    out = out.length === 0 ? [leaf] : [leaf, ...out];
    if (this.nodes[leaf].prev === root) {
      return [root, ...out];
    }
    if (!this.nodes[leaf].prev) {
      console.log(
        '\x1b[31m',
        `FAIL: Couldn't find node parent [${root}]`,
        '\x1b[0m'
      );
      return out;
    }
    return this.trace(root, this.nodes[leaf].prev, out);
  }

  go(key) {
    return args => this.goTo(key, args);
  }

  async goTo(key, args, prev = null, out = {}) {
    if (this.visited[key]) return;
    const node = this.nodes[key];
    this.current = node;
    if (!node) return;
    let result;
    if (this.arrows[node.key]) {
      result = await this.arrows[node.key](args, node.key, prev, node.next);
    }
    if (result === undefined) return;
    if (
      node.type === 'leaf' ||
      (node.type === 'root' && node.next.length === 0)
    ) {
      out[key] = result;
      return result;
    } else {
      for (const n of node.next) {
        await this.goTo(n, result, node.key, out);
      }
    }
    return out;
  }
  async goTo(key, args, prev = null, out = {}) {
    if (this.visited[key]) return;
    const node = this.nodes[key];
    this.current = node;
    if (!node) return;
    let result;
    if (this.arrows[node.key]) {
      result = await this.arrows[node.key](args, node.key, prev, node.next);
    }
    if (result === undefined) return;
    if (
      node.type === 'leaf' ||
      (node.type === 'root' && node.next.length === 0)
    ) {
      out[key] = result;
      return result;
    } else {
      for (const n of node.next) {
        await this.goTo(n, result, node.key, out);
      }
    }
    return out;
  }

  tramp(fn) {
    (...args) => {
      let result = fn(...args);
      while (typeof result === 'function') {
        result = result();
      }
      return result;
    };
  }

  setRoot(key) {
    this.root = key;
  }

  getRoot() {
    return this.root;
  }

  visit(key) {
    if (!this.visited[key]) {
      this.visited[key] = true;
    }
  }

  leave(key) {
    delete this.visited[key];
  }

  shortCircuit(callback) {
    const result = callback();
    return result ? result : undefined;
  }

  ifNotVisited(key, callback) {
    return key in this.visited ? undefined : callback();
  }

  log(...msg) {
    console.log(
      '\x1b[2m',
      `at Node ["${this.current.key}"] from ["${this.current.prev}"]`,
      '\x1b[0m'
    );
    console.log(...msg);
  }

  test = {
    fail: (desc, a, b) => {
      console.log(
        '\x1b[31m',
        `FAIL: ${desc}`,
        '\x1b[32m',
        `\n\tExpected: ${typeof a === 'object' ? JSON.stringify(a) : a}`,
        '\x1b[31m',
        `\n\tRecieved: ${typeof b === 'object' ? JSON.stringify(b) : b}`,
        '\x1b[0m'
      );
      return false;
    },
    success: desc => {
      console.log('\x1b[32m', `PASS: ${desc}`, '\x1b[0m');
      return true;
    },
    isEqual: (a, b) => {
      const typeA = typeof a,
        typeB = typeof b;
      if (typeA !== typeB) return false;
      if (typeA === 'number' || typeA === 'string' || typeA === 'boolean') {
        return a === b;
      }
      if (typeA === 'object') {
        const isArrayA = Array.isArray(a),
          isArrayB = Array.isArray(b);
        if (isArrayA !== isArrayB) return false;
        if (isArrayA && isArrayB) {
          if (a.length !== b.length) return false;
          return a.every((item, index) => this.test.isEqual(item, b[index]));
        } else {
          if (Object.keys(a).length !== Object.keys(b).length) return false;
          for (const key in a) {
            if (!this.test.isEqual(a[key], b[key])) {
              return false;
            }
          }
          return true;
        }
      }
    },
    tree: root => ({
      input: inp => ({
        output: expected => ({
          should: async desc => {
            const res = await this.goTo(root, inp);
            return res === undefined
              ? this.test.fail(desc, expected, 'Short Circuited')
              : this.test.isEqual(res, expected)
              ? this.test.success(desc)
              : this.test.fail(desc, expected, res);
          }
        })
      })
    }),
    root: root => ({
      input: inp => ({
        leaf: leaf => ({
          output: expected => ({
            should: async desc => {
              const path = this.trace(root, leaf);
              const qvr = this.path(path);
              const res = await qvr.goTo(root, inp);

              const output =
                res === undefined || res[leaf] === undefined
                  ? this.test.fail(desc, expected, 'Short Circuited')
                  : this.test.isEqual(res[leaf], expected)
                  ? this.test.success(desc)
                  : this.test.fail(desc, expected, res[leaf]);
              if (!output)
                console.log(
                  '\x1b[2m',
                  `\t${path.map(n => `[${n}]`).join('->')}`,
                  '\x1b[0m'
                );
              return output;
            }
          }),
          fail: async desc => {
            const path = this.trace(root, leaf);
            const qvr = this.path(path);
            const res = await qvr.goTo(root, inp);

            const output = res?.[leaf] === undefined;
            if (output) {
              this.test.success(desc);
            } else {
              this.test.fail(desc, 'Short Circuit', res[leaf]);
            }
            if (!output)
              console.log(
                '\x1b[2m',
                `\t${path.map(n => `[${n}]`).join('->')}`,
                '\x1b[0m'
              );
            return output;
          }
        })
      })
    })
  };
}
