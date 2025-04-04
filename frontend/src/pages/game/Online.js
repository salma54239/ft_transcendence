import './Online.css'
import { IoAddOutline } from "react-icons/io5";


function Online() {
    return (
        <div className='online-background'>
            <div className='online-container'>
                <div className='add'>Add Friends</div>
                <div className='users'>
                    <div className='line'>
                        <div className='square'></div>
                        <div className='friend-name'>margot</div>
                        <div className='add-friend'><IoAddOutline /></div>
                    </div>
                    <div className='line'>
                        <div className='square'></div>
                        <div className='friend-name'>margot</div>
                        <div className='add-friend'><IoAddOutline /></div>
                    </div>
                    <div className='line'>
                        <div className='square'></div>
                        <div className='friend-name'>margot</div>
                        <div className='add-friend'><IoAddOutline /></div>
                    </div>
                </div>
                <div className='invite'><span className='send-invite'>Send Invitations</span></div>
            </div>
        </div>
    );
}
export default Online;