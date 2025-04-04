import React, { useState, useEffect } from "react";
import "./ChatList.css";
import axios from "axios";
import avatarPlaceholder from "../../images/avatar.png";

const ChatList = ({ onSelectRoom }) => {
  const [chatRooms, setChatRooms] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); 
  const [activeRoomId, setActiveRoomId] = useState(null);


  useEffect(() => {
    const fetchChatRooms = async () => {
      try {
        const response = await axios.get("/chat/rooms/", { withCredentials: true });
        setChatRooms(response.data);
        console.log("Fetched Chat Rooms:", response.data);
      } catch (error) {
        console.error("Failed to fetch chat rooms:", error);
      }
    };
    fetchChatRooms();
  }, []);


  const filteredRooms = chatRooms.filter(
    (room) =>
      room.friend &&
      room.friend.profile?.display_name &&
      room.friend.profile.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="chatList">
      <div className="search">
        <div className="searchBar">
          <input
            type="text"
            placeholder="Search chat rooms"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="room-list">
        {filteredRooms.length > 0 ? (
          filteredRooms.map((room) => (
            <div
              key={room.id}
              className={`item ${activeRoomId === room.id ? "active" : ""}`}
              onClick={() => {
                setActiveRoomId(room.id);
                onSelectRoom(room.id, { ...room.friend, chat_room_id: room.id }); 
              }}
            >
              <img
                src={room.friend?.avatar || avatarPlaceholder}
                alt={`${room.friend?.profile?.display_name || "Unknown User"}'s Avatar`}
              />
              <div className="texts">
                <span>{room.friend?.profile?.display_name || "Unknown User"}</span>
                <p className="last-message">
                  {room.last_message_content
                    ? `${room.last_message_content.substring(0, 30)}` 
                    : "No messages yet"}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="no-rooms">No chat rooms found. Start a new conversation!</p>
        )}
      </div>
    </div>
  );
};

export default ChatList;
