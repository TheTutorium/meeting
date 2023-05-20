import { currentCall } from './meeting.js';

let screenStream = null; // Variable to store the screen sharing stream
let currentlySharing = false;

let shareScreen = () => {

  // If the user is already sharing their screen, do nothing
  if (currentlySharing) {
    return;
  }

  navigator.mediaDevices.getDisplayMedia({ video: true })
    .then((stream) => {
      screenStream = stream;

      // Listen for "ended" event on the screen sharing track
      const screenTrack = screenStream.getVideoTracks()[0];
      screenTrack.addEventListener("ended", handleScreenShareEnded);

      const videoTrack = screenStream.getVideoTracks()[0];
      const sender = currentCall.peerConnection.getSenders().find((s) => s.track.kind === videoTrack.kind);
      sender.replaceTrack(videoTrack);
      currentlySharing = true;
    })
    .catch((error) => {
      console.error("Error sharing screen:", error);
    });
};

function handleScreenShareEnded(event) {

  // Replace the video track of the peer connection sender with the camera video track
  // Store the camera video stream
  navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {

      const videoTrack = stream.getVideoTracks()[0];
      const sender = currentCall.peerConnection.getSenders().find((s) => s.track.kind === videoTrack.kind);
      sender.replaceTrack(videoTrack);
    })
    .catch((error) => {
      console.error("Error accessing camera stream:", error);
    });

  // Remove the "ended" event listener
  const screenTrack = event.target;
  screenTrack.removeEventListener("ended", handleScreenShareEnded);
  currentlySharing = false;
}

window.shareScreen = shareScreen;
