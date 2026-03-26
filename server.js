const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const PORT = 8080;
const rooms = new Map();

const palette = [
  { hue: 160, name: "Browser 1" }, // green/teal
  { hue: 350, name: "Browser 2" }, // red/pink
  { hue: 210, name: "Browser 3" }, // blue
  { hue: 45, name: "Browser 4" },  // amber
  { hue: 285, name: "Browser 5" }, // purple
];

const spawnPoints = [
  { x: 0.35, y: 0.50 },
  { x: 0.65, y: 0.50 },
  { x: 0.50, y: 0.30 },
  { x: 0.50, y: 0.70 },
  { x: 0.25, y: 0.25 },
  { x: 0.75, y: 0.25 },
  { x: 0.25, y: 0.75 },
  { x: 0.75, y: 0.75 },
];

function createId() {
  return Math.random().toString(36).slice(2, 10);
}

function getRoom(roomName) {
  if (!rooms.has(roomName)) {
    rooms.set(roomName, new Map());
  }
  return rooms.get(roomName);
}

function getSnapshot(roomName) {
  const room = rooms.get(roomName);
  if (!room) return [];

  return [...room.values()].map((peer, index) => ({
    id: peer.id,
    x: peer.x,
    y: peer.y,
    hue: peer.hue,
    label: `Browser ${index + 1}`,
  }));
}

function send(ws, payload) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcastSnapshot(roomName) {
  const room = rooms.get(roomName);
  if (!room) return;

  const peers = getSnapshot(roomName);

  for (const peer of room.values()) {
    send(peer.ws, {
      type: "snapshot",
      selfId: peer.id,
      peers,
    });
  }
}

function removeFromRoom(ws) {
  if (!ws.roomName || !rooms.has(ws.roomName) || !ws.clientId) return;

  const room = rooms.get(ws.roomName);
  room.delete(ws.clientId);

  if (room.size === 0) {
    rooms.delete(ws.roomName);
  } else {
    broadcastSnapshot(ws.roomName);
  }

  ws.roomName = null;
  ws.clientId = null;
}

const server = http.createServer((req, res) => {
  const filePath =
    req.url === "/" || req.url === "/index.html"
      ? path.join(__dirname, "index.html")
      : null;

  if (!filePath) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Server error");
      return;
    }

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(data);
  });
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  ws.roomName = null;
  ws.clientId = null;

  ws.on("message", (raw) => {
    let msg;

    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (msg.type === "join") {
      removeFromRoom(ws);

      const roomName = (msg.room || "demo-room").trim() || "demo-room";
      const room = getRoom(roomName);
      const index = room.size;
      const spot = spawnPoints[index % spawnPoints.length];
      const style = palette[index % palette.length];
      const id = createId();

      room.set(id, {
        id,
        ws,
        x: spot.x,
        y: spot.y,
        hue: style.hue,
      });

      ws.roomName = roomName;
      ws.clientId = id;

      broadcastSnapshot(roomName);
      return;
    }

    if (msg.type === "move") {
      const room = rooms.get(ws.roomName);
      if (!room || !room.has(ws.clientId)) return;

      const peer = room.get(ws.clientId);

      peer.x = Math.max(0.08, Math.min(0.92, Number(msg.x)));
      peer.y = Math.max(0.12, Math.min(0.88, Number(msg.y)));

      broadcastSnapshot(ws.roomName);
    }
  });

  ws.on("close", () => {
    removeFromRoom(ws);
  });
});

server.listen(PORT, () => {
  console.log(`Open http://127.0.0.1:${PORT}`);
});