import "./Score.css"
import { MdOutlineRestartAlt } from "react-icons/md";
import { Link, useLocation } from "react-router-dom";

function Score() {
    const { state } = useLocation();
    const { player1, player2, player1Score, player2Score} = state;
    return (
        <div className="Restart-background">
            <div className="score-elements">
                <div className="Scores">
                    <div className="rectangle-container">
                        <div className="Rectangle" >
                            <div className="result">{player1Score}</div>
                        </div>
                    </div>
                    <div className="rectangle-container">
                        <div className="Rectangle">
                            <div className="result">{player2Score}</div>
                        </div>
                    </div>
                </div>
                <div className="bar">
                    <div className="right-text">{player1}</div>
                    <div className="Restart-vs">
                        <span className="Rest-V">V</span>
                        <span className="Rest-S">S</span>
                    </div>
                    <div className="left-text">{player2}</div>
                </div>
                <div className="Restart-button">
                    <Link className="Restart-b" to={`..`}> <MdOutlineRestartAlt /> </Link>
                </div>
            </div>
        </div>
    );
}
export default Score;