import './Loading.css';
import React, { useRef ,useState , useEffect} from 'react';
import { useNavigate ,useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { wslink } from '../../context/AuthContext';

function Loading() {

    const { userId } = useParams();
    const navigate = useNavigate();
    const {state} = useLocation();
    const websocket = useRef(null);
    const [startGame, setStartGame] = useState(false);
    axios.defaults.withCredentials = true;

    useEffect(() => {
        // if (!Number.isInteger(userId)){
        //     navigate('..')
        //     return;
        // }
        websocket.current = new WebSocket(wslink(`invite/${userId}`));
        
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
                    navigate(`../../play/${data.game_id}`);
                }, 2000)
            }
            if(data.type === 'invite_canceled'){
                if (websocket.current) {
                    websocket.current.close();
                }
                navigate(`..`);
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
            axios.post(`game/declinesend/${userId}/`)
            .then(() => {
                if (websocket.current){
                    websocket.current.close();
                }
                navigate('..')
            })
            .catch((err) => {
                console.log(err);
            });
        };
    }, [userId, navigate])
    

    const handleCancel = () => {
        axios.post(`game/declinesend/${userId}/`)
        .then(() => {
            if (websocket.current) {
                websocket.current.close();
            }
            navigate('..')
        })
        .catch((err) => {
            console.log(err);
        });
    };

    
    return (
        <>
        <div className='loading-container'>
            <div className='center'>
                <div className='ring'></div>
                <span>Loading...</span>
            </div>
            {state && !startGame  ? (<button onClick={handleCancel}>Cancel</button>) : <p>GET READY TO PLAY</p>}
        </div>
        </>
    )
}

export default Loading