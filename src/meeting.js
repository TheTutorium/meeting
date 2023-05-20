import { handleWhiteboardData } from "./whiteboard.js";

let Peer = window.Peer;

export let peer;
export let currentCall;
export let conn;
let localStream;
let isConnecting = false;
let autoConnect = false;
let connectInterval;
let isOtherUserSharingScreen = false;

let microphoneOn = true;
let videoOn = true;
export let streamSenderVideo = null;
export let streamSenderAudio = null;

let myPeerId = null;
let connectToPeerId = null;

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

// Function to send data to the remote peer
export function sendDataToPeer(data) {
  if (conn) {
    conn.send(data);
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

// Function to mute the user's microphone and mute the stream that is sent to the remote peer
export const toggleMicrophoneOrVideo = (microphoneToggle, videoToggle) => {
  if (microphoneToggle) {
    microphoneOn = !microphoneOn;
    // Change the microphone icon
    if (microphoneOn) {
      document.getElementById('toggle-microphone-icon').className = 'microphone icon';
    }
    else {
      document.getElementById('toggle-microphone-icon').className = 'microphone slash icon';
    }
  }
  if (videoToggle) {
    videoOn = !videoOn;
    // Change the video icon
    if (videoOn) {
      document.getElementById('toggle-video-icon').className = 'video icon';
    }
    else {
      document.getElementById('toggle-video-icon').className = 'video slash icon';
    }
  }

  // If both video and microphone are off, send black screen with no audio to the remote peer
  if (!videoOn && !microphoneOn) {

    const blackStream = new MediaStream(); // Create a new MediaStream

    // Create a black video track with the same dimensions as the original video track
    const blackVideoTrack = document.createElement('canvas').captureStream().getVideoTracks()[0];
    blackVideoTrack.enabled = false; // Disable the black video track
    localStream = blackStream;
    localVideo.srcObject = blackStream;

    streamSenderVideo.replaceTrack(null);
    streamSenderAudio.replaceTrack(null);
    return;
  }

  // set remote stream
  navigator.mediaDevices.getUserMedia({ video: videoOn, audio: microphoneOn })
    .then(stream => {
      // replace the sender track with the new track
      streamSenderVideo.replaceTrack(stream.getVideoTracks()[0]);
      streamSenderAudio.replaceTrack(stream.getAudioTracks()[0]);
    })
    .catch(error => {
      console.error('Error accessing media devices:', error);
    });


  // set local stream
  if (!videoOn) {
    const blackStream = new MediaStream(); // Create a new MediaStream

    // Create a black video track with the same dimensions as the original video track
    const blackVideoTrack = document.createElement('canvas').captureStream().getVideoTracks()[0];
    blackVideoTrack.enabled = false; // Disable the black video track
    localStream = blackStream;
    localVideo.srcObject = blackStream;
    return;
  }
  else {
    navigator.mediaDevices.getUserMedia({ video: videoOn, audio: false })
      .then(stream => {
        localStream = stream;
        localVideo.srcObject = stream;
      })
      .catch(error => {
        console.error('Error accessing media devices:', error);
      });
  }
}
window.toggleMicrophoneOrVideo = toggleMicrophoneOrVideo;

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
      streamSenderVideo = currentCall.peerConnection.getSenders().find((s) => s.track.kind === stream.getVideoTracks()[0].kind);
      streamSenderAudio = currentCall.peerConnection.getSenders().find((s) => s.track.kind === stream.getAudioTracks()[0].kind);
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
  } else if (data === '|share-screen-start') {
    isOtherUserSharingScreen = true;
  } else if (data === '|share-screen-stop') {
    isOtherUserSharingScreen = false;
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
    path: "/peerjs/myapp"
  });

  if (myPeerId < connectToPeerId) {
    autoConnect = true;
    connectInterval = setInterval(handleDisconnect, 10000);
  }
}
else {
  peer = new Peer({
    host: "/",
    path: "/peerjs/myapp"
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
      streamSenderVideo = currentCall.peerConnection.getSenders().find((s) => s.track.kind === stream.getVideoTracks()[0].kind);
      streamSenderAudio = currentCall.peerConnection.getSenders().find((s) => s.track.kind === stream.getAudioTracks()[0].kind);
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
