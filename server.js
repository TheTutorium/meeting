const express = require("express");
const { ExpressPeerServer } = require("peer");

const app = express();
const PORT = process.env.PORT || 3000;  // use port from environment if available

// make all the files in 'public' available
app.use("/scripts", express.static(__dirname + "/node_modules"));
app.use(express.static(__dirname + "/src"));
app.use("/public", express.static(__dirname + "/public"));

// setup routing
app.get("/", (request, response) => {
    response.sendFile(__dirname + "/public/index.html");
});

// Set headers for all routes
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// listen for requests
const server = app.listen(PORT, () => {
    console.log("Your app is listening on port " + server.address().port);
});

// peerjs server
const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: "/myapp",
});

app.use("/peerjs", peerServer);
