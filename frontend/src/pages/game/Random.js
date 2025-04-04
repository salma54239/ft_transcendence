import './Loading.css';
import React, { useRef ,useState , useEffect} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { wslink } from '../../context/AuthContext';

function Random() {

    const navigate = useNavigate();
    const websocket = useRef(null);
    const { userId } = useParams();
    const [startGame, setStartGame] = useState(false);

    useEffect(() => {
        websocket.current = new WebSocket(wslink(`matchmaking`));
        
        websocket.current.onopen = () => {
            console.log('WebSocket connected');
        };

        websocket.current.onmessage = function (event) {
            const data = JSON.parse(event.data);
            if (data.type === 'game_created') {
                setStartGame(true)
                setTimeout(() => {
                    if (websocket.current) {
                        websocket.current.close();
                    }
                    navigate(`../play/${data.game_id}`);
                }, 2000)
            }
            else if (data.type === 'error') {
                console.error('Error:', data.message);
            }
        };

        websocket.current.onclose = () => {
            console.log('WebSocket closed');
        };

        websocket.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        return () => {
            if (websocket.current) {
                websocket.current.close();
            }
        };
    }, [userId, navigate])
    

    const handleCancel = () => {
        if (websocket.current) {
            websocket.current.close();
        }
        navigate('..')
    };

    
    return (
        <>
        <div className='loading-container'>
            <div className='center'>
                <div className='ring'></div>
                <span>Loading...</span>
            </div>
            {!startGame ? (<button onClick={handleCancel}>Cancel</button>) : <p>GET READY TO PLAY</p>}
        </div>
        </>
    )
}

export default Random