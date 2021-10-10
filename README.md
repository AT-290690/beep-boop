.env dist   
PORT = 9000   
STAGE = development   
PRIVATE_KEY = secret    
TOKEN_LIFETIME = 360000   
DB = mongodb+srv:://####################    

```go
 < /app/index.go >
 
 - 0 > modules
 - 1 >  connection
 - 1 >  app
 - 2 >   listen
  
 < /app/auth.go >
 
 - 0 > POST/register
 - 1 >  register[request]
 - 2 >   createUser
 - 3 >    redirectCreateUser
 - 0 > PUT/login
 - 1 >  login[request]
 - 2 >   login[response]
 - 0 > PUT/logout
  
 < /app/errors.go >
 
 - 0 > serviceErrorHandler
 - 1 >  development
 - 1 >  production
 - 0 > sendError
  
 < /app/home.go >
 
 - 0 > /
 - 0 > /about
  
 < /app/middlewares.go >
 
 - 0 > middlewares
 - 1 >  bodyParser
 - 1 >  helmet
 - 1 >  static
 - 1 >  passport
 - 1 >  jwt
  
 < /app/music.go >
 
 - 0 > GET/byAuthor
 - 1 >  byAuthor[parseQuery]
 - 2 >   byAuthor[fetchFromDB]
 - 3 >    byAuthor[response]
 - 0 > GET/piece
 - 1 >  piece[response]
 - 0 > DELETE/remove
 - 1 >  mongoRemovePiece
 - 2 >   removePieceEnd
 - 0 > POST/insert
 - 1 >  createPiece
 - 2 >   mongoCreatePiece
 - 3 >    createPieceEnd
  
 < /app/router.go >
 
 - 0 > router
 - 1 >  home
 - 1 >  music
 - 1 >  account
  
< [modules] index.go -> auth.go -> errors.go -> home.go -> middlewares.go -> music.go -> router.go >
 
```

