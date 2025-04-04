
import './SingleLocal.css'
import { Link } from "react-router-dom";

function SingleLocal() {
    return (
        <div className='SingleLocal-background'>
            <div className="SingleLocal-container">
                    <Link className='solo' to={`/game/Local/SingleGame/SoloPractice`}>Solo Practice</Link>
                    <Link className='ch'to={`/game/Local/SingleGame/ChallengeAFriend`}>Challenge a Friend</Link>
            </div>
        </div>
    );
}
export default SingleLocal;
