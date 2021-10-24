GET/BY_AUTHOR :: { req, res } -> 
 {  query: { author, page, perPage } } := req
 <- { res, author, page, perPage }
	BY_AUTHOR[parseQuery] :: { res, author, page, perPage } -> { res, author: author?.trim() || '', page: +page || 0, perPage: +perPage || 10 }
		BY_AUTHOR[fetchFromDB] * :: { res, author, page, perPage } -> { 
				 res, 
				 result: await (
					MEMO.collections.music
						.find({ username: author })
						.sort({ $natural: -1 })
						.limit(perPage)
						.skip(page * perPage)
						.project({ _id: 0, username: 0 })
						.toArray()
						) 
				}
			BY_AUTHOR[response] :: { res, result } -> result.length === 0 ? void ::go("BY_AUTHOR[parseQuery]")({ res, author: "default", page: 0, perPage: 10 }) : res.status(200).send(result)

GET/PIECE * :: { req, res } -> 
	result := await MEMO.collections.users.findOne({ title: req.query.title })
	if (result) {
		<- void ::go("SEND_ERROR")({
				error: MEMO.serviceErrors.RECORD_NOT_FOUND.code,
				res
			})
	}
	<- { res, result }
	PIECE[response] :: { res, result } -> res.status(200).send(result)

DELETE/REMOVE :: { req, res } -> 
	{ title, sheet, speed, offset } := req.body;
	<- { title, sheet, res, username: req.user.username, speed, offset }
	MONGO_REMOVE_PIECE :: { title, username, res } -> 
			name := username + "'s " + title.trim()
			query := { title: name }
			MEMO.collections.music.deleteOne(query);
			<- res
		REMOVE_PIECE :: { status } -> status(201).send({ success: 1 })

POST/INSERT :: 	{ req, res } -> 
			{ title, sheet, speed, offset } := req.body;
			<- { title:title?.trim() || new Date().getTime(), sheet, res, username: req.user.username, speed, offset }
	CREATE_PIECE :: { title, sheet, username, res, speed, offset } -> 
			name := username + "'s " + title
			query := { title: name }
			update := { $set: { title: name, username, speed, offset, sheet }}
			options := { upsert: true }
			<- { query, update, options, res }
		MONGO_CREATE_PIECE * :: { query, update, options} -> { res, result: await MEMO.collections.music.findOneAndUpdate(query, update, options) }
			CREATE_PIECE_END :: { res } -> res.status(201).send({ success: 1 })	
		