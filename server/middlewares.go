middlewares ->
  { imports, __dirname, app } := ::
	{ express } := imports
	<- { express, imports, __dirname, app }

	bodyParser -> void :::app.use((await import("body-parser")).default.json())
	
	helmet -> 
		{ app, imports } := ::
		helmet := (await import("helmet")).default
		app.use(helmet(), helmet.contentSecurityPolicy({
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
				],
				objectSrc: ["'none'"],
				imgSrc: ["'self'", 'data: *'],
				upgradeInsecureRequests: []
			},
			reportOnly: false
		}))

	static -> 
		{ express, __dirname, app } := ::
		app.use(express.static("server/dist/public"))
		#("serviceErrorHandler", { app })
		<- { app }
	
	passport ->
		{ app } := ::
		passport := (await import("passport")).default
		passportJwt := (await import("passport-jwt")).default
		options := {
			secretOrKey: process.env.PRIVATE_KEY,
			jwtFromRequest: passportJwt.ExtractJwt.fromAuthHeaderAsBearerToken(),
		}
		@:extractToken = (req) => {
			if (req.headers.authorization && req.headers.authorization.split(' ')[0] === "Bearer") {
					<- req.headers.authorization.split(' ')[1];
			}
			<- null;
		}
		
	  @:authenticate = async (req, res, next) => {  
			passport.authenticate("jwt", { session: false }, async (error,  payload) => {
				if (error || !payload) {
					<- res
						.status(401)
						.json({ error: "Unauthorized, invalid credentials." })
				}
				req.user = payload
				next()
			})(req, res, next)
		};
		
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

	jwt ->
  	jwt := (await import("jsonwebtoken")).default
		// helper for creating token
		@:helpers.createToken = (payload) => {
			token := jwt.sign(payload, process.env.PRIVATE_KEY, { expiresIn: +process.env.TOKEN_LIFETIME })
			<- token
		}
