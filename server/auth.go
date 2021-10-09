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
				<- { query, update, options, res }

			mongoCreateUser -> { res: :::res, result: await @:collections.users.findOneAndUpdate(:::query, :::update, :::options) }

				mongoCreateUserEnd -> :::res.status(201).send(:::result)	

PUT/login -> 
		{ req, res } := ::
		{ username, password } := req.body
		<- { username, password, res, req }
	login[request] -> 
  	{ username, password, res, req } := ::
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
