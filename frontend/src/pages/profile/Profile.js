import React, { useState, useEffect } from 'react';
import Banner from '../../components/Banner';
import './Profile.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { IoPersonOutline } from "react-icons/io5";
import { IoEllipse } from "react-icons/io5";
import { FaMedal, FaTrophy, FaStar } from 'react-icons/fa';
import axios from 'axios';

const Profile = () => {
    const [listFriends, setListFriends] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [gameHistory, setGameHistory] = useState([]);
    const [withLevel, setWithLevel] = useState('0%');
    const [level, setLevel] = useState(0);

    const [stats, setStats] = useState({ wins: 0, losses: 0, total_games: 0 });
    const { setUser, user } = useAuth();
    axios.defaults.withCredentials = true;

    useEffect(() => {
      if (user) {
        axios.get('friends/allfriends/')
          .then((response) => {
            setListFriends(response.data);
          })
          .catch((err) => {
            console.log(err);
          });
        axios.get(`game/achievements/${user.id}/`)
          .then((response) => {
            setAchievements(response.data);
          })
          .catch((err) => {
            console.log(err);
          });
  
        axios.get(`infoUserProfile/${user.id}/`)
          .then((response) => {
            const { wins, losses, widthlvl, level } = response.data;
            const total_games = wins + losses;
            setStats({ wins, losses, total_games });
            setWithLevel(widthlvl + '%')
            setLevel(level)
          })
          .catch((err) => {
            console.log(err);
          });
  
        axios.get(`game/userhistory/${user.id}/`)
          .then((response) => {
            setGameHistory(response.data);
          })
          .catch((err) => {
            console.log(err);
          });
      }
    }, [user,setUser]);

  const navigate = useNavigate();

  const handleEditClick = () => {
    navigate('/settings');
  }

  return (  
    <div>
      <Banner />
      <div className="content-profile">
          <h1 className='title-profile'>Profile</h1>
            <div className="info-profile">
              <div className="user-name"> 
                {user && user.avatar ? <img src={user.avatar} alt='Profileimg' className="profile-photo"/> : null}
                <div className="name-status">
                  {user ? user.username : ''}  
                  <div className="status">
                  <IoEllipse className="profile-status-icon"/><span>{user ? user.status : ''}</span>
                  </div>
                </div>
                <div>
                  <div className="info-stats">
                    <p><strong>Wins:</strong> {stats.wins}</p>
                    <p><strong>Losses:</strong> {stats.losses}</p>
                    <p><strong>Total Games:</strong> {stats.total_games}</p>
                  </div>
                </div>           
              </div>
              <div className="level">
                <div className="level-bar">
                <div className="level-fill" style={{ width: withLevel }}> <div className="my-level">{level +"."+ withLevel}</div></div>
              </div>
                <div className="edit" onClick={handleEditClick}>
                  <div className="text-edit">Edit</div>
                </div>
            </div>
            </div>
        <div className="infos">
          <div className="info-group">
            <h1 className='titles-profile'>Friends</h1>
            <div className="info-friends">
              <ul className="friends-list">
              {listFriends.length > 0 ? (listFriends.map(friend => (
                  <li key={friend.id} className="friend-item">
                    {friend && friend.avatar ? <img src={friend.avatar} alt="img" className="friend-photo" /> : null}
                    <div className="friend-details">
                      <span className="friend-name">{friend.username}</span>
                      <div className="friend-message">
                        <IoEllipse 
                        style={{ 
                          color: friend.status === 'Online' ? '#BBFC52' : '#E84172' 
                        }} 
                        className="profile-status-icon" 
                      />
                        <span>{friend.status}</span>
                      </div>
                    </div>
                    <div className="friend-icons">
                        <Link className="icon" to={`/profile/${friend.id}`}>< IoPersonOutline /></Link>
                    </div>
                  </li>
                ))) : (
                  <li className="friend-item">No Friends yet.</li>
                )}
              </ul>
            </div>
          </div>
          <div className="info-group">
            <h1 className='titles-profile'>History</h1>
            <div className="info-history">
              <ul className="history-list">
                {gameHistory.length > 0 ? (gameHistory.map(game => (
                  <li key={game.id} className="history-item">
                    {game && game.avatar ? <img
                      src={game.avatar}
                      alt="GameHistory"
                      className="history-profile"
                    /> : null}
                    <span
                      className="history-result"
                      style={{ color: game.result === 'Win' ? '#D8FD62' : '#E84172' }}>
                      {game.result}
                    </span>
                    <span className="history-level">Score: {game.score}</span>
                  </li>
                ))) : (
                  <li className="history-item">No Game History yet.</li>
                )}
              </ul>
            </div>
          </div>
          <div className="info-group">
            <h1 className='titles-profile'>Achievement</h1>
            <div className="info-achievement">
              <ul className="achievement-list">
              {achievements.length > 0 ? (
                  achievements.map(achievement => (
                    <li key={achievement.id} className="achievement-item">
                      <span className="achievement-icon">
                        {achievement.category === "lvl Achievement" &&  <FaTrophy />}
                        {achievement.category === "Wins Achievement" &&<FaMedal />}
                        {achievement.category === "fast win" && <FaStar />}
                      </span>
                      <div className="achievement-details">
                        <span className="achievement-title">{achievement.title}</span>
                        <span className="achievement-description">{achievement.description}</span>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="achievement-item">No achievements yet.</li>
                )}
                </ul>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Profile;
