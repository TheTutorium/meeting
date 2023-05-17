import { currentZIndex, setCurrentZIndex, history, setHistory, stage, setCanvasElements, canvasElements } from "./whiteboard.js";

let Peer = window.Peer;

let messagesEl = document.querySelector(".messages");
let peerIdEl = document.querySelector("#connect-to-peer");
let videoEl = document.querySelector(".remote-video");
export let currentCall = null;
let screenStream = null;


let logMessage = (message) => {
    let newMessage = document.createElement("div");
    newMessage.innerText = message;
    messagesEl.appendChild(newMessage);
};

let renderVideo = (stream) => {
    videoEl.srcObject = stream;
};

// Register with the peer server
export let peer = new Peer({
    host: "/",
    path: "/peerjs/myapp",
});

export let otherPeer = null;

let connectionInitiated = false;

peer.on("open", (id) => {
    logMessage("My peer ID is: " + id);
});
peer.on("error", (error) => {
    console.error(error);
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
    let peerId = peerIdEl.value;

    let conn = peer.connect(peerId);
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
                let temp_pdf = splittedMessage[1];

                const arr = temp_pdf.split(",").map(Number);
                const uint8arr = new Uint8Array(arr);

                console.log(uint8arr);
                

                pdfjsLib.getDocument(uint8arr).promise.then(function(pdf) {
                    var pages = Array.from(Array(pdf.numPages).keys());
                    return Promise.all(pages.map(function(num) {
                    return pdf.getPage(num + 1);
                    }));
                }).then(function(pages) {
                    
                    var iframe = document.getElementById('pdf-iframe');
                    setCanvasElements(pages.map(function(page) {
                        var canvas = document.createElement('canvas');
                        console.log(iframe);
                        var scale = Math.min(iframe.clientWidth / page.getViewport({scale: 1}).width, iframe.clientHeight / page.getViewport({scale: 1}).height);
                        var viewport = page.getViewport({scale: scale * 1.3});
                        canvas.width = viewport.width;
                        canvas.height = viewport.height;
                        page.render({canvasContext: canvas.getContext('2d'), viewport: viewport}).promise.then(function() {});
                        return canvas;
                    }));
                    
                    var doc = iframe.contentWindow.document;
                    doc.open();
                    doc.write("<html><body></body></html>");
                    canvasElements.forEach(function(canvas) {
                    doc.body.appendChild(canvas);
                    });
                    doc.close();
                });
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




/// whiteboard related
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
                let temp_pdf = splittedMessage[1];

                const arr = temp_pdf.split(",").map(Number);
                const uint8arr = new Uint8Array(arr);

                console.log(uint8arr);
                

                pdfjsLib.getDocument(uint8arr).promise.then(function(pdf) {
                    var pages = Array.from(Array(pdf.numPages).keys());
                    return Promise.all(pages.map(function(num) {
                    return pdf.getPage(num + 1);
                    }));
                }).then(function(pages) {
                    
                    var iframe = document.getElementById('pdf-iframe');
                    canvasElements = pages.map(function(page) {
                        var canvas = document.createElement('canvas');
                        console.log(iframe);
                        var scale = Math.min(iframe.clientWidth / page.getViewport({scale: 1}).width, iframe.clientHeight / page.getViewport({scale: 1}).height);
                        var viewport = page.getViewport({scale: scale * 1.3});
                        canvas.width = viewport.width;
                        canvas.height = viewport.height;
                        page.render({canvasContext: canvas.getContext('2d'), viewport: viewport}).promise.then(function() {});
                        return canvas;
                    });
                    
                    var doc = iframe.contentWindow.document;
                    doc.open();
                    doc.write("<html><body></body></html>");
                    canvasElements.forEach(function(canvas) {
                    doc.body.appendChild(canvas);
                    });
                    doc.close();
                });
            }

        }
    });
    conn.on("open", () => {
        conn.send("hello!");
    });
});