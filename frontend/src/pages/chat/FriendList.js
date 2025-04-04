import axios from "axios";

const FriendList = ({ onSelectRoom }) => {
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await axios.get("allfriends/", { withCredentials: true });
        setFriends(response.data);
      } catch (error) {
        console.error("Failed to fetch friends:", error);
      }
    };
    fetchFriends();
  }, []);

  const handleStartChat = async (friend) => {
    try {
      const response = await axios.post(
        "chat/rooms/",
        { name: `${friend.username}`, invitee_id: friend.id },
        { withCredentials: true }
      );


      onSelectRoom(response.data.id, friend.username);
    } catch (error) {
      if (error.response && error.response.data.room_id) {
        onSelectRoom(error.response.data.room_id, friend.username);
      } else {
        console.error("Failed to start chat:", error);
      }
    }
  };

  return (
    <div className="friend-list">
      <h3>Your Friends</h3>
      {friends.length > 0 ? (
        friends.map((friend) => (
          <div
            key={friend.id}
            className="friend-item"
            onClick={() => handleStartChat(friend)} 
          >
            <span>{friend.username}</span>
          </div>
        ))
      ) : (
        <p>No friends found.</p>
      )}
    </div>
  );
};

export default FriendList;
