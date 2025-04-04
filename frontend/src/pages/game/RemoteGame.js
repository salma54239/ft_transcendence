

import React, { useEffect, useRef, useState } from "react";
import "./PongGame.css";
import { useParams, useNavigate  } from 'react-router-dom';
import "./Score.css"
import { MdOutlineRestartAlt } from "react-icons/md";
import { Link } from "react-router-dom";
import { useAuth, wslink } from '../../context/AuthContext';
import axios from 'axios';
import { useNotification } from '../../context/NotificationContext';


const TwoPlayersGame = () => {
    const {gameId} = useParams()
    const wsRef = useRef(null);
    const canvasRef = useRef(null);
    const CANVAS_WIDTH = 1000;
    const CANVAS_HEIGHT = 700;
    const PADDLE_WIDTH = 20;
    const PADDLE_HEIGHT = 100;
    const WINNING_SCORE = 7;
    const { addNotification } = useNotification();
    
    const players = useRef([
        {id:null, x: 0, y: 0, score: 0, name:"", img:null},
        {id:null, x: CANVAS_WIDTH - PADDLE_WIDTH, y: 0, score: 0, name:"", img:null},]);
        
        
        const ballRef = useRef({x: CANVAS_WIDTH/2,
        y: CANVAS_HEIGHT/2, 
        radius: 12, 
        speed: 0, 
        velocityX: 0, 
        velocityY: 0});

        const start = useRef(false);
        const GameOver = useRef(false);
        const [finish, setFinish] = useState(false);
        const [isGet, setIsGet] = useState(false);
        const {user} = useAuth();
        const navigate = useNavigate();
        axios.defaults.withCredentials = true;
        
        
        useEffect(() => {
            axios.get(`game/gamestatus/${gameId}/`)
            .then((response) => {
                if (response.data.message === "completed game"){
                    GameOver.current = true;
                    setIsGet(true)
                    navigate('..')
                }
                else if (response.data.message === "Active final game"){
                    setFinish(false)
                    setIsGet(false)
                    GameOver.current = false
                    start.current = false
                    players.current[0].score = 0
                    players.current[1].score = 0
                }
            })
            .catch((err) => console.log(err.response));
        }, [user ,gameId, navigate])


        useEffect(() => {
        if (start.current && isGet) return;
            axios.get(`game/playersinfo/${gameId}/`)
            .then((response) => {
                const { player1, player2 } = response.data;
                if (player1.id === user.id){
                    players.current[0].img = player1.avatar;
                    players.current[0].name = player1.username;
                    players.current[1].img = player2.avatar;
                    players.current[1].name = player2.username;
                }
                else {
                    players.current[1].img = player1.avatar;
                    players.current[1].name = player1.username;
                    players.current[0].img = player2.avatar;
                    players.current[0].name = player2.username;
                }
                setIsGet(true);
            })
        .catch((err) => console.log(err.response));
    }, [gameId, isGet, user])

    const handleKeyEvent = (e) => {
        e.preventDefault();
        const isPressed = (e.type === "keydown")
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W')
            if (wsRef.current)
                wsRef.current.send(JSON.stringify({ move: 'up', value: isPressed }));
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S')
            if (wsRef.current)
                wsRef.current.send(JSON.stringify({ move: 'down', value: isPressed }));
    };

    useEffect(() => {
        // if (!Number.isInteger(gameId)){
        //     navigate('..')
        //     return;
        // }
        if (GameOver.current) return;
        wsRef.current = new WebSocket(wslink(`game/${gameId}`));
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        wsRef.current.onopen = () => console.log("WebSocket connected successfully");

        wsRef.current.onmessage = (message) => {
            const data = JSON.parse(message.data);
            if (data.ball){
                ballRef.current.x = data.ball.x;
                ballRef.current.y = data.ball.y;
            } 
            if (data.start){
                if( data.player1.id === user.id){
                    players.current[0].id = data.player1.id;
                    players.current[1].id = data.player2.id;
                }
                else{
                    players.current[1].id = data.player1.id;
                    players.current[0].id = data.player2.id;
                }
                start.current = true;
            }
            if (data.player1 && data.player2){
                if (data.player1.id === players.current[0].id){
                    players.current[0].y = data.player1.y;
                    players.current[0].score = data.player1.score;
                    players.current[1].y = data.player2.y;
                    players.current[1].score = data.player2.score;
                }
                else{
                    players.current[1].y = data.player1.y;
                    players.current[1].score = data.player1.score;
                    players.current[0].y = data.player2.y;
                    players.current[0].score = data.player2.score;
                    if (data.ball){
                        ballRef.current.x = CANVAS_WIDTH - ballRef.current.x;
                    }
                }
            }
            if (data.disconnected) {
                GameOver.current = true;
                players.current[0].score = WINNING_SCORE;
                players.current[1].score = 0;
                    wsRef.current.close();
                axios.get(`game/abandon/${gameId}/`)
                .then(() => {
                    axios.delete(`game/removerequestship/${gameId}/`)
                    .then((response) => {
                        console.log(response.data.message)
                    })
                    .catch()
                    axios.get(`game/roundwinner/${gameId}/`)
                    .then((response) => {
                        if (response.data.message === "ok"){
                            addNotification("Waiting for your opponent to join. Living now means giving up the final round.", "warning");
                        }
                    })
                })
                .catch((err) => {
                    console.log(err);
                });
                setTimeout(() => {
                    setFinish(true);
                }, 800);
                return;
            }
        };
        wsRef.current.onerror = (error) => console.error("WebSocket error:", error);

        wsRef.current.onclose = () => console.log("WebSocket disconnected");
    
        window.addEventListener('keydown', handleKeyEvent);
        window.addEventListener('keyup', handleKeyEvent);

        const renderGame = (ctx) => {
            if (GameOver.current) return;
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
            ctx.fillStyle = "#636987";
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            if (!start.current){
                ctx.font = "40px Arial"; 
                ctx.fillStyle = "white"; 
                ctx.textAlign = "center";
                ctx.fillText("The game is starting now!", canvas.width / 2, canvas.height / 2);
                return;
            }

            ctx.fillStyle = "#D9D9D9";
            for (let i = 0; i < CANVAS_HEIGHT; i += 20){
                ctx.fillRect(CANVAS_WIDTH/2 - 6/2, i, 6, 12);
            }

            ctx.fillStyle = "white";
            ctx.font = "60px rationale";
            ctx.fillText(players.current[0].score, CANVAS_WIDTH / 4, CANVAS_HEIGHT / 5);
            ctx.fillText(players.current[1].score, (CANVAS_WIDTH / 4) * 3, CANVAS_HEIGHT / 5);
        
            if (players.current[0].score >= WINNING_SCORE || players.current[1].score >= WINNING_SCORE){
                wsRef.current.close();
                ctx.fillStyle = "white";
                ctx.font = "90px rationale";

            if (players.current[0].score >= WINNING_SCORE){
                ctx.fillText("WIN!", (CANVAS_WIDTH / 12) * 3, CANVAS_HEIGHT / 2);
                ctx.fillText("LOSE!", (CANVAS_WIDTH/12) * 9, CANVAS_HEIGHT / 2);
            }
            else{
                ctx.fillText("LOSE!", (CANVAS_WIDTH / 12) * 3, CANVAS_HEIGHT / 2);
                ctx.fillText("WIN!", (CANVAS_WIDTH/12) * 9, CANVAS_HEIGHT / 2)
            }
                axios.post(`game/update-score/${gameId}/`, {
                    player1_id: players.current[0].id,
                    player2_id: players.current[1].id,
                    player1_score: players.current[0].score,
                    player2_score: players.current[1].score,
                })
                .then((response) => {
                    console.log(response.data);
                    axios.delete(`game/removerequestship/${gameId}/`)
                    .then((response) => {
                        console.log(response.data.message)
                    })
                    .catch((err) => console.log(err.response))
                })
                .catch((err) => console.log(err.response));
                GameOver.current = true;
                setTimeout(() => {
                    setFinish(true);}, 1800);
                return;   
                }
            ctx.beginPath();
            ctx.fillStyle = "white";
            ctx.arc(ballRef.current.x, ballRef.current.y, ballRef.current.radius, 0, Math.PI * 2, false);
            ctx.fill();
            ctx.closePath();
            
            ctx.fillStyle = "#D8FD62";
            ctx.fillRect(players.current[0].x, players.current[0].y, PADDLE_WIDTH, PADDLE_HEIGHT);
            ctx.fillStyle = "#E84172";
            ctx.fillRect(players.current[1].x, players.current[1].y, PADDLE_WIDTH, PADDLE_HEIGHT);
            
        };
        const interval = setInterval(() => renderGame(ctx), 1000 / 60);

        window.addEventListener('keydown', handleKeyEvent);
        return () => {
            clearInterval(interval);
            window.removeEventListener('keydown', handleKeyEvent);
            window.removeEventListener('keyup', handleKeyEvent);
            if (wsRef.current){
                wsRef.current.close();
                }
        };
    }, [gameId, user, finish, addNotification, navigate]);

        return (
        <div className='game_container'>
            { !finish ? (
                <div>
                    <div className='adversaries'>
                        <div className='player1'>
                            <span className="p-img">{players.current[0] && players.current[0].img && <img src={players.current[0].img} alt="player1"></img>}</span>
                            <span className="p-name1">{players.current[0].name}</span>
                            <span className="V">V</span>
                        </div>
                        <div className='player2'>
                                <span className="S">S</span>
                                <span className="p-name2">{players.current[1].name}</span>
                                <span className="p-img">{players.current[1] && players.current[1].img && <img src={players.current[1].img} alt="player2"></img>}</span>
                        </div>
                      </div>
                      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT}></canvas>
                </div>
            ):(
                <div>
                    <div className="Restart-background">
            <div className="score-elements">
                <div className="Scores">
                    <div className="rectangle-container">
                        <div className="Rectangle" >
                            <div className="result">{players.current[0].score}</div>
                        </div>
                    </div>
                    <div className="rectangle-container">
                        <div className="Rectangle">
                            <div className="result">{players.current[1].score}</div>
                        </div>
                    </div>
                </div>
                <div className="bar">
                    <div className="right-text">{players.current[0].name}</div>
                    <div className="Restart-vs">
                        <span className="Rest-V">V</span>
                        <span className="Rest-S">S</span>
                    </div>
                    <div className="left-text">{players.current[1].name}</div>
                </div>
                <div className="Restart-button">
                    <Link className="Restart-b" to={`..`}> <MdOutlineRestartAlt /> </Link>
                </div>
            </div>
        </div>
                </div>
            )}
        </div>
    )
}

export default TwoPlayersGame

