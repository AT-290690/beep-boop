/ -> VALUE.res.sendFile(VALUE.__dirname + "../public/index.html")
/about -> VALUE.res.status(200).json({ data: "This site is about music!" })