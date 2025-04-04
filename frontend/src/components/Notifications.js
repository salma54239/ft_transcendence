import React from 'react';
import { IoCheckmarkCircle, IoWarning, IoInformationCircle, IoClose } from "react-icons/io5";
import { useNotification } from '../context/NotificationContext';
import './Notifications.css';

const Notifications = () => {
  const { notifications, removeNotification } = useNotification();

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <IoCheckmarkCircle className="notification-icon" />;
      case 'error':
        return <IoWarning className="notification-icon" />;
      case 'warning':
        return <IoWarning className="notification-icon" />;
      default:
        return <IoInformationCircle className="notification-icon" />;
    }
  };

  return (
    <div className="notifications-container">
      {notifications.map(({ id, message, type }) => (
        <div key={id} className={`notification ${type}`}>
          {getIcon(type)}
          <span className="notification-message">{message}</span>
          <button 
            onClick={() => removeNotification(id)}
            className="notification-close"
          >
            <IoClose />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Notifications;