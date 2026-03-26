// Simple WebSocket relay server
// Run with: npm install ws
// Then: node server.js

const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });
const rooms = new Map(); // roomName -> Set of sockets

function joinRoom(room, ws) {
  if (!rooms.has(room)) {
    rooms.set(room, new Set());
  }
  rooms.get(room).add(ws);
}

function leaveAllRooms(ws) {
  for (const [room, clients] of rooms.entries()) {
    clients.delete(ws);
    if (clients.size === 0) {
      rooms.delete(room);
    }
  }
}

function broadcastToRoom(room, sender, data) {
  const clients = rooms.get(room);
  if (!clients) return;

  for (const client of clients) {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  }
}

wss.on("connection", (ws) => {
  ws.room = null;

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (msg.type === "join") {
      leaveAllRooms(ws);
      ws.room = msg.room;
      joinRoom(msg.room, ws);

      ws.send(JSON.stringify({
        type: "system",
        text: `Joined room: ${msg.room}`
      }));
      return;
    }

    if (!ws.room) return;

    // Relay movement/update messages to everyone else in the same room
    broadcastToRoom(ws.room, ws, msg);
  });

  ws.on("close", () => {
    leaveAllRooms(ws);
  });
});

console.log("WebSocket server running on ws://localhost:8080");