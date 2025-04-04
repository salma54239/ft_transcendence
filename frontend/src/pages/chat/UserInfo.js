import React, { useState, useEffect, useCallback } from "react";
import "./UserInfo.css";
import { FiUserX } from "react-icons/fi"; 
import { PiPingPongLight } from "react-icons/pi";
import { MdDeleteOutline } from "react-icons/md";
import avatarPlaceholder from "../../images/avatar.png";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";

const UserInfo = ({ participant, roomId, invitationMessage, setInvitationMessage }) => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const [buttonState, setButtonState] = useState("Block");
  const [canToggle, setCanToggle] = useState(true);

  const fetchBlockStatus = useCallback(async () => {
    try {
      const response = await axios.get(`/chat/rooms/${roomId}/block-status/`, {
        withCredentials: true,
      });

      if (response.data.is_blocked_by) {
        setButtonState("Blocked by someone");
        setCanToggle(false);
      } else if (response.data.is_blocked) {
        setButtonState("Unblock");
        setCanToggle(true);
      } else {
        setButtonState("Block");
        setCanToggle(true);
      }
    } catch (error) {
      console.error("Error fetching block status:", error);
    }
  }, [roomId]);

  useEffect(() => {
    if (participant && roomId) {
      fetchBlockStatus();
    }
  }, [participant, roomId, fetchBlockStatus]);

  const handleBlockParticipant = async () => {
    if (!participant || !roomId || !canToggle) {
      if (!canToggle) {
        addNotification("You cannot toggle block status because you are blocked by someone.", "warning");
      }
      return;
    }

    try {
      const response = await axios.post(
        `/chat/rooms/${roomId}/block/`,
        { participant_id: participant.id },
        { withCredentials: true }
      );
      addNotification(response.data.detail, "info");
      await fetchBlockStatus();
    } catch (err) {
      console.error("Failed to toggle block status:", err);
      addNotification("Failed to update block status. Please try again.", "error");
    }
  };

  const handleGameInvite = async () => {
    try {
      const response = await axios.post(
        `game/send/${participant.id}/`,
        {},
        { withCredentials: true }
      );

      if (response.status === 201) {
        addNotification("Game invitation sent!", "success");
        navigate(`/game/Online/Invite/Loading/${participant.id}`, {
          state: { status: "send" }
        });
      } else {
        addNotification(response.data.status, "warning");
      }
    } catch (err) {
      addNotification("Failed to send game invitation. Please try again.", "error");
    }
  };

  const handleInvitationResponse = async (accept) => {
    if (!invitationMessage?.sender?.id) return;

    try {
      if (accept) {
        await axios.post(`game/accept/${invitationMessage.sender.id}/`);
        navigate(`/game/Online/Invite/Loading/${user.id}`, {
          state: { status: "accept" }
        });
      } else {
        await axios.post(`game/declinereceived/${invitationMessage.sender.id}/`);
        setInvitationMessage(null);
      }
    } catch (err) {
      addNotification(`Failed to ${accept ? 'accept' : 'decline'} invitation`, "error");
    }
  };

  if (!participant) {
    return (
      <div className="user-info">
        <div className="no-user-selected">
          <h3>No user selected</h3>
          <p>Select a chat room to start messaging.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-info">
      <div className="user" onClick={() => navigate(`/profile/${participant.id}`)}>
        <img
          src={participant.avatar || avatarPlaceholder}
          alt={`${participant.profile?.display_name || "Unknown User"}'s Avatar`}
        />
        <div className="texts">
          <h3 className="participant-name">
            {participant.profile?.display_name || "Unknown User"}
          </h3>
        </div>
      </div>

      <div className="user-actions">
        <div className="action" onClick={handleGameInvite}>
          <PiPingPongLight className="icon" />
          <span>Invite</span>
        </div>
    
        <div className="action" onClick={handleBlockParticipant}>
          <FiUserX className={`icon ${buttonState === "Unblock" ? "blocked" : ""}`} />
          <span>{buttonState}</span>
        </div>
      </div>

      {invitationMessage && (
        <div className="game-invitation">
          <p>{invitationMessage.message}</p>
          <div className="game-actions">
            <button className="accept-button" onClick={() => handleInvitationResponse(true)}>
              Accept
            </button>
            <button className="decline-button" onClick={() => handleInvitationResponse(false)}>
              Decline
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserInfo;