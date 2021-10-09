# quiver.js

JavaScript parser for graph based pipe development

```
HELLO -> "Hello"
  SPACE -> args + " "
    WORLD -> args + "World"
      PRINT -> console.log(args)


async (args, key, prev, next) => ...
-> declare node
<- return
:= assign (with const)
value - result of prev node
key - current node key
next - array of children
qvr.nodes - adj list
qvr.memo - object containing stuff
qvr.visited - object containing visited nodes
qvr.visit(key) - visit add node to visited - return goTo
qvr.ifNotVisited(key, callback) - call a function if node is not visited
qvr.shortCircuit(callback) - if a function returns false - stop recursing
qvr.leave(key) - remove node from visited
qvr.goTo(key, args) - dfs from specific node
qvr.setRoot(key) - sets the root to desired
qvr.restart() - resets memo, visited and output
qvr.out() - returns output array


- 0 > HELLO
- 1 >   SPACE
- 2 >     WORLD
- 3 >       PRINT

nesting with levels
```

```json
{
  "HELLO": {
    "key": "HELLO",
    "next": ["SPACE"],
    "level": 0,
    "type": "root",
    "prev": null
  },
  "SPACE": {
    "key": "SPACE",
    "next": ["WORLD"],
    "level": 1,
    "type": "branch",
    "prev": "HELLO"
  },
  "WORLD": {
    "key": "WORLD",
    "next": ["PRINT"],
    "level": 2,
    "type": "branch",
    "prev": "SPACE"
  },
  "PRINT": {
    "key": "PRINT",
    "next": [],
    "level": 3,
    "type": "leaf",
    "prev": "WORLD"
  }
}
```

```
- 0 > SERVER
- 0 > REQUEST
- 1 >  HELLO_CAT
- 2 >   HELLO[GET]
- 1 >  ABOUT
- 1 >  AGE
- 2 >   AGE[POST]
- 3 >    AGE[POST](validate)
- 4 >     AGE[POST](send)
- 1 >  CAT
- 2 >   CAT[GET]
- 3 >    CAT[GET][all](validate)
- 4 >     CAT[GET][all](send)
- 3 >    CAT[GET][id](validate)
- 4 >     CAT[GET][id](send)
- 2 >   CAT[POST]
- 3 >    CAT[POST](validate)
- 4 >     CAT[POST](send)
- 2 >   CAT[PUT]
- 3 >    CAT[PUT](validate)
- 4 >     CAT[PUT](send)
- 2 >   CAT[DELETE]
- 3 >    CAT[DELETE](validate)
- 4 >     CAT[DELETE](send)
```
