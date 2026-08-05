import React, { useEffect, useState } from 'react';

// Export a singleton function to announce messages from anywhere
let announceFn: (message: string) => void = () => {};

export function announceToScreenReader(message: string) {
  announceFn(message);
}

export function LiveRegion() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    announceFn = (msg: string) => {
      setMessage(msg);
      // Clear after a while so the same message can be announced again if needed
      setTimeout(() => setMessage(''), 3000);
    };
  }, []);

  return (
    <div 
      role="status" 
      aria-live="polite" 
      aria-atomic="true" 
      className="sr-only"
    >
      {message}
    </div>
  );
}
