const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

const users = new Map(); // Map of user IDs to { ws, username, city, group }
const groups = new Set(); // Set of group names

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (err) {
      console.error('Invalid message format:', message);
      return;
    }

    if (data.type === 'join') {
      // Use the userId from the JWT token
      const userId = data.userId;
      if (!userId) {
        console.error('No userId provided in join message');
        return;
      }

      // Store the userId in the WebSocket connection
      ws._userId = userId;

      // Create a default group for the user's city if it doesn't exist
      const defaultGroup = `${data.city} Group`;
      groups.add(defaultGroup);

      users.set(userId, { ws, username: data.username, city: data.city, group: data.group });

      // Broadcast updated user list (excluding current user's info to others)
      const userList = Array.from(users.values()).map(user => ({
        username: user.username,
        city: user.city,
      }));
      broadcast({ type: 'users', users: userList });

      // Broadcast updated group list
      broadcast({ type: 'groups', groups: Array.from(groups) });

      console.log(`User ${data.username} (ID: ${userId}) joined group: ${data.group}`);
    } else if (data.type === 'createGroup') {
      groups.add(data.groupName);
      broadcast({ type: 'groups', groups: Array.from(groups) });
      console.log(`Group created: ${data.groupName} by ${data.username}`);
    } else if (data.type === 'message') {
      const senderId = data.userId;
      const user = users.get(senderId);
      
      if (user) {
        const message = {
          type: 'message',
          userId: data.userId,
          username: data.username,
          text: data.text,
          city: data.city,
          group: data.group,
          timestamp: data.timestamp,
        };

        // Broadcast message to all users in the same group (including sender for confirmation)
        users.forEach((client, clientId) => {
          if (
            client.ws.readyState === WebSocket.OPEN &&
            client.group === data.group
          ) {
            client.ws.send(JSON.stringify(message));
          }
        });
        
        console.log(`Message from ${data.username} in ${data.group}: ${data.text}`);
      } else {
        console.error(`User not found for userId: ${senderId}`);
      }
    }
  });

  ws.on('close', () => {
    if (ws._userId) {
      const user = users.get(ws._userId);
      if (user) {
        console.log(`User ${user.username} (ID: ${ws._userId}) disconnected`);
      }
      users.delete(ws._userId);
      
      // Broadcast updated user list
      const userList = Array.from(users.values()).map(user => ({
        username: user.username,
        city: user.city,
      }));
      broadcast({ type: 'users', users: userList });
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

console.log('WebSocket server running on ws://localhost:8080');