import React, { useState, useEffect } from "react";
import ChatList from "./ChatList";
import ChatDetail from "./ChatDetail";
import UserInfo from "./UserInfo";
import axios from "axios";
import "./Chat.css";

const Chat = () => {
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [invitationMessage, setInvitationMessage] = useState(null);

  useEffect(() => {
    const fetchChatRooms = async () => {
      try {
        const response = await axios.get("chat/rooms/", { withCredentials: true });
        setChatRooms(response.data);
      } catch (err) {
        console.error("Failed to fetch chat rooms:", err);
      }
    };

    fetchChatRooms();
  }, []);

  useEffect(() => {
    const fetchGameInvitation = async () => {
      if (!selectedRoom || !selectedParticipant) return;

      try {
        const response = await axios.get(`game/invitationdetail/`, {
          withCredentials: true,
        });

        if (response.data?.length > 0) {
          const invitation = response.data.find(inv => inv.sender.id === selectedParticipant.id);
          if (invitation) {
            setInvitationMessage({
              message: "Invite you to play",
              sender: invitation.sender
            });
          } else {
            setInvitationMessage(null);
          }
        } else {
          setInvitationMessage(null);
        }
      } catch (error) {
        console.error("Failed to fetch game invitation:", error);
      }
    };

    const intervalId = setInterval(fetchGameInvitation, 3000);
    fetchGameInvitation();

    return () => clearInterval(intervalId);
  }, [selectedRoom, selectedParticipant]);

  const handleRoomSelect = (roomId, participant) => {
    setSelectedRoom(roomId);
    setSelectedParticipant(participant);
    setInvitationMessage(null);
  };

  return (
    <div className="chat-container">
      <div className="chat-list">
        <ChatList chatRooms={chatRooms} onSelectRoom={handleRoomSelect} />
      </div>

      <div className="chat-detail">
        {selectedRoom ? (
          <ChatDetail roomId={selectedRoom} />
        ) : (
          <p className="no-rooms">Select a chat room to start messaging.</p>
        )}
      </div>

      <div className="user-info">
        <UserInfo
          participant={selectedParticipant}
          roomId={selectedRoom}
          invitationMessage={invitationMessage}
          setInvitationMessage={setInvitationMessage}
        />
      </div>
    </div>
  );
};

export default Chat;