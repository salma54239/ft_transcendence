import React, {useState, useEffect} from 'react';
import Banner from '../../components/Banner';
import './Home.css';
import { IoEllipse } from "react-icons/io5";
import { IoPersonOutline } from "react-icons/io5";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import GameStats from './GameStats';
import { useNotification } from '../../context/NotificationContext';



const Home = () => {
    const [listFriends, setListFriends] = useState([]);
    const [gameRank, setGameRank] = useState([]);
    const [lastGame, setLastGame] = useState([]);
    const navigate=useNavigate();
    const { user } = useAuth();
    const [widthLevel, setWidthLevel] = useState('0%');
    const [level, setLevel] = useState(0);
    const [stats, setStats] = useState({ wins: 0, losses: 0, total_games: 0 });
    axios.defaults.withCredentials = true;
    const { addNotification } = useNotification();

    useEffect(() => {
      if (user) {
          axios.get('friends/allfriends/')
              .then((response) => {
                  setListFriends(response.data);
              })
              .catch((err) => {
                  console.log(err);
              });

          axios.get('rank/')
              .then((response) => {
                  setGameRank(response.data);
              })
              .catch((err) => {
                  console.log(err);
              });

          axios.get(`game/gamehistory/${user.id}/`)
              .then((response) => {
                  setLastGame(response.data);
              })
              .catch((err) => {
                  console.log(err);
              });

          axios.get(`infoUserProfile/${user.id}/`)
          .then(response => {
                  const { wins, losses, widthlvl , level } = response.data;
                  const total_games = wins + losses;
                  setStats({ wins, losses, total_games });
                  setLevel(level)
                  setWidthLevel( widthlvl + '%')
              })
              .catch(error => {
                  console.error("Error fetching user stats:", error);
              });
      }
    }, [user]);

    const handleClick = () =>{
      axios.get(`game/checkuseringame/`)
      .then((response) => {
          if(response.data.message === "Active game"){
            addNotification("You are already playing a game!", "warning")
          }
          else{
            navigate(`/game/Online/`)
          }
      })
    }


    return (
      <>
        <Banner />
      <div className="dashboard-container">
          <div className='stats-profile'>
            <div className="dashboard-profile">
                  <div className="dash-user-name"> 
                    {user && user.avatar ? <img src={user.avatar} alt='Profileimg' className="dash-profile-photo"/> : null}
                    <div className="dash-name-status">
                      {user ? user.username : ''}  
                      <div className="dash-status">
                      <IoEllipse className="dash-profile-status-icon"/><span>{user ? user.status : ''}</span>
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
                  <div className="dash-level">
                    <div className="dash-level-bar">
                    <div className="dash-level-fill" style={{ width: widthLevel }}> <div className="dash-my-level">{level +"."+ widthLevel} </div></div>
                  </div>
                </div>
            </div>
            <div className='gamestats'>
              <div className='stats'><GameStats/></div>
            </div>            
          </div>
            <div className='big-container'>
            <div className="game-modes">
              <div className="game-mode">
                <div className='play-modes'>Solo practice</div>
                <div><Link className="game-mode-button" to={`/home/SoloPractice/`}><button>Start</button></Link></div>
              </div>
              <div className="game-mode">
                <div className='play-modes'>Challenge a friend </div>
                <div><Link className="game-mode-button" to={`/home/ChallengeAFriend/`}><button>Start</button></Link></div>
              </div>
              <div className="game-mode">
                <div className='play-modes'>Tournament</div>
                <div><Link className="game-mode-button" to={`/home/TournamentLocal/`}><button>Start</button></Link></div>
              </div>
              <div className="game-mode">
                <div className='play-modes'> Play online</div>
                <div><Link className="game-mode-button" ><button onClick={handleClick}>Start</button></Link></div>
              </div>
            </div>
            </div>
            
            <div className="lists-container">
              <div className='one-list-container'>
                <div className='list-title'>
                <span >Last Game</span>
                </div>
                <div className="game-list">
                    {lastGame.length > 0 ? (lastGame.map(last => (
                      <div key={last.id} className='game-item'>
                        <div className="last-game-profile">
                          {last && last.avatarW ? <img src={last.avatarW} alt="Winner" className="game-photo" /> : null}
                          <span className="last-game-username">{last.nameW}</span>
                        </div>
                        <div className='last-game-result'>
                          <span className='last-game-score'> {last.scoreW} - {last.scoreL}</span>
                          <span className="last-game-date">{last.date}</span>
                        </div>
                        <div className="last-game-profile">
                          {last && last.avatarL ? <img src={last.avatarL} alt="Loser" className="game-photo" /> : null}
                          <span className="last-game-username">{last.nameL}</span>
                        </div>
                      </div>
                    ))) : (
                      <div className="game-item-no-f">No Last Game yet.</div>
                    )}
              </div>
            </div>

            <div className='one-list-container'>
              <div className='list-title'>
                <span >Game Rank</span>
              </div>
              <div className="game-list">
                {gameRank.map((rank, index) => (
                  <div key={index} className="game-item">
                    <span className="rank-nb">{rank.rank}</span>
                    <div className="rank-photo">
                      <img
                        src={rank ? rank.avatar : null}
                        alt="rank"
                        
                      />
                    </div>
                    <span className="rank-name">{rank.name}</span>
                    <span className="rank-level">lvl: {rank.level+"."+rank.widthlvl+"%"}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className='one-list-container'>
              <div className='list-title'>
                <span >Friends</span>
              </div>
              <div className="game-list">
                  {listFriends.length > 0 ? (listFriends.map(friend => (
                    <div key={friend.id} className="game-item">
                      {friend && friend.avatar ? <img src={friend.avatar} alt="img" className="friend-photo-dash" /> : null}
                      <div className="friend-info-dash">
                        <span className='friend-name-dash'>{friend.username}</span>
                        <div className='friend-msg-dash'>
                        <IoEllipse 
                        style={{ 
                          color: friend.status === 'Online' ? '#BBFC52' : '#E84172' 
                        }} 
                        className="dash-status-icon" 
                      />
                        <span>{friend.status}</span>
                        </div>
                      </div>
                      <div className="friend-icons-dash">
                        <Link className="icon-dash" to={`/home/${friend.id}`}><IoPersonOutline /></Link>
                      </div>
                    </div>
                  ))) : (
                    <div className="game-item-no-f">No Friends yet.</div>
                  )}
              </div>
  
            </div>
            </div>
      </div>
      </>
    );
  };

export default Home;