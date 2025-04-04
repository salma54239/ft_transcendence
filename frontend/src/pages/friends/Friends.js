import React, { useState, useEffect } from 'react';
import './Friends.css';
import Banner from '../../components/Banner';
import { IoPersonOutline } from "react-icons/io5";
import { BsChatDots } from "react-icons/bs";
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { IoEllipse } from "react-icons/io5";


import axios from 'axios';

const Friends = () => {
    const [activeSection, setActiveSection] = useState('friends');
    const [allSuggestions, setAllSuggestions] = useState([]);
    const [allRequests, setAllRequests] = useState([]);
    const [allFriends, setAllFriends] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [pending, setPending] = useState({});
    
    axios.defaults.withCredentials = true;
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('friends/allsuggestions/')
            .then((response) => {
                setAllSuggestions(response.data);
            })
            .catch((err) => {
                console.log(err);
            });
    }, [activeSection, pending]);
    
    useEffect(() => {
        axios.get('friends/allfriends/')
            .then((response) => {
                setAllFriends(response.data);
            })
            .catch((err) => {
                console.log(err);
            });
    }, [activeSection, pending]);
    
    useEffect(() => {
        axios.get('friends/invitations/')
        .then((response) => {
            setInvitations(response.data);
        })
        .catch((err) => {
            console.log(err);
        });
    }, [activeSection, pending]);
  
    useEffect(() => {
        axios.get('friends/requestssend/')
        .then((response) => {
            setAllRequests(response.data);
        })
        .catch((err) => {
            console.log(err);
        });
    }, [activeSection, pending]);

    const handleChatClick = async (friend) => {
        try {
          const response = await axios.post(
            "chat/rooms/",
            {
              name: `Chat with ${friend.username}`,
              invitee_id: friend.id,
            },
            { withCredentials: true }
          );
      
          const roomId = response.data.id;
          navigate(`/chat`, { state: { roomId, participantName: friend.username } });
        } catch (error) {
          if (error.response && error.response.data.room_id) {
            const roomId = error.response.data.room_id;
            navigate(`/chat`, { state: { roomId, participantName: friend.username } });
          } else {
            console.error("Failed to create or fetch chat room:", error);
          }
        }
      };

    const handleAcceptInvitation = (userId) => {
        axios.post(`friends/accept/${userId}/`)
            .then(() => {
                setPending((prevState) => ({ ...prevState, [userId]: false }));
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const handleCancelInvitation = (userId) => {
        axios.post(`friends/declinereceived/${userId}/`)
            .then(() => {
                setPending((prevState) => ({ ...prevState, [userId]: false }));
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const handleAddFriend = (userId) => {
        axios.post(`friends/send/${userId}/`)
            .then(() => {
                setPending((prevState) => ({ ...prevState, [userId]: true }));
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const handleCancelRequest = (userId) => {
        axios.post(`friends/declinesend/${userId}/`)
        .then(() => {
            setPending((prevState) => ({ ...prevState, [userId]: false }));
        })
        .catch((err) => {
            console.log(err);
        });
    };

    return (
        <div>
            <Banner />
            <div className="f-friends-page">
                <div className="f-section-toggle-container">
                    <div className="f-section-toggle-buttons">
                        <button 
                            className={`f-toggle-button ${activeSection === 'friends' ? 'active' : ''}`}
                            onClick={() => setActiveSection('friends')}
                        >
                            All Friends
                        </button>
                        <button 
                            className={`f-toggle-button ${activeSection === 'invitations' ? 'active' : ''}`}
                            onClick={() => setActiveSection('invitations')}
                        >
                            Invitations
                        </button>
                        <button 
                            className={`f-toggle-button ${activeSection === 'suggestions' ? 'active' : ''}`}
                            onClick={() => setActiveSection('suggestions')}
                        >
                            Suggestions
                        </button>
                        <button 
                            className={`f-toggle-button ${activeSection === 'requests' ? 'active' : ''}`}
                            onClick={() => setActiveSection('requests')}
                        >
                            Requests
                        </button>
                    </div>

                    {activeSection === 'friends' && (
                        <div className="f-section-content">
                            <div className="f-friends-section">
                                <ul className="f-friends-list">
                                    {allFriends.map(friend => (
                                        <li key={friend.id} className="f-friend-item">
                                            {friend && friend.avatar ? <img src={friend.avatar} alt="avatar" className="f-friend-photo" /> : null}
                                            <div className="f-friend-details">
                                                <span className="f-friend-name">{friend.username}</span>
                                                <div className='f-friend-status'>
                                                <IoEllipse 
                                                  style={{ 
                                                    color: friend.status === 'Online' ? '#BBFC52' : '#E84172' 
                                                  }} 
                                                  className="f-friend-status-icon" 
                                                />
                                                  <span>{friend.status}</span>
                                                </div>
                                            </div>
                                            <div className="f-friend-icons">
                                                <Link className="f-icon" to={`/friends/${friend.id}`}><IoPersonOutline /></Link>
                                                <Link className="f-icon" onClick={() => handleChatClick(friend)}><BsChatDots /></Link>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {activeSection === 'invitations' && (
                        <div className="f-section-content">
                            <div className="f-invitations-section">
                                <ul className="f-invitations-list">
                                    {invitations.map(invite => (
                                        <li key={invite.id} className="f-invitation-item">
                                            {invite &&  invite.sender && invite.sender.avatar ? <img src={invite.sender.avatar} alt="avatar" className="f-invitation-photo" /> : null}
                                            <div className="f-invitation-details">
                                                <div><span className="f-invitation-name">{invite.sender.username}</span></div>
                                                <div><span className="f-invitation-message">Wants to be friends</span></div>
                                                <div className="f-invitation-buttons">
                                                    <div onClick={() => handleAcceptInvitation(invite.sender.id)} className="f-accept-button">Accept</div>
                                                    <div onClick={() => handleCancelInvitation(invite.sender.id)} className="f-cancel-button">Cancel</div>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {activeSection === 'suggestions' && (
                        <div className="f-section-content">
                            <div className="f-all-users-section">
                                <ul className="f-all-users-list">
                                    {allSuggestions.map(user => (
                                        <li key={user.id} className="f-all-users-item">
                                            {user && user.avatar ? <img src={user.avatar} alt="img" className="f-all-users-photo" /> : null}
                                            <div className="f-all-users-details">
                                                <span className="f-all-users-name">{user.username}</span>
                                                <div
                                                    onClick={() => handleAddFriend(user.id)}
                                                    className="f-add-friend-button"
                                                >
                                                    Add friend
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {activeSection === 'requests' && (
                        <div className="f-section-content">
                            <div className="f-requests-section">
                                <ul className="f-requests-list">
                                    {allRequests.map(user => (
                                        <li key={user.receiver.id} className="f-requests-item">
                                            {user && user.receiver && user.receiver.avatar ? <img src={user.receiver.avatar} alt="img" className="f-requests-photo" /> : null}
                                            <div className="f-requests-details">
                                                <span className="f-requests-name">{user.receiver.username}</span>
                                                <div
                                                    onClick={() => handleCancelRequest(user.receiver.id)}
                                                    className="f-cancel-friend-button"
                                                >
                                                    Cancel
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Friends;
