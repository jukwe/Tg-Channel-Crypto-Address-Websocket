// import WebSocket from 'ws';
// const ws = new WebSocket('ws://localhost:6789');
// ws.on('open', () => {
//     console.log('Connected to WebSocket server');
// });
// ws.on('message', (data) => {
//     console.log(`Contract Address Found: ${data}`);
// });
// ws.on('close', () => {
//     console.log('Disconnected from WebSocket server');
// });
// ws.on('error', (error) => {
//     console.error('WebSocket error:', error);
// });
var WS = require('ws');
var web_socket = new WS('ws://localhost:6789');
web_socket.on('open', function () {
    console.log('Connected to WebSocket server');
});
web_socket.on('message', function (data) {
    console.log("Contract Address Found: ".concat(data));
});
web_socket.on('close', function () {
    console.log('Disconnected from WebSocket server');
});
web_socket.on('error', function (error) {
    console.error('WebSocket error:', error);
});
