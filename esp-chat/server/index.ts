// server/index.ts
import path from "path";
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import cors from "cors";
import { WebSocket } from "ws";

const app = express();
const PORT = 5000;
const messages: string[] = [];

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Serve static files
app.use(cors());
app.use(express.static(path.join(__dirname, "../client/dist")));
app.use((_req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/dist/index.html"));
});

// WebSocket logic
wss.on("connection", (ws: WebSocket) => {
  console.log("✅ New WebSocket client connected");

  // Send chat history to newly connected client
  ws.send(JSON.stringify({ type: "history", data: messages }));

  ws.on("message", (data) => {
    try {
      const { type, data: messageText } = JSON.parse(data.toString());

      if (type === "msg") {
        const formatted = messageText.trim();
        if (!formatted) return;

        messages.push(formatted); // Log in memory
        console.log(`📩 Message received: ${formatted}`);

        // Broadcast to all clients
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "msg", data: formatted }));
          }
        });
      }
    } catch (err) {
      console.error("❌ Failed to parse message:", err);
    }
  });

  ws.on("close", () => {
    console.log("🔌 WebSocket client disconnected");
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🔥 Server running at http://EDIT-IP-HERE:${PORT}`);
});
