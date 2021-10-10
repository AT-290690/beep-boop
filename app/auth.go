POST/register ->
			{ req, res } := ::
			{ username, password } := req.body
			data := {
				username,
				password
			}
			<- { data, res }
			
	register[request] -> 
			{ data, res } := ::
			{ username, password } := data
			if (username.length <= 5) {
				<- void #("sendError", {
					error: @:serviceErrors.USERNAME_TOO_SHORT.code,
					res
				})
			}
			if (password.length <= 5) {
				<- void #("sendError", {
					error: @:serviceErrors.PASSWORD_TOO_SHORT.code,
					res
				})
			}
			if (await @:collections.users.findOne({ username })) {
				<- void #("sendError", {
						error: @:serviceErrors.DUPLICATE_USERNAME_RECORD.code,
						res
					})
			}
			
	
			hash := await @:helpers.hash(password, 10)
			<- { username, hash, res }

		createUser -> 
				{ username, hash, res } := ::
				query := { username }
				update := { $set: { username, password: hash } }
				options := { upsert: true }
				await @:collections.users.findOneAndUpdate(query, update, options)
				<- { username, res }

			redirectCreateUser -> void #("login[response]", { user: await @:collections.users.findOne({ username: :::username }), res: :::res })

PUT/login -> 
		{ req, res } := ::
		if (req.body.reg) <- void #("POST/register", { res, req })
		{ username, password } := req.body
		<- { username, password, res, req }
	login[request] -> 
  	{ username, password, res } := ::
	     user := await @:collections.users.findOne({ username })
		  	/*
				username is not case sensitive
				password is case sensitive
				*/
				if (!user || !user.password || !(await @:helpers.compare(password, user.password))) {
					<- void #("sendError", {
							error: @:serviceErrors.INVALID_SIGNIN.code, 
							res 
					 })
				}
				<- { user, res }
		login[response] ->
			{ user, res } := ::
			payload := {
				id: user._id,
				username: user.username
			}
			token := @:helpers.createToken(payload)
			res.status(200).send({ data: payload, token })
			

PUT/logout -> 
	{ req, res } := ::
		req.logout()
		res.status(200).send({ message: "Good bye. I will miss you :(" })
