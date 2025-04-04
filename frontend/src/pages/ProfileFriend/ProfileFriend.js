import React 
from 'react';
import Banner from '../../components/Banner';
import './ProfileFriend.css';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useEffect , useState} from 'react';
import { IoEllipse } from "react-icons/io5";
import { FaMedal, FaTrophy, FaStar } from 'react-icons/fa';

const ProfileFriend = () => {
    const { userId } = useParams();
    const [achievements, setAchievements] = useState([]);
    const [stats, setStats] = useState({ wins: 0, losses: 0, total_games: 0 });
    const [friendDetails, setFriendDetails] = useState('');
    axios.defaults.withCredentials = true;
    const [gameHistory, setGameHistory] = useState([]);
    const [withLevel, setWithLevel] = useState('0%');
    const [level, setLevel] = useState(0);
    axios.defaults.withCredentials = true;

    useEffect(() => {
      if (userId) {
        axios.get(`game/userhistory/${userId}/`)
          .then(response => {
            setGameHistory(response.data);
          })
          .catch(error => {
            console.error("Error fetching user history:", error);
          });
  
        axios.get(`game/achievements/${userId}/`)
          .then(response => {
            setAchievements(response.data);
          })
          .catch(error => {
            console.error("Error fetching achievements:", error);
          });
  
        axios.get(`infoUserProfile/${userId}/`)
          .then(response => {
            const { wins, losses , widthlvl, level} = response.data;
            const total_games = wins + losses;
            setStats({ wins, losses, total_games });
            setWithLevel(widthlvl + '%')
            setLevel(level)
          })
          .catch(error => {
            console.error("Error fetching user stats:", error);
          });
  
        axios.get(`friends/frienduser/${userId}/`)
          .then(response => {
            setFriendDetails(response.data);
          })
          .catch((err) => {
            console.error("Error fetching friend details:", err);
          });
      }
    }, [userId]);

  return (
    <div>
      <Banner />
      <div className="friend-content-profile">
          <h1 className='friend-title-profile'>Profile</h1>
            <div className="friend-info-profile">
              <div className="friend-user-name"> 
                {friendDetails && friendDetails.avatar ? <img src={friendDetails.avatar} alt='Profileimg' className="friend-profile-photo"/> : null}
                <div className="friend-name-status">
                  { friendDetails && friendDetails.username}
                  <div className="friend-status">
                    <IoEllipse 
                      style={{ 
                        color: friendDetails && friendDetails.status === 'Online' ? '#BBFC52' : '#E84172' 
                      }} 
                      className="friend-status-icon" 
                    />
                  <span>{friendDetails &&  friendDetails.status}</span>
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
              <div className="friend-level">
                <div className="friend-level-bar">
                <div className="friend-level-fill" style={{  width: withLevel }}> <div className="friend-my-level">{level+"."+ withLevel} </div></div>
              </div>
            </div>
            </div>
        <div className="friend-infos">
          <div className="friend-info-group">
            <h1 className='friend-titles-profile-hi'>History</h1>
            <div className="friend-info-history">
              <ul className="friend-history-list">
                {gameHistory.length > 0 ? (gameHistory.map(game => (
                  <li key={game.id} className="friend-history-item">
                    {game && game.avatar ? <img src={game.avatar} alt="Game History" className="friend-history-profile" /> : null}
                    <span
                      className="friend-history-result"
                      style={{ color: game.result === 'Win' ? '#D8FD62' : '#E84172' }}>
                      {game.result}
                    </span>
                    <span className="friend-history-level">Score: {game.score}</span>
                  </li>
                ))) : (
                  <li className="achievement-item">No Game History yet.</li>
              )}
              </ul>
            </div>
          </div>
          <div className="friend-info-group">
            <h1 className='friend-titles-profile-ach'>Achievement</h1>
            <div className="friend-info-achievement">
              <ul className="friend-achievement-list">
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

export default ProfileFriend;
