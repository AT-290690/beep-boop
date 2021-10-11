POST/register ->
			{ req, res } := VALUE
			{ username, password } := req.body
			data := {
				username,
				password
			}
			<- { data, res }
			
	register[request] -> 
			{ data, res } := VALUE
			{ username, password } := data
			if (username.length <= 5) {
				<- void #("sendError")({
					error: MEMO.serviceErrors.USERNAME_TOO_SHORT.code,
					res
				})
			}
			if (password.length <= 5) {
				<- void #("sendError")({
					error: MEMO.serviceErrors.PASSWORD_TOO_SHORT.code,
					res
				})
			}
			if (await MEMO.collections.users.findOne({ username })) {
				<- void #("sendError")({
						error: MEMO.serviceErrors.DUPLICATE_USERNAME_RECORD.code,
						res
					})
			}
			
	
			hash := await MEMO.helpers.hash(password, 10)
			<- { username, hash, res }

		createUser -> 
				{ username, hash, res } := VALUE
				query := { username }
				update := { $set: { username, password: hash } }
				options := { upsert: true }
				await MEMO.collections.users.findOneAndUpdate(query, update, options)
				<- { username, res }

			redirectCreateUser -> void #("login[response]")({ user: await MEMO.collections.users.findOne({ username: VALUE.username }), res: VALUE.res })

PUT/login -> 
		{ req, res } := VALUE
		if (req.body.reg) <- void #("POST/register")({ res, req })
		{ username, password } := req.body
		<- { username, password, res, req }
	login[request] -> 
  	{ username, password, res } := VALUE
	     user := await MEMO.collections.users.findOne({ username })
		  	/*
				username is not case sensitive
				password is case sensitive
				*/
				if (!user || !user.password || !(await MEMO.helpers.compare(password, user.password))) {
					<- void #("sendError")({
							error: MEMO.serviceErrors.INVALID_SIGNIN.code, 
							res 
					 })
				}
				<- { user, res }
		login[response] ->
			{ user, res } := VALUE
			payload := {
				id: user._id,
				username: user.username
			}
			token := MEMO.helpers.createToken(payload)
			res.status(200).send({ data: payload, token })
			

PUT/logout -> 
	{ req, res } := VALUE
		req.logout()
		res.status(200).send({ message: "Good bye. I will miss you :(" })
