SERVICE_ERROR_HANDLER ! :: { app } -> 
			MEMO.serviceErrors = {
				/** Such a record does not exist (when it is expected to exist) */
				RECORD_NOT_FOUND: {
					code: 1,
					status: 404,
					message: "not found!",
				},
				/** The requirements do not allow more than one of username  resource */
				DUPLICATE_USERNAME_RECORD: {
					code: 2,
					status: 409,
					message: "Name not available!",
				},
				/** The requirements do not allow such an operation */
				OPERATION_NOT_PERMITTED: {
					code: 4,
					status: 500,
					message: "Not allowed!",
				},
				/** username/password mismatch */
				INVALID_SIGNIN: {
					code: 5,
					status: 500,
					message: "Invalid username/password",
				},
				RECORD_NOT_AVAILABLE: {
					code: 6,
					status: 409,
					message: "is not available!",
				},
				RECORD_GONE: {
					code: 8,
					status: 410,
					message: "Item no longer available!",
				},
				RESOURCE_IS_FORBIDDEN:{
					code:10,
					status:403,
					message: "action is forbidden.",
				},
				BANNED_USER: {
					code: 11,
					status: 403,
					message: "You are banned",
				},
				PLACEHOLDER_ERROR: {
					code: 14,
					status: 500,
					message: "Lorem ispum error",
				},
				PASSWORD_TOO_SHORT: {
					code: 15,
					status: 500,
					message: 'Password is too short(>=5)'
				},
				USERNAME_TOO_SHORT: {
					code: 16,
					status: 500,
					message: 'Username is too short(>=5)'
				}
			}

			MEMO.serviceErrorStack = Object.values(MEMO.serviceErrors).reduce((acc, item) => {
				acc.set(item.code, { status: item.status, message: item.message })
				<- acc
			}, new Map)
			
			<- { app }

	DEVELOPMENT :: { app } -> process.env.STAGE === key && app.use((err, req, res, next) => {
		err.stack = err.stack ?? ""
		errorDetails := {
			error: err.message,
			status: err.status,
			stackHighlighted: err.stack.split("\n").reduce((acc, item, index) => {
				acc[index] = item.trim()
				<- acc
			}, {}),
		}
		res.status(err.status ?? 500).send(errorDetails)
	})
	
	PRODUCTION :: { app } -> process.env.STAGE === key && app.use((err, req, res, next) => {
		res.status(err.status ?? 500).send({ error: err.message })
	})			