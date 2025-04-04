import { Doughnut } from 'react-chartjs-2';
import React, {useState, useEffect} from 'react';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
} from 'chart.js';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale);

function GameStats() {
  const [stats, setStats] = useState({ wins: 0, losses: 0});
  const [noStats, setNoStats] = useState(false);
  const { user } = useAuth();
  axios.defaults.withCredentials = true;
  
  useEffect(() => {
    if(user && user.id){
      axios.get(`infoUserProfile/${user.id}/`)
          .then(response => {
            const { wins, losses } = response.data;
            const total_games = wins + losses;
            setStats({ wins, losses});
            if (total_games === 0){
              setNoStats(true)
            }
          })
          .catch(error => {
              console.error("Error fetching user stats:", error);
          });}
 }, [user]);
  const data = {
    labels: ['Wins', 'Losses'],
    datasets: [
      {
        label: 'Game Stats',
        data: [ stats.wins, stats.losses],
        backgroundColor: ['#BBFC52', '#E84172'],
        borderColor: 'transparent',
      },
    ],
  };
  const options = {
    plugins: {
      legend: {
        display: false,
      }
    },};
  return (
    <div>
      {!noStats ? (<Doughnut data={data} options={options}/>) : <div className='nostats'>No Stats</div>}
    </div>
  );
}

export default GameStats;

