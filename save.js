const functions = require("firebase-functions");
const express = require("express");
const app = express();
const PORT = 3000;

app.get("/", (req, res)=> res.send("HELLO WORLD"));

app.listen(PORT, console.log("server is running on port 3000"));

exports.app = functions.https.onRequest(app);