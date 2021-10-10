GET/byAuthor -> 
 { req, res } := ::
 {  query: { author, page, perPage } } := req
 <- { res, author, page, perPage }
	byAuthor[parseQuery] -> { res: :::res, author: :::author?.trim() || '', page: +:::page || 0, perPage: +:::perPage || 10 }
		byAuthor[fetchFromDB] -> 
			{ res, author, page, perPage } := ::
			<- { 
				 res, 
				 result: await (
					@:collections.music
						.find({ username: author })
						.sort({ $natural: -1 })
						.limit(perPage)
						.skip(page * perPage)
						.project({ _id: 0, username: 0 })
						.toArray()
						) 
				}
			byAuthor[response] -> :::result.length === 0 ? void #("byAuthor[parseQuery]", { res: :::res, author: "default", page: 0, perPage: 10 }) : :::res.status(200).send(:::result)

GET/piece -> 
	{ req, res } := ::
	result := await @:collections.users.findOne({ title: req.query.title })
	if (result) {
		<- void #("sendError", {
				error: @:serviceErrors.RECORD_NOT_FOUND.code,
				res
			})
	}
	<- { res, result }
	piece[response] -> :::res.status(200).send(:::result)

DELETE/remove -> 
	{ req, res } := ::
	{ title, sheet, speed, offset } := req.body;
	<- { title, sheet, res, username: req.user.username, speed, offset }
	mongoRemovePiece -> 
			{ title, username, res } := ::
			name := username + "'s " + title.trim()
			query := { title: name }
			@:collections.music.deleteOne(query);
			<- res
		removePieceEnd -> :::status(201).send({ success: 1 })

POST/insert -> 
			{ req, res } := ::
			{ title, sheet, speed, offset } := req.body;
			<- { title:title?.trim() || new Date().getTime(), sheet, res, username: req.user.username, speed, offset }
	createPiece -> 
			{ title, sheet, username, res, speed, offset } := ::
			name := username + "'s " + title
			query := { title: name }
			update := { $set: { title: name, username, speed, offset, sheet }}
			options := { upsert: true }
			<- { query, update, options, res }
		mongoCreatePiece -> { res: :::res, result: await @:collections.music.findOneAndUpdate(:::query, :::update, :::options) }
			createPieceEnd -> :::res.status(201).send({ success: 1 })	
		