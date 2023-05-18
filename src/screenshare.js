import { currentCall  } from './meeting.js';

let shareScreen = () => {
    navigator.mediaDevices
      .getDisplayMedia({ video: true })
      .then((screenStream) => {
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = currentCall.peerConnection.getSenders().find((s) => s.track.kind === videoTrack.kind);
        sender.replaceTrack(videoTrack);
      })
      .catch((error) => {
        console.error("Error sharing screen:", error);
      });
  };

  window.shareScreen = shareScreen;