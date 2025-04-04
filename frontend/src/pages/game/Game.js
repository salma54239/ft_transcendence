
import React, { useState } from "react";
import PongSimulator from "./PongSimulator";
import { GiPingPongBat } from "react-icons/gi";
import { useNavigate} from "react-router-dom";
import './Game.css'
import axios from 'axios';
import { useNotification } from '../../context/NotificationContext';

const Game = () => {
  const [gameMode, setGameMode] = useState("");
  const navigate = useNavigate();
  const { addNotification } = useNotification();

    const handleChange = (e) => {
        setGameMode(e.target.value);
    };

    const handleClick = () => {
        if (!gameMode)
            return;
        axios.get(`game/checkuseringame/`)
        .then((response) => {
            if(response.data.message === "Active game"){
              addNotification("ich oukan bbin idoukaaaaaaan", "warning")
            }
            else{
                navigate(`/game/${gameMode}`);
            }
      })
    }

    return (
        
        <div className="Game-page-container">

            <div className="pongSimulator"><PongSimulator /></div>

            <div className="other_elements">
                <div className="radio-group">
                    <label className="radio-option">
                    <input
                        type="radio"
                        name="gameMode"
                        value="Local"
                        checked={gameMode === "Local"}
                        onChange={handleChange}
                    />
                    <span className="custom-radio"></span>
                    Local
                    </label>

                    <label className="radio-option">
                    <input
                        type="radio"
                        name="gameMode"
                        value="Online"
                        checked={gameMode === "Online"}
                        onChange={handleChange}
                    />
                    <span className="custom-radio"></span>
                    Online
                    </label>
                </div>
                    <hr className="Separator-line"></hr>
                <div className="Start-button">
                  {/* {gameMode && */}
                        <button className="link" onClick={handleClick()} >
                                <GiPingPongBat/> START
                        </button>
                    {/* ) : (
                        <button className="link"  >
                            <GiPingPongBat/> START
                        </button>
                    )} */}
                </div>
            </div>
                
        </div>
    );
};

export default Game;
