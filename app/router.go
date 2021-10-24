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
		MEMO.authenticate , (req, res, next) => catchErrors(::go(method + req.url.split('?')[0])({ req, res, next }))) &&
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

