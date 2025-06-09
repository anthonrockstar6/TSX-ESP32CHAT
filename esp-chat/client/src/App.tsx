// client/src/App.tsx
import { useEffect, useRef, useState } from "react";

const WS_URL = "ws://YOUR-IP-HERE:5000";

function App() {
  const [messages, setMessages] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("🌐 Connected to WebSocket server");
    };

    ws.onmessage = (e) => {
      try {
        const { type, data } = JSON.parse(e.data);
        if (type === "history") {
          setMessages(data);
        } else if (type === "msg") {
          setMessages((prev) => [...prev, data]);
        }
      } catch (err) {
        console.error("💥 Error parsing WS message:", err);
      }
    };

    ws.onclose = () => {
      console.warn("⚠️ WebSocket disconnected");
    };

    return () => ws.close();
  }, []);

  const sendMessage = () => {
    const input = inputRef.current;
    if (input && input.value.trim()) {
      const payload = JSON.stringify({ type: "msg", data: input.value.trim() });
      wsRef.current?.send(payload);
      input.value = "";
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-2">🔌 ESP32 Chat</h1>
      <div className="border p-2 h-64 overflow-y-scroll bg-gray-100 mb-2 rounded shadow-inner">
        {messages.map((msg, i) => (
          <div key={i} className="text-sm text-gray-800">{msg}</div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          placeholder="Type a message..."
          className="flex-1 border rounded p-2"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default App;
