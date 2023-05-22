import { currentCall, sendDataToPeer, streamSenderVideo, streamSenderAudio, toggleMicrophoneOrVideo, videoOn, changeIsUserStreaming } from './meeting.js';
import { screenShareClicked, chatView, currentInteractiveTool, setCurrentInteractiveTool } from './whiteboard.js';

let screenStream = null; // Variable to store the screen sharing stream
export let currentlySharing = false;

let shareScreen = () => {

  // If the user is already sharing their screen, do nothing
  if (currentlySharing || currentInteractiveTool == 2) {
    return;
  }

  navigator.mediaDevices.getDisplayMedia({ video: true })
    .then((stream) => {

      screenShareClicked();
      screenStream = stream;

      // Listen for "ended" event on the screen sharing track
      const screenTrack = screenStream.getVideoTracks()[0];
      screenTrack.addEventListener("ended", handleScreenShareEnded);

      // make video button in index.html hidden
      document.getElementById('toggle-video').classList.add('hidden');

      const videoTrack = screenStream.getVideoTracks()[0];
      streamSenderVideo.replaceTrack(videoTrack);
      currentlySharing = true;

      // make screenshare button in index.html show
      document.getElementById('stopScreenShareButton').classList.remove('hidden');

      if (!videoOn) {
        changeIsUserStreaming(true);
      }
    })
    .catch((error) => {
      console.error("Error sharing screen:", error);
    });
};

// stop the screen sharing by button
export let stopScreenShare = () => {
  if (screenStream) {
    screenStream.getTracks().forEach((track) => track.stop());

    // call the handleScreenShareEnded function
    const screenTrack = screenStream.getVideoTracks()[0];
    
    handleScreenShareEnded(screenTrack);
  }
};
window.stopScreenShare = stopScreenShare;

function handleScreenShareEnded(event) {

  // Replace the video track of the peer connection sender with the camera video track
  // Store the camera video stream
  toggleMicrophoneOrVideo(false, false);
  setCurrentInteractiveTool(-2);
  
  chatView();

  // make video button in index.html hidden
  document.getElementById('toggle-video').classList.remove('hidden');

  // Remove the "ended" event listener
  const screenTrack = event.target;
  if (screenTrack) {
    screenTrack.removeEventListener("ended", handleScreenShareEnded);
  }
  currentlySharing = false;

  // make screenshare button in index.html hidden
  document.getElementById('stopScreenShareButton').classList.add('hidden');

  // if user is not streaming video, send data to the other peer
  if (!videoOn) {
    changeIsUserStreaming(false);
  }
}

window.shareScreen = shareScreen;
