modules -> 
	imports := {
		express: (await import("express")).default,
		mongoDB: (await import("mongodb")).default,
		dotevn: await import("dotenv"),
		bcrypt: (await import("bcrypt")).default
	}

	miscs := {
		URL: await import("url"),
		path: await import("path"),
	}

	@:helpers = {
		hash: imports.bcrypt.hash,
		compare: imports.bcrypt.compare
	}
	
	imports.dotevn.config()
	__dirname := miscs.path.dirname(miscs.URL.fileURLToPath(import.meta.url))
	<- { imports, __dirname }	

	connection ->
		{ MongoClient } := :::imports.mongoDB
		uri := process.env.DB
		mongoInstance := new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true
		})

	 await mongoInstance.connect(error => {
		if (error) <- console.log(error)
		@:collections = {
			users: mongoInstance
			.db("test")
			.collection("users"),
			music: mongoInstance
			.db("test")
			.collection("music")
		}
		})

	app -> 
		{ imports,  __dirname } := ::
		app := imports.express()
		await #("middlewares", { imports, __dirname, app })
   	await #("router", { imports, __dirname, app })

		app.use((req, res, next) => {
			error := new Error("Not Found")
			error.status = 404
			next(error)
		})
		<- { app }

		listen -> 
			{ app } := ::
			PORT := process.env.PORT
			app.listen(PORT, err => {
				if (err) console.log("could not start")
				else {
					console.log(`Listening on port ${PORT}`)
					// block these nodes
					!#("modules")
					!#("middlewares")
					!#("serviceErrorHandler")
					!#("connection")
					!#("router")
					!#("app")
					!#("listen")
					!#("serviceErrorHandler")
				}
			})
			<- "Starting server!"

	
		
		
		
