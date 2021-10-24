import express from 'express';
import mongoDB from 'mongodb';
import dotevn from 'dotenv';
import bcrypt from 'bcrypt';
import URL from 'url';
import path from 'path';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import passport from "passport";
import passportJwt from 'passport-jwt';
import helmet from "helmet";

const MEMO = {};

>>->
MODULES ! -> 
	dotevn.config()
	__dirname := path.dirname(URL.fileURLToPath(import.meta.url))
	<- { __dirname }	

	CONNECTION * ! ->
		{ MongoClient } := mongoDB
		uri := process.env.DB
		mongoInstance := new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true
		})

	 await mongoInstance.connect(error => {
		if (error) <- console.log(error)
		MEMO.collections = {
			users: mongoInstance
			.db("test")
			.collection("users"),
			music: mongoInstance
			.db("test")
			.collection("music")
		}
		})

	APP * ! :: { __dirname } -> 
		app := express()
		~ ::go("MIDDLEWARES")({ __dirname, app })
   	~ ::go("ROUTER")({ __dirname, app })

		app.use((req, res, next) => {
			error := new Error("Not Found")
			error.status = 404
			next(error)
		})

		<- { app }

		LISTEN ! :: { app } -> 
			PORT := process.env.PORT
			app.listen(PORT, err => {
				if (err) {
					setTimeout( ()=> {
						::leave("MODULES")
						::leave("MIDDLEWARES")
						::leave("SERVICE_ERROR_HANDLER")
						::leave("CONNECTION")
						::leave("ROUTER")
						::leave("APP")
						::leave("LISTEN")
						::go("MODULES")()
					}, 3000)
					console.log("Could not start. Trying again in 3 sec")
				}
				else {
					console.log(`Listening on port ${PORT}`)
				}
			})
			<- "Starting server!"
