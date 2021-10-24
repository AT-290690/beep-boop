

SEND_ERROR :: { res, error } -> res.status(MEMO.serviceErrorStack.get(error).status).send({ error: MEMO.serviceErrorStack.get(error).message })

JWT :: { payload } ->
	// helper for creating token
		token := jwt.sign(payload, process.env.PRIVATE_KEY, { expiresIn: +process.env.TOKEN_LIFETIME })
<- token

EXTRACT_TOKEN -> (req) => {
	if (req.headers.authorization && req.headers.authorization.split(' ')[0] === "Bearer") {
			<- req.headers.authorization.split(' ')[1];
	}
	<- null;
}