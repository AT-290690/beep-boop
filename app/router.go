router -> 
		{ imports, __dirname, app } := VALUE
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
		listen := (path, access = "public", route = imports.express.Router()) => 
		(path ? app.use(path, route) : true) && 
		((method, endpoint) => 
		route[method.toLowerCase()]
		(endpoint, access === "public" ? 
		(req, res, next) => next() : 
		MEMO.authenticate , (req, res, next) => catchErrors(#(method + req.url.split('?')[0])({ req, res, next }))) &&
		listen(null, access, route))
		<- { app , listen, __dirname }

	home ->
	  { app, __dirname } := VALUE
	  app.get("/", (_, res) => #("/")({ res, __dirname }))
		app.get("/about", (_, res) => #("/about")({ res, __dirname }))
	
	music -> 
		{ app, listen } := VALUE
		listen("/music", "private")
		("GET", "/byAuthor")
		("GET", "/piece")
		("POST", "/insert")
		("DELETE", "/remove")

	account -> 
		{ app, listen } := VALUE
		listen("/account", "public")
		("POST", "/register")
		("PUT", "/login")
		("PUT", "/logout")

