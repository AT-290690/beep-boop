import express from 'express';
import mongoDB from 'mongodb';
import dotevn from 'dotenv';
import bcrypt from 'bcrypt';
import URL from 'url';
import path from 'path';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import passport from "passport";
import passportJwt from 'passport-jwt';
import helmet from "helmet";

const MEMO = {};

>>->
MODULES ! -> 
	dotevn.config()
	__dirname := path.dirname(URL.fileURLToPath(import.meta.url))
	<- { __dirname }	

	CONNECTION * ! ->
		{ MongoClient } := mongoDB
		uri := process.env.DB
		mongoInstance := new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true
		})

	 ~ mongoInstance.connect(error => {
		if (error) <- console.log(error)
		MEMO.collections = {
			users: mongoInstance
			.db("test")
			.collection("users"),
			music: mongoInstance
			.db("test")
			.collection("music")
		}
		})

	APP * ! :: { __dirname } -> 
		app := express()
		<- { app, __dirname }
		
		MIDDLEWARES ! -> value
			BODY_PARSER :: { app } -> void app.use(bodyParser.json())
			
			HELMET :: { app } -> 
				app.use((req, res, next) => {
					res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
					res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
					res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Authorization, Access-Control-Request-Method, Access-Control-Request-Headers");
					res.setHeader('Access-Control-Allow-Credentials', true);
					res.setHeader('Access-Control-Allow-Authorization', true);

					next();
			}, helmet(), helmet.contentSecurityPolicy({
					accessControlAllowOrigin:'*',
					directives: {
						defaultSrc: ["'self'"],
						connectSrc: ["'self'", 'https://*'],
						fontSrc: ['*'],
						styleSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", '*'],
						workerSrc: ["'self'", 'data:', 'blob:'],
						frameSrc: [
							"'self'",
						],
						scriptSrc: [
							"'self'",
							"'unsafe-inline'",
							"'unsafe-eval'",
							'http://cdnjs.cloudflare.com/',
							'https://unpkg.com/',
							'http://localhost:*'
						],
						objectSrc: ["'none'"],
						imgSrc: ["'self'", 'data: *'],
						upgradeInsecureRequests: []
					},
					reportOnly: false
				}))
			
			PASSPORT :: { app } ->
				options := {
					secretOrKey: process.env.PRIVATE_KEY,
					jwtFromRequest: passportJwt.ExtractJwt.fromAuthHeaderAsBearerToken(),
				}
				
				jwtStrategy := new passportJwt.Strategy(options, async (payload, done) => {
				userData := {
							id: payload.id,
							username: payload.username,
					}
					// userData will be set as `req.user` in the `next` middleware
					done(null, userData)
				})
				passport.use(jwtStrategy)
				app.use(passport.initialize())
				
			STATIC :: { __dirname, app } -> 
			app.use(express.static("app/build"))
			<- { __dirname, app }

				ROUTER ! :: { __dirname, app } -> 
					/* 
					helper function 
					that catches errors 
					*/
				catchErrors := (fn) => (req, res, next) => fn(req, res, next).catch(next)
					/* 
					helper function 
					creating endpoints and
					handling goTo to requested node 
					*/
					listen := (path, access = "public", route = express.Router()) =>
					(path ? app.use(path, route) : true) && 
					((method, endpoint) => 
					route[method?.toLowerCase()]
					(endpoint, access === "public" ? 
					(req, res, next) => next() : 
					(req, res, next) => {  
						passport.authenticate("jwt", { session: false }, async (error,  payload) => {
							if (error || !payload) {
								<- res
									.status(401)
									.json({ error: "Unauthorized, invalid credentials." })
							}
							req.user = payload
							next()
						})(req, res, next)
					}, (req, res, next) => catchErrors(::go(method + req.url.split('?')[0])({ req, res, next }))) &&
					listen(null, access, route))
					<- { app , listen, __dirname }

					HOME :: { app, __dirname } ->
						app.get("/", (_, res) => ::go("/")({ res, __dirname }))
						app.get("/ABOUT", (_, res) => ::go("/ABOUT")({ res, __dirname }))
					
					MUSIC :: { app, listen } -> listen 
						("/MUSIC", "private")
						("GET", "/BY_AUTHOR")
						("GET", "/PIECE")
						("POST", "/INSERT")
						("DELETE", "/REMOVE")

					ACCOUNT :: { app, listen } -> listen
						("/ACCOUNT", "public")
						("POST", "/REGISTER")
						("PUT", "/LOGIN")
						("PUT", "/LOGOUT")

				HANDLE_ERRORS :: { app } -> ::go("SERVICE_ERROR_HANDLER")({ app })

				ERROR :: { app } -> 
					app.use((req, res, next) => {
						error := new Error("Not Found")
						error.status = 404
						next(error)
					})


		LISTEN ! :: { app } -> 
			PORT := process.env.PORT
			app.listen(PORT, err => {
				if (err) {
					setTimeout( ()=> {
						::leave("MODULES")
						::leave("MIDDLEWARES")
						::leave("SERVICE_ERROR_HANDLER")
						::leave("CONNECTION")
						::leave("ROUTER")
						::leave("APP")
						::leave("LISTEN")
						::go("MODULES")()
					}, 3000)
					console.log("Could not start. Trying again in 3 sec")
				}
				else {
					console.log(`Listening on port ${PORT}`)
				}
			})
			<- "Starting server!"
