/ :: { res, __dirname } -> res.sendFile(__dirname + "../public/index.html")
/ABOUT :: { res } -> res.status(200).json({ data: "This site is about music!" })