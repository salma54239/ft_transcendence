import React, { useEffect, useRef } from "react";
import "./PongGame.css";
import { useNavigate } from 'react-router-dom';

const OnePlayerGame = () => {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const CANVAS_WIDTH = 1000;
    const CANVAS_HEIGHT = 700;
    const PADDLE_WIDTH = 20;
    const PADDLE_HEIGHT = 100;
    const BALL_SPEED = 4;
    const WINNING_SCORE = 7;

    
    const players = useRef([
        {name: "YOU", x: 0, y: 0, score: 0},
        {name: "BOT", x: CANVAS_WIDTH - PADDLE_WIDTH, y: CANVAS_HEIGHT - PADDLE_HEIGHT, score: 0},]);
        
    const ballRef = useRef({x: CANVAS_WIDTH/2, y: CANVAS_HEIGHT/2, radius: 12, color: "white", speed: BALL_SPEED, velocityX: BALL_SPEED, velocityY: BALL_SPEED});
    const isGamePaused = useRef(true);
    const isOver = useRef(false);

    const PaddleMove = useRef({up: false, down: false});

    const resetBall = () => {
        ballRef.current.x = CANVAS_WIDTH/2;
        ballRef.current.y = CANVAS_HEIGHT/2;
        ballRef.current.velocityX = -ballRef.current.velocityX;
        ballRef.current.speed = BALL_SPEED;
    };

    const renderGame = (ctx) => {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = "#636987";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        if(isGamePaused.current){
            ctx.font = "40px Arial"; 
            ctx.fillStyle = "white"; 
            ctx.textAlign = "center";
            ctx.fillText("Click to Start", CANVAS_WIDTH / 2, ctx.canvas.height / 2);
            return;
        }

        ctx.fillStyle = "white";
        ctx.font = "60px rationale";
        ctx.fillText(players.current[0].score, CANVAS_WIDTH / 4, CANVAS_HEIGHT / 5);
        ctx.fillText(players.current[1].score, (CANVAS_WIDTH / 4) * 3, CANVAS_HEIGHT / 5);
        

        ctx.fillStyle = "#D9D9D9";
        for (let i = 0; i < CANVAS_HEIGHT; i += 20){
            ctx.fillRect(CANVAS_WIDTH/2 - 6/2, i, 6, 12);
        }
        if (isOver.current){
            ctx.fillStyle = "white";
            ctx.font = "90px rationale";
            if (players.current[0].score === WINNING_SCORE){
                ctx.fillText("WIN!", (CANVAS_WIDTH / 12) * 3, CANVAS_HEIGHT / 2);
                ctx.fillText("LOSE!", (CANVAS_WIDTH/12) * 9, CANVAS_HEIGHT / 2);
            }
            else{
                ctx.fillText("LOSE!", (CANVAS_WIDTH / 12) * 3, CANVAS_HEIGHT / 2);
                ctx.fillText("WIN!", (CANVAS_WIDTH/12)*9, CANVAS_HEIGHT / 2);}
            return;
        }

        ctx.beginPath();
        ctx.fillStyle = ballRef.current.color;
        ctx.arc(ballRef.current.x, ballRef.current.y, ballRef.current.radius, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.closePath();

        ctx.fillStyle = "#D8FD62";
        ctx.fillRect(players.current[0].x, players.current[0].y, PADDLE_WIDTH, PADDLE_HEIGHT);
        ctx.fillStyle = "#E84172";
        ctx.fillRect(players.current[1].x, players.current[1].y, PADDLE_WIDTH, PADDLE_HEIGHT);

    };

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
    };
    
    const updateGame = () => {
        if (isOver.current || isGamePaused.current)
            return;
        const ball = ballRef.current;

        ball.x += ball.velocityX;
        ball.y += ball.velocityY;


        if (ball.y + ball.radius > CANVAS_HEIGHT || ball.y - ball.radius < 0)
            ball.velocityY *= -1;

        const newBotY = players.current[1].y += (ball.y - (players.current[1].y + PADDLE_HEIGHT/2)) * 0.058;
        players.current[1].y = (Math.max(0, Math.min(newBotY, CANVAS_HEIGHT - PADDLE_HEIGHT)));

        const paddle = ((ball.x > CANVAS_WIDTH/2) ? players.current[1] : players.current[0]);
        if (checkCollision(paddle, ball)){
            let angleRad = (ball.y === (paddle.y + PADDLE_HEIGHT/2)) ? 0 : ( ball.velocityY > 0) ? Math.PI/4 : -Math.PI/4;
            const direction = (ball.x < CANVAS_WIDTH/2) ? 1 : -1;

            ball.velocityX = (Math.cos(angleRad) * ball.speed) * direction;
            ball.velocityY = Math.sin(angleRad) * ball.speed;
            ball.speed += 0.2;
        }

        if (ball.x - ball.radius <= 0){
            players.current[1].score++;
            resetBall();}
        else if (ball.x + ball.radius >= CANVAS_WIDTH){
            players.current[0].score++;
            resetBall();}
    
        if (players.current[0].score === WINNING_SCORE || players.current[1].score === WINNING_SCORE){
            isOver.current = true;
            setTimeout(() => {
                    navigate(`Score`, 
                    {state:{ player1:players.current[0].name , player2:players.current[1].name, player1Score:players.current[0].score, player2Score:players.current[1].score}});
            }, 1800);
            }
        }
    
    const handleKeyEvent = (e) => {
        e.preventDefault();
        const isPressed = e.type === 'keydown';
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S')
            PaddleMove.current.down = isPressed;
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W')
            PaddleMove.current.up = isPressed;
    }
    const movePaddle = () => {
        if (PaddleMove.current.up)
            players.current[0].y = Math.max(0, players.current[0].y - 10);
        if (PaddleMove.current.down)
            players.current[0].y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, players.current[0].y + 10);
    };

    const startGame = () => isGamePaused.current = false

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        
        const interval = setInterval(() => {
            renderGame(ctx);
            updateGame();
            movePaddle();}, 1000 / 60);

        window.addEventListener('keydown', handleKeyEvent);
        window.addEventListener('keyup', handleKeyEvent);
        return () => {
            clearInterval(interval);
            window.removeEventListener('keydown', handleKeyEvent);
            window.removeEventListener('keyup', handleKeyEvent);
        };
    });

        return (
      <div className='game_container'>
          <div className='adversaries'>
                <div className='player1'>
                        <span className="p-img"></span>
                        <span className="p-name1">{players.current[0].name}</span>
                        <span className="V">V</span>
                </div>
                <div className='player2'>
                        <span className="S">S</span>
                        <span className="p-name2">{players.current[1].name}</span>
                        <span className="p-img"></span>
                </div>
            </div>
            <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{color: "white"}} onClick={() =>{
                if(isGamePaused.current){startGame()};}}></canvas>
      </div>
    )
}

export default OnePlayerGame