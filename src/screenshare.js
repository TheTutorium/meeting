import { currentCall  } from './meeting.js';

let shareScreen = () => {
    navigator.mediaDevices
      .getDisplayMedia({ video: true })
      .then((screenStream) => {
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = currentCall.peerConnection.getSenders().find((s) => s.track.kind === videoTrack.kind);
        sender.replaceTrack(videoTrack);
  
        // Create a new video element for the shared screen
        const sharedScreenVideo = document.createElement("video");
        sharedScreenVideo.srcObject = screenStream;
        sharedScreenVideo.autoplay = true;
        sharedScreenVideo.classList.add("shared-screen");
  
        // Append the shared screen video element to the HTML body
        document.body.appendChild(sharedScreenVideo);
      })
      .catch((error) => {
        console.error("Error sharing screen:", error);
      });
  };

  window.shareScreen = shareScreen;