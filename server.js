const express = require("express");
const { ExpressPeerServer } = require("peer");
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;  // use port from environment if available

// make all the files in 'public' available
app.use("/scripts", express.static(__dirname + "/node_modules"));
app.use(express.static(__dirname + "/src"));
app.use("/public", express.static(__dirname + "/public"));
app.use(morgan('combined')); // Specify the desired log format

// setup routing
app.get("/", (request, response) => {
    response.sendFile(__dirname + "/public/index.html");
});

// assigned id version
app.get("/:id1/:id2", (request, response) => {
    const id1 = request.params.id1;
    const id2 = request.params.id2;
  
    // Perform your desired operations or logic with id1 and id2
    // For example, you can establish a peer-to-peer connection using these IDs
    response.sendFile(__dirname + "/public/index.html");
  
    // Send a response back to the client
    //res.send(`Connected to peer ${id2} using peer ID ${id1}`);
  });

// Set headers for all routes
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use((err, req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    console.error(err);
    // res.status(500).send('Internal Server Error');
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
