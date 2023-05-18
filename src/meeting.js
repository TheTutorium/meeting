import { currentZIndex, setCurrentZIndex, history, setHistory, stage, setCanvasElements, canvasElements, changeInteractiveTool, receivePdf } from "./whiteboard.js";

let Peer = window.Peer;

let messagesEl = document.querySelector(".messages");
let peerIdEl = document.querySelector("#connect-to-peer");
let videoEl = document.querySelector(".remote-video");
export let currentCall = null;
let screenStream = null;

// Extract Peer IDs from the URL
const pathSegments = window.location.pathname.split("/");
let myPeerId = null;
let connectToPeerId = null;

if (pathSegments.length === 3) {
  const [segment1, segment2, segment3] = pathSegments;
  // Check if the path follows the format "tutoryum.com/{id1}/{id2}"
  const isValidPath = /^[a-zA-Z0-9_-]+$/.test(segment2) && /^[a-zA-Z0-9_-]+$/.test(segment3);

  if (isValidPath && segment1 === "") {
    myPeerId = segment2;
    connectToPeerId = segment3;
  }
}

let logMessage = (message) => {
    let newMessage = document.createElement("div");
    newMessage.innerText = message;
    messagesEl.appendChild(newMessage);
};

let renderVideo = (stream) => {
    videoEl.srcObject = stream;
};

// Register with the peer server
console.log(myPeerId);
export let peer = myPeerId!=null? new Peer(myPeerId,{
    host: "/",
    path: "/peerjs/myapp",
}):new Peer({
    host: "/",
    path: "/peerjs/myapp",
});

export let otherPeer = null;

let connectionInitiated = false;

peer.on("open", (id) => {
    logMessage("My peer ID is: " + id);
});

// Handle incoming voice/video connection
peer.on("call", (call) => {
    currentCall = call;
    navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
            call.answer(stream); // Answer the call with an A/V stream.
            call.on("stream", renderVideo);
        })
        .catch((err) => {
            console.error("Failed to get local stream", err);
        });
    navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
            document.getElementById("local-video").srcObject = stream;
        })
        .catch((err) => {
            console.error(err);
        });
});

// Initiate outgoing connection
let connectToPeer = () => {
    let peerId = connectToPeerId?connectToPeerId:peerIdEl.value;

    let conn = peer.connect(peerId);
    otherPeer = conn;

    peer.on("error", (error) => {
        // Connection error occurred
        conn.close();
        console.error("Could not connect to peer", peerId);
    
        // Check if the connection failed due to a specific error message
        if (error.type === "peer-unavailable") {
          // Retry connection after the specified interval
          console.log("Retrying connection to", peerId);
          setTimeout(() => {
            connectToPeer();
          }, 5000);
        } else {
          // Handle other connection errors
          console.error("Connection error:", error);
        }
      });

    conn.on("data", (data) => {
        if (!connectionInitiated) {
            connectionInitiated = true;
        } else {
            console.log(data);
            let splittedMessage = data.split("|");

            let tempPenType = parseInt(splittedMessage[0]);
            setCurrentZIndex(parseInt(splittedMessage[1]));

            if(tempPenType >= 0){
                setHistory(history + data + "\n");
            }

            if(tempPenType == 0){ // Pen
                let initX = parseFloat(splittedMessage[2]);
                let initY = parseFloat(splittedMessage[3]);
                let control1x = parseFloat(splittedMessage[4]);
                let control1y = parseFloat(splittedMessage[5]);
                let control2x = parseFloat(splittedMessage[6]);
                let control2y = parseFloat(splittedMessage[7]);
                let finalX = parseFloat(splittedMessage[8]);
                let finalY = parseFloat(splittedMessage[9]);
                let tempPenSize = parseInt(splittedMessage[10]);
                let tempPenColor = parseInt(splittedMessage[11]);

                let tempSprite = new PIXI.Graphics();

                tempSprite.lineStyle(tempPenSize, tempPenColor, 1);

                tempSprite.zIndex = currentZIndex;
                tempSprite.moveTo(initX, initY);
                tempSprite.bezierCurveTo(control1x, control1y, control2x, control2y, finalX, finalY);
    
                stage.addChild(tempSprite);
            }else if(tempPenType == 1){ // Eraser
                let initX = parseFloat(splittedMessage[2]);
                let initY = parseFloat(splittedMessage[3]);
                let control1x = parseFloat(splittedMessage[4]);
                let control1y = parseFloat(splittedMessage[5]);
                let control2x = parseFloat(splittedMessage[6]);
                let control2y = parseFloat(splittedMessage[7]);
                let finalX = parseFloat(splittedMessage[8]);
                let finalY = parseFloat(splittedMessage[9]);
                let tempEraserSize = parseInt(splittedMessage[10]);

                let tempSprite = new PIXI.Graphics();

                tempSprite.lineStyle(tempEraserSize, 0xffffff, 1);

                tempSprite.zIndex = currentZIndex;
                tempSprite.moveTo(initX, initY);
                tempSprite.bezierCurveTo(control1x, control1y, control2x, control2y, finalX, finalY);
    
                stage.addChild(tempSprite);
            }else if(tempPenType == 2){ // Typing
                let tempTextSize = parseInt(splittedMessage[2]);
                let tempTextColor = parseInt(splittedMessage[3]);
                let tempText = splittedMessage[4];
                let tempX = parseFloat(splittedMessage[5]);
                let tempY = parseFloat(splittedMessage[6]);
                
                let tempStyle = new PIXI.TextStyle({
                    fontFamily: "Arial",
                    fontSize: tempTextSize,
                    fill: tempTextColor,
                });

                let tempPText = new PIXI.Text(tempText, tempStyle);
                tempPText.zIndex = currentZIndex;
                tempPText.x = tempX;
                tempPText.y = tempY;

                stage.addChild(tempPText);
            }else if(tempPenType == 3){
                let temp_image = splittedMessage[2];
                let tempX = parseFloat(splittedMessage[3]);
                let tempY = parseFloat(splittedMessage[4]);

                const image_texture = PIXI.Texture.from(temp_image);
                const sprite = new PIXI.Sprite(image_texture);

                sprite.x = tempX;
                sprite.y = tempY;

                stage.addChild(sprite);
            }else if(tempPenType == -1){
                changeInteractiveTool(1);

                receivePdf(splittedMessage[1]);

            }

            
        
        }
    });

    navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
            document.getElementById("local-video").srcObject = stream;
        })
        .catch((err) => {
            console.error(err);
        });

    conn.on("open", () => {
        conn.send("hi!");
    });

    navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
            let call = peer.call(peerId, stream);
            currentCall = call;
            call.on("stream", renderVideo);
        })
        .catch((err) => {
            logMessage("Failed to get local stream", err);
        });
};

// Handle incoming data connection
peer.on("connection", (conn) => {
    otherPeer = conn;
    conn.on("data", (data) => {
        if (!connectionInitiated) {
            connectionInitiated = true;
        } else {

            console.log(data);
            let splittedMessage = data.split("|");

            let tempPenType = parseInt(splittedMessage[0]);
            setCurrentZIndex(parseInt(splittedMessage[1]));

            if(tempPenType >= 0){
                setHistory(history + data + "\n");
            }

            if(tempPenType == 0){ // Pen
                let initX = parseFloat(splittedMessage[2]);
                let initY = parseFloat(splittedMessage[3]);
                let control1x = parseFloat(splittedMessage[4]);
                let control1y = parseFloat(splittedMessage[5]);
                let control2x = parseFloat(splittedMessage[6]);
                let control2y = parseFloat(splittedMessage[7]);
                let finalX = parseFloat(splittedMessage[8]);
                let finalY = parseFloat(splittedMessage[9]);
                let tempPenSize = parseInt(splittedMessage[10]);
                let tempPenColor = parseInt(splittedMessage[11]);

                let tempSprite = new PIXI.Graphics();

                tempSprite.lineStyle(tempPenSize, tempPenColor, 1);

                tempSprite.zIndex = currentZIndex;
                tempSprite.moveTo(initX, initY);
                tempSprite.bezierCurveTo(control1x, control1y, control2x, control2y, finalX, finalY);
    
                stage.addChild(tempSprite);
            }else if(tempPenType == 1){ // Eraser
                let initX = parseFloat(splittedMessage[2]);
                let initY = parseFloat(splittedMessage[3]);
                let control1x = parseFloat(splittedMessage[4]);
                let control1y = parseFloat(splittedMessage[5]);
                let control2x = parseFloat(splittedMessage[6]);
                let control2y = parseFloat(splittedMessage[7]);
                let finalX = parseFloat(splittedMessage[8]);
                let finalY = parseFloat(splittedMessage[9]);
                let tempEraserSize = parseInt(splittedMessage[10]);

                let tempSprite = new PIXI.Graphics();

                tempSprite.lineStyle(tempEraserSize, 0xffffff, 1);

                tempSprite.zIndex = currentZIndex;
                tempSprite.moveTo(initX, initY);
                tempSprite.bezierCurveTo(control1x, control1y, control2x, control2y, finalX, finalY);
    
                stage.addChild(tempSprite);
            }else if(tempPenType == 2){ // Typing
                let tempTextSize = parseInt(splittedMessage[2]);
                let tempTextColor = parseInt(splittedMessage[3]);
                let tempText = splittedMessage[4];
                let tempX = parseFloat(splittedMessage[5]);
                let tempY = parseFloat(splittedMessage[6]);
                
                let tempStyle = new PIXI.TextStyle({
                    fontFamily: "Arial",
                    fontSize: tempTextSize,
                    fill: tempTextColor,
                });

                let tempPText = new PIXI.Text(tempText, tempStyle);
                tempPText.zIndex = currentZIndex;
                tempPText.x = tempX;
                tempPText.y = tempY;

                stage.addChild(tempPText);
            }else if(tempPenType == 3){
                let temp_image = splittedMessage[2];
                let tempX = parseFloat(splittedMessage[3]);
                let tempY = parseFloat(splittedMessage[4]);

                const image_texture = PIXI.Texture.from(temp_image);
                const sprite = new PIXI.Sprite(image_texture);

                sprite.x = tempX;
                sprite.y = tempY;

                stage.addChild(sprite);
            }else if(tempPenType == -1){
                changeInteractiveTool(1);

                receivePdf(splittedMessage[1]);
            }

        }
    });
    conn.on("open", () => {
        conn.send("hello!");
    });

});

// Close the connection for both peers
let disconnectFromPeer = () => {
    logMessage("Disconnecting from peer");
    currentCall.close();
    peer.disconnect();

    if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
        screenStream = null;
    }
};
  

window.connectToPeer = connectToPeer;
window.disconnectFromPeer = disconnectFromPeer;

if (connectToPeerId && myPeerId < connectToPeerId){
    connectToPeer();
}