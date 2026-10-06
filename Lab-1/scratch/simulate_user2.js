const { io } = require('../server/node_modules/socket.io-client');

async function run() {
  console.log('Simulating user2...');
  const socket = io('http://localhost:3000', { transports: ['websocket'] });

  await new Promise(r => socket.on('connect', r));
  console.log('user2 connected');

  // Wait 2 seconds, then join room1
  await new Promise(r => setTimeout(r, 2000));
  socket.emit('join', { username: 'user2', room: 'room1' });
  console.log('user2 joined room1');

  // Wait 4 seconds, send message
  await new Promise(r => setTimeout(r, 4000));
  socket.emit('message', { text: 'Привіт, user1! WebSocket та Socket.io працюють чудово.' });
  console.log('user2 sent message');

  // Stay for 25 seconds so auto-broadcast fires and is captured on screen
  await new Promise(r => setTimeout(r, 22000));

  // Leave room1
  socket.emit('leave');
  console.log('user2 left room1');

  await new Promise(r => setTimeout(r, 2000));
  socket.disconnect();
  console.log('user2 disconnected');
}

run().catch(console.error);
