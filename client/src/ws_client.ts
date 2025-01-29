const WS = require('ws');

const web_socket = new WS('ws://localhost:6789');

web_socket.on('open', () => {
    console.log('Connected to WebSocket server');
});

web_socket.on('message', (data: any) => {
    console.log(`Contract Address Found: ${data}`);
});

web_socket.on('close', () => {
    console.log('Disconnected from WebSocket server');
});

web_socket.on('error', (error: any) => {
    console.error('WebSocket error:', error);
});