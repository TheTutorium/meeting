import { currentZIndex, setCurrentZIndex, history, setHistory, stage, setCanvasElements, canvasElements, changeInteractiveTool, receivePdf, goToPageHelper } from "./whiteboard.js";

let Peer = window.Peer;

export let peer;
export let currentCall;
export let conn;
let localStream;
let isConnecting = false;
let autoConnect = false;
let connectInterval;

let myPeerId = null;
let connectToPeerId = null;

// whiteboard related variables
let connectionInitiated = false;

// html content
let remoteVideo = document.getElementById("remote-video");
let localVideo = document.getElementById("local-video");
let customOtherPeerId = document.querySelector("#connect-to-peer");
const connectButton = document.getElementById('connectButton');
const disconnectButton = document.getElementById('disconnectButton');

function checkPath() {
  // Extract Peer IDs from the URL
  const pathSegments = window.location.pathname.split("/");

  if (pathSegments.length === 3) {
    const [segment1, segment2, segment3] = pathSegments;
    // Check if the path follows the format "tutoryum.com/{id1}/{id2}"
    const isValidPath = /^[a-zA-Z0-9_-]+$/.test(segment2) && /^[a-zA-Z0-9_-]+$/.test(segment3);

    if (isValidPath && segment1 === "") {
      myPeerId = segment2;
      connectToPeerId = segment3;
    }
  }
}

// Function to handle the "Connect" button click
function handleConnect() {
  if (isConnecting && !autoConnect) {
    alert('Connection in progress. Please wait...');
    return;
  }

  const localPeerId = peer.id;
  if (!connectToPeerId) {
    connectToPeerId = customOtherPeerId.value;
  }
  const remotePeerId = connectToPeerId;

  if (!localPeerId || !remotePeerId) {
    alert('Please enter your Peer ID and the Peer ID to connect.');
    return;
  }

  if (localPeerId === remotePeerId) {
    alert('Please enter different Peer IDs for yourself and the peer you want to connect with.');
    return;
  }

  isConnecting = true;
  conn = peer.connect(remotePeerId); // Connect to the remote peer
  conn.on('open', () => {
    clearInterval(connectInterval);
    autoConnect = false;
    connectButton.disabled = true; // Disable the button after successful connection
    disconnectButton.disabled = false;

    conn.send('|video-call-request'); // Send a video call request to the remote peer
    isConnecting = false;
  });
  conn.on('data', handleData); // Event listener for the received data

  // Event listener for the "close" event, fired when the connection is closed
  conn.on('close', () => {
    enableConnection(); // Enable the connection after disconnection
    handleDisconnect();
  });
}

// Function to handle the "Disconnect" button click
function handleDisconnect() {
  if (isConnecting && !autoConnect) {
    alert('Cannot disconnect while a connection is in progress.');
    return;
  }

  if (currentCall) {
    currentCall.close();
  }

  if (conn) {
    conn.close(); // Close the connection
    conn = null;
  }

  if (localStream) {
    localStream.getTracks().forEach(track => track.stop()); // Stop the local media stream
    localStream = null;
  }

  localVideo.srcObject = null; // Clear the local video stream
  remoteVideo.srcObject = null; // Clear the remote video stream

  connectButton.disabled = false; // Enable the "Connect" button
  disconnectButton.disabled = true; // Disable the "Disconnect" button

  if (autoConnect) {
    handleConnect();
  }
}

// Function to enable the connection after a disconnection
function enableConnection() {
  disconnectButton.disabled = true; // Disable the "Disconnect" button
  connectButton.disabled = false; // Enable the "Connect" button
}

// Function to initiate the video call
function startVideoCall() {
  navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
      currentCall = peer.call(connectToPeerId, stream); // Initiate the call with the remote peer
      currentCall.on('stream', handleStream); // Event listener for the incoming stream
    })
    .catch(error => {
      console.error('Error accessing media devices:', error);
    });

  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
      localVideo.srcObject = stream;
    })
    .catch(error => {
      console.error('Error accessing media devices:', error);
    });
}

// whiteboard related data handling
function handleWhiteboardData(data) {
  if (!connectionInitiated) {
    connectionInitiated = true;
  } else {
    let splittedMessage = data.split("|");

    let tempPenType = parseInt(splittedMessage[0]);
    setCurrentZIndex(parseInt(splittedMessage[1]));

    if (tempPenType >= 0) {
      setHistory(history + data + "\n");
    }

    if (tempPenType == 0) { // Pen
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
    } else if (tempPenType == 1) { // Eraser
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
    } else if (tempPenType == 2) { // Typing
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
    } else if (tempPenType == 3) {
      let temp_image = splittedMessage[2];
      let tempX = parseFloat(splittedMessage[3]);
      let tempY = parseFloat(splittedMessage[4]);

      const image_texture = PIXI.Texture.from(temp_image);
      const sprite = new PIXI.Sprite(image_texture);

      sprite.x = tempX;
      sprite.y = tempY;

      stage.addChild(sprite);
    } else if (tempPenType == -1) {
      changeInteractiveTool(1);

      receivePdf(splittedMessage[1]);

    } else if (tempPenType == -2) {
      //While not looking pdf rendering does not work correctly
      goToPageHelper(parseInt(splittedMessage[1]));
    }

  }
}

// Function to handle the received data from the remote peer
function handleData(data) {
  if (data[0] != '|') {
    handleWhiteboardData(data);
    return;
  }
  if (data === '|video-call-request') {
    // Handle the received video call request
    if (confirm('Incoming video call. Do you want to accept?')) {
      conn.send('|video-call-accept'); // Send an acceptance message to the remote peer
    } else {
      conn.send('|video-call-reject'); // Send a rejection message to the remote peer
      conn.close(); // Close the connection
      connectButton.disabled = false; // Enable the "Connect" button
      isConnecting = false;
    }
  } else if (data === '|video-call-accept') {
    // Handle the acceptance message from the remote peer
    startVideoCall();
  } else if (data === '|video-call-reject') {
    // Handle the rejection message from the remote peer
    alert('The video call request was rejected.');
    conn.close(); // Close the connection
    connectButton.disabled = false; // Enable the "Connect" button
    isConnecting = false;
  }
}

// Function to handle the incoming video stream from the remote peer
function handleStream(stream) {
  remoteVideo.srcObject = stream;
}

checkPath();

// Initialize the PeerJS connection
if (connectToPeerId && myPeerId) {
  peer = new Peer(myPeerId, {
    host: "/",
    path: "/peerjs/myapp",
    port: 3000,
  });

  if (myPeerId < connectToPeerId) {
    autoConnect = true;
    connectInterval = setInterval(handleDisconnect, 10000);
  }
}
else {
  peer = new Peer({
    host: "/",
    path: "/peerjs/myapp",
    port: 3000
  });
}

// Event listener for the "open" event, fired when the connection to PeerServer is established
peer.on('open', () => {
  console.log('Connected with peer ID:', peer.id);
  connectButton.disabled = false; // Enable the "Connect" button
});

// Event listener for the "connection" event, fired when a connection with a remote peer is established
peer.on('connection', connection => {
  conn = connection;
  conn.on('data', handleData); // Event listener for the received data
  // Event listener for the "close" event, fired when the connection is closed
  conn.on('close', () => {
    enableConnection(); // Enable the connection after disconnection
    handleDisconnect();
  });
  connectButton.disabled = true; // Disable the button after successful connection
  disconnectButton.disabled = false;
});

// Event listener for the "call" event, fired when a call from a remote peer is received
peer.on('call', call => {
  currentCall = call;
  navigator.mediaDevices
    .getUserMedia({ video: true, audio: true })
    .then((stream) => {
      call.answer(stream); // Answer the call with an A/V stream.
      call.on("stream", handleStream);
    })
    .catch((err) => {
      console.error("Failed to get local stream", err);
    });

  navigator.mediaDevices
    .getUserMedia({ video: true, audio: false })
    .then((stream) => {
      localStream = stream;
      localVideo.srcObject = stream;
    })
    .catch((err) => {
      console.error("Failed to get local stream", err);
    });
});

// Event listener for the "error" event, fired when an error occurs
peer.on('error', error => {
  console.error('PeerJS error:', error);
  handleDisconnect(); // Handle errors by disconnecting
});

// Event listener for the "click" event on the "Connect" button
connectButton.addEventListener('click', handleConnect);

// Event listener for the "click" event on the "Disconnect" button
disconnectButton.addEventListener('click', handleDisconnect);
