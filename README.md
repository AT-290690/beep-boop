.env dist  
PORT = 9000  
STAGE = DEVELOPMENT  
PRIVATE_KEY = secret  
TOKEN_LIFETIME = 360000  
DB = mongodb+srv:://####################

```go
 < /app/index.go >

 - 0 > MODULES
 - 1 >  CONNECTION
 - 1 >  APP
 - 2 >   LISTEN

 < /app/auth.go >

 - 0 > POST/REGISTER
 - 1 >  REGISTER[request]
 - 2 >   CREATE_USER
 - 3 >    REDIRECT_CREATE_USER
 - 0 > PUT/LOGIN
 - 1 >  LOGIN[request]
 - 2 >   LOGIN[response]
 - 0 > PUT/LOGOUT

 < /app/errors.go >

 - 0 > SERVICE_ERROR_HANDLER
 - 1 >  DEVELOPMENT
 - 1 >  PRODUCTION
 - 0 > SEND_ERROR

 < /app/home.go >

 - 0 > /
 - 0 > /ABOUT

 < /app/middlewares.go >

 - 0 > MIDDLEWARES
 - 1 >  BODY_PARSER
 - 1 >  HELMET
 - 1 >  STATIC
 - 1 >  PASSPORT
 - 1 >  JWT

 < /app/music.go >

 - 0 > GET/BY_AUTHOR
 - 1 >  BY_AUTHOR[parseQuery]
 - 2 >   BY_AUTHOR[fetchFromDB]
 - 3 >    BY_AUTHOR[response]
 - 0 > GET/PIECE
 - 1 >  PIECE[response]
 - 0 > DELETE/REMOVE
 - 1 >  MONGO_REMOVE_PIECE
 - 2 >   REMOVE_PIECE
 - 0 > POST/INSERT
 - 1 >  CREATE_PIECE
 - 2 >   MONGO_CREATE_PIECE
 - 3 >    CREATE_PIECE_END

 < /app/router.go >

 - 0 > ROUTER
 - 1 >  HOME
 - 1 >  MUSIC
 - 1 >  ACCOUNT

< [MODULES] index.go -> auth.go -> errors.go -> home.go -> middlewares.go -> music.go -> router.go >

```
