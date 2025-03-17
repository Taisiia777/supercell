import React, { useEffect, useState } from 'react';
import './NotificationToast.css';

interface NotificationToastProps {
  message: string;
  onClose: () => void;
  duration?: number; // Duration in milliseconds, defaults to 5000ms (5 seconds)
  type?: 'info' | 'success' | 'warning' | 'error';
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  message,
  onClose,
  duration = 5000,
  type = 'info'
}) => {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  const [intervalId, setIntervalId] = useState<number | null>(null);

  useEffect(() => {
    // Start progress timer
    const interval = setInterval(() => {
      setProgress((oldProgress) => {
        const newProgress = oldProgress - (100 / (duration / 100));
        return newProgress <= 0 ? 0 : newProgress;
      });
    }, 100);

    setIntervalId(interval);

    // Set timeout to close notification
    const timeout = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        onClose();
      }, 300); // Wait for fade out animation to complete
    }, duration);

    // Cleanup
    return () => {
      if (intervalId) clearInterval(intervalId);
      clearTimeout(timeout);
    };
  }, [duration, onClose]);

  const handleClose = () => {
    setVisible(false);
    if (intervalId) clearInterval(intervalId);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for fade out animation to complete
  };

  return (
    <div className={`notification-toast notification-${type} ${visible ? 'show' : 'hide'}`}>
      <div className="notification-content">
        <div className="notification-message">{message}</div>
        <button className="notification-close" onClick={handleClose}>×</button>
      </div>
      <div className="notification-progress">
        <div 
          className="notification-progress-bar" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default NotificationToast;