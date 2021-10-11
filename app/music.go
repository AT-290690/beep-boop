GET/byAuthor -> 
 { req, res } := VALUE
 {  query: { author, page, perPage } } := req
 <- { res, author, page, perPage }
	byAuthor[parseQuery] -> { res: VALUE.res, author: VALUE.author?.trim() || '', page: +VALUE.page || 0, perPage: +VALUE.perPage || 10 }
		byAuthor[fetchFromDB] -> 
			{ res, author, page, perPage } := VALUE
			<- { 
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
			byAuthor[response] -> VALUE.result.length === 0 ? void #("byAuthor[parseQuery]")({ res: VALUE.res, author: "default", page: 0, perPage: 10 }) : VALUE.res.status(200).send(VALUE.result)

GET/piece -> 
	{ req, res } := VALUE
	result := await MEMO.collections.users.findOne({ title: req.query.title })
	if (result) {
		<- void #("sendError")({
				error: MEMO.serviceErrors.RECORD_NOT_FOUND.code,
				res
			})
	}
	<- { res, result }
	piece[response] -> VALUE.res.status(200).send(VALUE.result)

DELETE/remove -> 
	{ req, res } := VALUE
	{ title, sheet, speed, offset } := req.body;
	<- { title, sheet, res, username: req.user.username, speed, offset }
	mongoRemovePiece -> 
			{ title, username, res } := VALUE
			name := username + "'s " + title.trim()
			query := { title: name }
			MEMO.collections.music.deleteOne(query);
			<- res
		removePieceEnd -> VALUE.status(201).send({ success: 1 })

POST/insert -> 
			{ req, res } := VALUE
			{ title, sheet, speed, offset } := req.body;
			<- { title:title?.trim() || new Date().getTime(), sheet, res, username: req.user.username, speed, offset }
	createPiece -> 
			{ title, sheet, username, res, speed, offset } := VALUE
			name := username + "'s " + title
			query := { title: name }
			update := { $set: { title: name, username, speed, offset, sheet }}
			options := { upsert: true }
			<- { query, update, options, res }
		mongoCreatePiece -> { res: VALUE.res, result: await MEMO.collections.music.findOneAndUpdate(VALUE.query, VALUE.update, VALUE.options) }
			createPieceEnd -> VALUE.res.status(201).send({ success: 1 })	
		