import React, { useState, useEffect, useRef } from "react";
import "./ChatDetail.css";
import axios from "axios";
import { useNotification } from "../../context/NotificationContext";
import { useAuth, wslink } from "../../context/AuthContext";

const ChatDetail = ({ roomId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(wslink(`chat/rooms/${roomId}/messages/`));

    ws.current.onopen = () => {
      console.log("WebSocket connected.");
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "chat.message") {
        setMessages((prev) => [...prev, data.message]);
      }
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      addNotification("Connection error. Messages may be delayed.", "error");
    };

    const fetchMessages = async () => {
      try {
        const response = await axios.get(`/chat/rooms/${roomId}/messages/`, { 
          withCredentials: true 
        });
        setMessages(response.data);
      } catch (error) {
        console.error("Error fetching messages:", error);
        addNotification("Failed to load messages", "error");
      }
    };

    fetchMessages();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [roomId, addNotification]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    try {
      ws.current.send(JSON.stringify({
        type: "chat.message",
        message: {
          content: newMessage,
        },
      }));
      setNewMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
      addNotification("Message failed to send", "error");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-detail">
      <div className="chat-header">
        <h3>Chat</h3>
      </div>

      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message-wrapper ${msg.sender === user?.id ? "own" : "other"}`}
          >
            <div className={`message ${msg.sender === user?.id ? "own" : "other"}`}>
              <p>{msg.content}</p>
              <span>
                {new Date(msg.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          maxLength={5000}
        />
        <button className="send-button" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatDetail;