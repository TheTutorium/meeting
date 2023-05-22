let isUserSpeaking = false;
let isOtherUserSpeaking = false;

let currentMicrophoneStreamCurrentUser = null; // Variable to hold the current audio stream
let isMicrophoneCheckRunningCurrentUser = false; // Flag to indicate if the detection is running

let currentMicrophoneStreamOtherUser = null; // Variable to hold the current audio stream
let isMicrophoneCheckRunningOtherUser = false; // Flag to indicate if the detection is running

let lastTimeCurrentUserSpoke = 0;
let lastTimeOtherUserSpoke = 0;

// Function to start tracking speech activity for a given stream
export function startTrackingMicrophone(stream, isCurrentUser) {
    if (isCurrentUser && isMicrophoneCheckRunningCurrentUser) {
        return;
    }
    else if (!isCurrentUser && isMicrophoneCheckRunningOtherUser) {
        return;
    }

    // Stop the previous stream, if any
    stopTrackingMicrophone(isCurrentUser);

    // Assign the new stream
    if (isCurrentUser) {
        currentMicrophoneStreamCurrentUser = stream;
    }
    else {
        currentMicrophoneStreamOtherUser = stream;
    }

    // Get the audio context and create the analyser
    const audioContext = new AudioContext();
    const microphone = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();

    // Connect the microphone to the analyser
    microphone.connect(analyser);

    // Set the desired parameters for the analyser
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Set the flag to indicate that the detection is running
    if (isCurrentUser) {
        isMicrophoneCheckRunningCurrentUser = true;
    }
    else {
        isMicrophoneCheckRunningOtherUser = true;
    }

    // Function to check if the user is speaking
    function isSpeakingCheck() {
        analyser.getByteTimeDomainData(dataArray);
        let sum = 0;

        // Calculate the average value of the audio data
        for (let i = 0; i < bufferLength; i++) {
            sum += Math.abs(dataArray[i] - 128);
        }

        // Calculate the average volume level
        const volume = sum / bufferLength;

        // Adjust the threshold value as per your requirement
        const threshold = 3;

        // Check if the volume exceeds the threshold
        const isSpeaking = volume > threshold;

        // You can do something based on the result
        if (isSpeaking) {
            // User is speaking
            if (isCurrentUser) {
                isUserSpeaking = true;
                document.getElementById('video-container2').classList.remove('video-container2NotSpeaking');
                document.getElementById('video-container2').classList.add('video-container2Speaking');
                lastTimeCurrentUserSpoke = Date.now();
            }
            else {
                isOtherUserSpeaking = true;
                document.getElementById('video-container1').classList.remove('video-container1NotSpeaking');
                document.getElementById('video-container1').classList.add('video-container1Speaking');
                lastTimeOtherUserSpoke = Date.now();
            }
        } else {
            if (isCurrentUser) {
                isUserSpeaking = false;
                // check if the last time current user spoke was more than 700ms ago
                if (Date.now() - lastTimeCurrentUserSpoke > 700) {
                    document.getElementById('video-container2').classList.remove('video-container2Speaking');
                    document.getElementById('video-container2').classList.add('video-container2NotSpeaking');
                }
            }
            else {
                isOtherUserSpeaking = false;
                // check if the last time other user spoke was more than 700ms ago
                if (Date.now() - lastTimeOtherUserSpoke > 700) {
                    document.getElementById('video-container1').classList.remove('video-container1Speaking');
                    document.getElementById('video-container1').classList.add('video-container1NotSpeaking');
                }
            }
        }

        // Check if the detection should continue
        if (isCurrentUser && isMicrophoneCheckRunningCurrentUser) {
            // Continue looping
            requestAnimationFrame(isSpeakingCheck);
        }
        else if (!isCurrentUser && isMicrophoneCheckRunningOtherUser) {
            // Continue looping
            requestAnimationFrame(isSpeakingCheck);
        }
    }

    // Start detecting speech activity
    requestAnimationFrame(isSpeakingCheck);
}

// Function to stop tracking speech activity
export function stopTrackingMicrophone(isCurrentUser) {
    // Clear the current stream and stop the detection loop
    if (isCurrentUser) {
        currentMicrophoneStreamCurrentUser = null;
        isMicrophoneCheckRunningCurrentUser = false;
    }
    else {
        currentMicrophoneStreamOtherUser = null;
        isMicrophoneCheckRunningOtherUser = false;
    }
}


