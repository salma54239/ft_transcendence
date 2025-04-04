import { useEffect, useRef, useCallback } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useAuth, wslink } from '../context/AuthContext';

const NotificationSocket = () => {
  const ws = useRef(null);
  const { addNotification } = useNotification();
  const { islog, user } = useAuth();

  const handleWebSocketMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('WebSocket message received:', data);

      const notificationConfig = {
        'friend_request': {
          message: `${data.sender.username} sent you a friend request`,
          type: 'info'
        },
        'friend_request_accepted': {
          message: `${data.sender.username} accepted your friend request`,
          type: 'success'
        },
        'game_invitation': {
          message: `${data.sender.username} invited you to play`,
          type: 'info'
        },
        'game_request': {
          message: `${data.sender.username} sent you a game request`,
          type: 'info'
        },
        'game_request_accepted': {
          message: `${data.sender.username} accepted your game request`,
          type: 'success'
        },
        'tournament_final': {
          message: `your final game with ${data.sender.username} is starting now `,
          type: 'success'
        }
      };

      const config = notificationConfig[data.type];
      if (config) {
        addNotification(config.message, config.type);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
      addNotification('Error processing notification', 'error');
    }
  }, [addNotification]);

  useEffect(() => {
    let isCurrentEffect = true;
    const connectWebSocket = () => {
      if (!isCurrentEffect) {
        return;
      }

      ws.current = new WebSocket(wslink('notifications/'));

      ws.current.onopen = () => {
        if (!isCurrentEffect) {
          ws.current.close();
          return;
        }
      };

      ws.current.onmessage = handleWebSocketMessage;

      ws.current.onerror = (error) => {
        if (!isCurrentEffect) return;
        console.error('WebSocket error:', error);
        addNotification('Connection error occurred', 'error');
      };

      ws.current.onclose = () => {
        if (!isCurrentEffect) return;
        addNotification('Notification connection lost', 'warning');
      };
    };

    if (islog && user) {
      connectWebSocket();
    }

    return () => {
      isCurrentEffect = false;
      if (ws.current) {
        console.log('Cleaning up WebSocket connection');
        ws.current.close();
        ws.current = null;
      }
    };
  }, [islog, user, handleWebSocketMessage, addNotification]);

  return null;
};

export default NotificationSocket;