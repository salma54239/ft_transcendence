import './Local.css';
import { FiPlay } from "react-icons/fi";
import { Link } from "react-router-dom";


function Local() {
  return (
    <>
    <div className='menu-background'>
      <div className='menu-container'>
          <Link className='local-button' to={`/game/Local/SingleGame`}><FiPlay /><span className='local-title' >Single Game</span></Link>
          <Link className='local-button' to={`/game/Local/TournamentLocal`}><FiPlay /><span className='local-title'>Tournament</span></Link>
      </div>
    </div>
    </>
  );
}

export default Local;
