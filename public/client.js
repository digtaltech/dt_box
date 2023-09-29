const socket = io();

let fileInput = document.getElementById('fileInput');

async function shareFile() {
  const file = fileInput.files[0];
  if (file) {
    const peer = new SimplePeer({ initiator: true });

    peer.on('signal', (data) => {
      socket.emit('offer', JSON.stringify(data));
    });

    socket.on('answer', (data) => {
      peer.signal(JSON.parse(data));
    });

    peer.on('connect', () => {
      console.log('Connected to peer');
      peer.send(file);
    });

    peer.on('data', (data) => {
      // Handle received data (file content)
      console.log('Received data:', data);
    });
  }
}
