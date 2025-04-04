import './Local.css';
import { FiPlay } from "react-icons/fi";
import { Link } from "react-router-dom";

function RandomInvite() {
  return (
    <>
    <div className='menu-background'>
      <div className='menu-container'>
          <Link className='local-button' to={`/game/Online/Random`}><FiPlay /><span className='local-title' >Random</span></Link>
          <Link className='local-button' to={`/game/Online/Invite`}><FiPlay /><span className='local-title'>Invite friend</span></Link>
          <Link className='local-button' to={`/game/Online/LoadingTournament`}><FiPlay /><span className='local-title'>Tournament</span></Link>
      </div>
    </div>
    </>
  );
}

export default RandomInvite;
