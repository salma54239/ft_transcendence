
import React, { useEffect, useRef, useState, useCallback  } from 'react';
import "./PongGame.css"
import { useLocation, Link } from 'react-router-dom';
import { MdOutlineRestartAlt } from "react-icons/md";
import { HiMiniTrophy } from "react-icons/hi2";


const Tournament = () => {
    const { state } = useLocation();
    const { name1, name2, name3, name4 } = state;
    const canvasRef = useRef(null);
    const CANVAS_WIDTH = 1000;
    const CANVAS_HEIGHT = 700;
    const PADDLE_WIDTH = 20;
    const PADDLE_HEIGHT = 100;
    const BALL_SPEED = 4;
    const WINNING_SCORE = 7;

    
    const players = useRef([
        {name: name1, x: 0, y: 0, score: 0},
        {name: name2, x: 0, y: 0, score: 0},
        {name: name3, x: 0, y: 0, score: 0},
        {name: name4, x: 0, y: 0, score: 0}]);
        
    const ballRef = useRef({x: CANVAS_WIDTH/2, y: CANVAS_HEIGHT/2, radius: 12, color: "white", speed: BALL_SPEED, velocityX: BALL_SPEED, velocityY: BALL_SPEED});
    const rounds = useRef([
        {player1: null, player2: null, winner: null},
        {player1: null, player2: null, winner: null},
        {player1: null, player2: null, winner: null}])

    const currentRound = useRef(rounds.current[0]);
    const isGamePaused = useRef(true);

    const [p1name, setP1name] = useState("");
    const [p2name, setP2name] = useState("");
    const [roundNumber, setRoundNumber] = useState(1);
    const [message, setMessage] = useState("Click to Start");
    const isShowingResult = useRef(false);
    const [isOver, setIsOver] = useState(false);
        
    const PaddlesMove = useRef({
        left : {up: false, down: false},
        right : {up: false, down: false}
    });


    const getRandomId = () => {
        const randNb = Math.random();
        return(randNb < 0.25 ? 0 : randNb < 0.5 ? 1 : randNb < 0.75 ? 2 : 3)
    }
    
    const setRound3Players = () => {
        rounds.current[2].player1 = rounds.current[0].winner;
        rounds.current[2].player2 = rounds.current[1].winner;
        rounds.current[2].player1.score = 0;
        rounds.current[2].player2.score = 0;
        rounds.current[2].player1.x = 0;
        rounds.current[2].player1.y = 0;
    }
    const resetBall = useCallback(() => {
            ballRef.current.x = CANVAS_WIDTH/2;
            ballRef.current.y = CANVAS_HEIGHT/2;
            ballRef.current.velocityX = -ballRef.current.velocityX;
            ballRef.current.speed = BALL_SPEED;
    }, [])
    const resetGame4NextRound = useCallback(() => {
        setTimeout(() => {
        if (currentRound.current === rounds.current[0]){
            currentRound.current = rounds.current[1];
            setRoundNumber(2);
        }
        else if (currentRound.current === rounds.current[1]){
            setRound3Players();
            currentRound.current = rounds.current[2]
            setRoundNumber(3);
        }
        else
            setIsOver(true);

            isShowingResult.current = false;
            if (!isOver){
                setP1name(currentRound.current.player1.name);
                setP2name(currentRound.current.player2.name);
                currentRound.current.player1.x = 0;
                currentRound.current.player1.y = 0;
                currentRound.current.player2.x = CANVAS_WIDTH - PADDLE_WIDTH;
                currentRound.current.player2.y = CANVAS_HEIGHT - PADDLE_HEIGHT;
                ballRef.current.x = CANVAS_WIDTH / 2;
                ballRef.current.y = CANVAS_HEIGHT / 2;
                ballRef.current.velocityX = BALL_SPEED;
                ballRef.current.velocityY = BALL_SPEED;
                ballRef.current.speed = BALL_SPEED;
                setMessage("Click to Start");
            }
        }, 1700);
    }, [isOver])
    const handleClickToStart = () => {
        if (!message) return;
        setMessage("");
        isGamePaused.current = false;
    }

    const renderGame = useCallback((ctx) => {
        const round = currentRound.current;
        
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            ctx.fillStyle = "#636987";
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            
            if (message) {
                ctx.fillStyle = "white";
                ctx.font = "40px Arial";
                ctx.textAlign = "center";
                ctx.fillText(message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
                return;
            }
            ctx.fillStyle = "#D9D9D9";
            for (let i = 0; i < CANVAS_HEIGHT; i += 20){
                ctx.fillRect(CANVAS_WIDTH/2 - 6/2, i, 6, 12);
            }
            ctx.fillStyle = "white";
            ctx.font = "60px rationale";
            ctx.fillText(round.player1.score, CANVAS_WIDTH / 4, CANVAS_HEIGHT / 5);
            ctx.fillText(round.player2.score, (CANVAS_WIDTH / 4) * 3, CANVAS_HEIGHT / 5);

            if (isShowingResult.current) {
                ctx.fillStyle = "white";
                ctx.font = "90px rationale";
                if (round.player1.score === WINNING_SCORE) {
                    ctx.fillText("WIN!", (CANVAS_WIDTH / 12) * 3, CANVAS_HEIGHT / 2);
                    ctx.fillText("LOSE!", (CANVAS_WIDTH / 12) * 9, CANVAS_HEIGHT / 2);
                } else {
                    ctx.fillText("LOSE!", (CANVAS_WIDTH / 12) * 3, CANVAS_HEIGHT / 2);
                    ctx.fillText("WIN!", (CANVAS_WIDTH / 12) * 9, CANVAS_HEIGHT / 2);
                }
                return;
            }
            ctx.beginPath();
            ctx.fillStyle = ballRef.current.color;
            ctx.arc(ballRef.current.x, ballRef.current.y, ballRef.current.radius, 0, Math.PI * 2, false);
            ctx.fill();
            ctx.closePath();

            ctx.fillStyle = "#D8FD62";
            ctx.fillRect(round.player1.x, round.player1.y, PADDLE_WIDTH, PADDLE_HEIGHT);
            ctx.fillStyle = "#E84172";
            ctx.fillRect(round.player2.x, round.player2.y, PADDLE_WIDTH, PADDLE_HEIGHT);

        }, [message]);

        const checkCollision = (paddle, ball) => {
            paddle.top = paddle.y;
            paddle.bottom = paddle.y + PADDLE_HEIGHT;
            paddle.right = paddle.x + PADDLE_WIDTH;
            paddle.left = paddle.x;

            ball.top = ball.y - ball.radius;
            ball.bottom = ball.y + ball.radius;
            ball.right = ball.x + ball.radius;
            ball.left = ball.x - ball.radius;

            return (ball.left <= paddle.right && ball.top <= paddle.bottom && ball.bottom >= paddle.top && ball.right >= paddle.left)
        }
    
        const updateGame = useCallback((ctx) => {
            if (isGamePaused.current){
                renderGame(ctx);
                return;
            }
            const ball = ballRef.current;
            const round = currentRound.current;
            ball.x += ball.velocityX;
            ball.y += ball.velocityY;

            if (ball.y + ball.radius > CANVAS_HEIGHT || ball.y - ball.radius < 0)
                ball.velocityY = -ball.velocityY;

            const paddle = ((ball.x > CANVAS_WIDTH/2) ? round.player2 : round.player1);
            if (checkCollision(paddle, ball)){
                let angleRad = (ball.y === (paddle.y + PADDLE_HEIGHT/2)) ? 0 : ( ball.velocityY > 0) ? Math.PI/4 : -Math.PI/4;
                const direction = (ball.x < CANVAS_WIDTH/2) ? 1 : -1;

                ball.velocityX = (Math.cos(angleRad) * ball.speed) * direction;
                ball.velocityY = Math.sin(angleRad) * ball.speed;
                ball.speed += 0.1;
            }

            if (ball.x - ball.radius <= 0){
                round.player2.score++;
                resetBall();}
            else if (ball.x + ball.radius >= CANVAS_WIDTH){
                round.player1.score++;
                resetBall();}
            renderGame(ctx);

            if (round.player1.score === WINNING_SCORE || round.player2.score === WINNING_SCORE){
                round.winner = (round.player1.score === WINNING_SCORE) ? round.player1 : round.player2;
                isGamePaused.current = true;
                isShowingResult.current = true;
                resetGame4NextRound();
            }
        }, [renderGame, resetBall, resetGame4NextRound])
        
        const handleKeyEvent = (e) => {
            e.preventDefault()
            const isPressed = e.type === 'keydown';
            if (e.key === 'ArrowDown')
                PaddlesMove.current.right.down = isPressed;
            if (e.key === 'ArrowUp')
                PaddlesMove.current.right.up = isPressed;
            if (e.key === 's' || e.key === 'S')
                PaddlesMove.current.left.down = isPressed;
            if (e.key === 'w' || e.key === 'W')
                PaddlesMove.current.left.up = isPressed;
        };
        const movePaddle = () => {
            const round = currentRound.current;
            if (PaddlesMove.current.right.up)
                round.player2.y = Math.max(0, round.player2.y - 10);
            if (PaddlesMove.current.right.down)
                round.player2.y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, round.player2.y + 10);
            if (PaddlesMove.current.left.up)
                round.player1.y = Math.max(0, round.player1.y - 10);
            if (PaddlesMove.current.left.down)
                round.player1.y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, round.player1.y + 10);
        }
        useEffect(() => {
            const player1Id = getRandomId();
            let player2Id = getRandomId();
            while (player2Id === player1Id){
                player2Id = getRandomId();}

            rounds.current[0].player1 = players.current[player1Id];
            rounds.current[0].player2 = players.current[player2Id];

            const remainingIds = [];
            for (let i =  0; i < 4; i++){
                if (i !== player1Id && i !== player2Id)
                    remainingIds.push(i);
            }
            rounds.current[1].player1 = players.current[remainingIds[0]];
            rounds.current[1].player2 = players.current[remainingIds[1]];

            rounds.current[0].player2.x = CANVAS_WIDTH - PADDLE_WIDTH;
            rounds.current[0].player2.y = CANVAS_HEIGHT - PADDLE_HEIGHT;
            setP1name(rounds.current[0].player1.name);
            setP2name(rounds.current[0].player2.name);
        },[]);
        useEffect(() => {
            if(!canvasRef.current)
                return;
            const ctx = canvasRef.current.getContext("2d");
            const interval = setInterval(() => updateGame(ctx), 1000 / 60);
            window.addEventListener('keydown', handleKeyEvent);
            window.addEventListener('keyup', handleKeyEvent);
            const keyPressInterval = setInterval(movePaddle, 1000 / 60);
            return () => {
                clearInterval(interval);
                window.removeEventListener('keydown', handleKeyEvent);
                window.removeEventListener('keyup', handleKeyEvent);
                clearInterval(keyPressInterval);
            };
    }, [updateGame, message]);

    return (
            <div className='game_container'>
                {!isOver ? (
                    <div>
                        <div className='adversaries'>
                             <div className='player1'>
                                     <span className="p-img"></span>
                                     <span className="p-name1">{p1name}</span>
                                     <span className="V">V</span>
                             </div>
                             <div className='player2'>
                                     <span className="S">S</span>
                                     <span className="p-name2">{p2name}</span>
                                     <span className="p-img"></span>
                             </div>
                        </div>
                        <h4 style={{color: "white", textAlign: "center", margin: 0}}>Round {roundNumber}</h4>
                        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{color: "white"}} onClick={() =>{
                            if(isGamePaused.current){handleClickToStart()};}}></canvas>
                    </div>
                 ) : (
                    <div>
                        <div className="levels-container">
                            <div className="level-box">
                                <div className="tour-level">
                                    <span>Congratulations!</span>
                                    <HiMiniTrophy/>
                                    <span>{currentRound.current.winner.name}</span>
                                </div> 
                                    <Link className="restart-tour" to={`..`}><MdOutlineRestartAlt/></Link>
                            </div>
                </div>
                    </div>
                 )}
            </div>
        )
}

export default Tournament
