# Tutorium Meeting
This repository has the codebase of Tutorium's meeting part. It is implemented with plain JavaScript and uses SemanticUI for the UI/UX implementation.
## How to Run
### Locally
0. Prerequisites:
  - You need node with version 20.1
1. Clone the repository:
    ```shell
    git clone git@github.com:TheTutorium/meeting.git
    ```
2. Change the directory:
    ```shell
    cd meeting
    ```
3. Correct the port for local hosting (skip this step if you will deploy it in a remote server like Railway):
    In meeting.js, find these lines:
    ```
    // Initialize the PeerJS connection
    if (connectToPeerId && myPeerId) {
      peer = new Peer(myPeerId, {
        host: "/",
        // port: 3000,
        path: "/peerjs/myapp"
      });

      if (myPeerId < connectToPeerId) {
        autoConnect = true;
        connectInterval = setInterval(handleDisconnect, 5000);
      }
    }
    else {
      peer = new Peer({
        host: "/",
        // port: 3000,
        path: "/peerjs/myapp"
      });
    }
    ```
    and uncomment the 2 port lines.
4. Install dependencies:
    ```shell
    yarn install
    ```
5. Run the code:
    ```shell
    node server.js
    ```
6. Now you can access UI of the meeting from the following link:  
    `localhost:3000`
