export const quiverObject = `export class Quiver {
  memo = {};
  func = {};
  nodes = {};
  root = null;
  logOn = false;
  visited = {};
  output = [];

  setNodes(nodes) {
    this.nodes = Object.freeze(nodes);
  }

  async goTo(key, args, prev = null) {
    if (this.visited[key]) return;
    const node = this.nodes[key];
    if (!node) return;
    let result;
    if (this.func[node.key]) {
      result = await this.func[node.key](args, node.key, prev, node.next);
    }
    if (result === undefined) return;
    if (
      node.type === 'leaf' ||
      (node.type === 'root' && node.next.length === 0)
    ) {
      if (this.logOn) {
        this.output.push({ result, at: node.key, from: node.prev });
      } 
      return result;
    } else {
      for (const n of node.next) {
        await this.goTo(n, result, node.key);
      }
    }
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

  reset() {
    this.restart();
    this.memo = {};
  }

  restart() {
    this.output = [];
    this.visited = {};
  }

  out() {
    if(!this.logOn) return 'Log is turned off!'
    return this.output;
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
}`;
