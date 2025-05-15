// const WS = require('ws');

// const web_socket = new WS('ws://localhost:6789');

// web_socket.on('open', () => {
//     console.log('Connected to WebSocket server');
// });

// web_socket.on('message', (data: any) => {
//     console.log(`Contract Address Found: ${data}`);
// });

// web_socket.on('close', () => {
//     console.log('Disconnected from WebSocket server');
// });

// web_socket.on('error', (error: any) => {
//     console.error('WebSocket error:', error);
// });

import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:6789');

ws.on('open', () => {
    console.log('Connected to WebSocket server');

    // Example: Fetch contract details
    ws.send(JSON.stringify({
        command: 'get_contract_details',
        payload: { address: 'CONTRACT_ADDRESS' },
    }));

    // Example: Update entry price
    ws.send(JSON.stringify({
        command: 'update_entry_price',
        payload: { address: 'CONTRACT_ADDRESS', entry_price: 100 },
    }));

    // Example: Fetch active contracts
    ws.send(JSON.stringify({
        command: 'get_active_contracts',
        payload: {},
    }));
});

ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    console.log('Received message:', message);
});

ws.on('close', () => {
    console.log('Disconnected from WebSocket server');
});