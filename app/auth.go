POST/REGISTER :: { req, res } ->
			{ username, password } := req.body
			data := {
				username,
				password
			}
			<- { data, res }
			
	REGISTER[request] * :: { data, res } -> 
			{ username, password } := data
			if (username.length <= 5) {
				<- void ::arrows["SEND_ERROR"]({
					error: MEMO.serviceErrors.USERNAME_TOO_SHORT.code,
					res
				})
			}
			if (password.length <= 5) {
				<- void ::arrows["SEND_ERROR"]({
					error: MEMO.serviceErrors.PASSWORD_TOO_SHORT.code,
					res
				})
			}
			if (~ MEMO.collections.users.findOne({ username })) {
				<- void ::arrows["SEND_ERROR"]({
						error: MEMO.serviceErrors.DUPLICATE_USERNAME_RECORD.code,
						res
					})
			}
			
	
			hash := ~ bcrypt.hash(password, 10)
			<- { username, hash, res }

		CREATE_USER * :: { username, hash, res } -> 
				query := { username }
				update := { $set: { username, password: hash } }
				options := { upsert: true }
				~ MEMO.collections.users.findOneAndUpdate(query, update, options)
				<- { username, res }

			REDIRECT_CREATE_USER * :: { username, res } -> void ::go("LOGIN[response]")({ user: ~ MEMO.collections.users.findOne({ username: username }), res })

PUT/LOGIN :: { req, res } -> 
		if (req.body.reg) <- void ::go("POST/REGISTER")({ res, req })
		{ username, password } := req.body
		<- { username, password, res, req }

	LOGIN[request] * :: { username, password, res } -> 
	     user := ~ MEMO.collections.users.findOne({ username })
		  	/*
				username is not case sensitive
				password is case sensitive
				*/
				if (!user || !user.password || !(~ bcrypt.compare(password, user.password))) {
					<- void ::arrows["SEND_ERROR"]({
							error: MEMO.serviceErrors.INVALID_SIGNIN.code, 
							res 
					 })
				}
				<- { user, res }

		LOGIN[response] * :: { user, res } ->
			payload := {
				id: user._id,
				username: user.username
			}
			token := ::arrows["JWT"]({ payload })
			res.status(200).send({ data: payload, token })
			

PUT/LOGOUT :: { req, res } -> 
		req.logout()
		res.status(200).send({ message: "Good bye. I will miss you :(" })
