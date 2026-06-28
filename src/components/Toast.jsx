import React, { useEffect, useRef } from 'react';

export default function Toast({ message, onDismiss }) {
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timerRef.current);
  }, [message]);

  useEffect(() => {
    function onPointerDown(e) {
      const el = document.getElementById('toast-box');
      if (el && !el.contains(e.target)) onDismiss();
    }
    // Delay so the triggering click doesn't immediately dismiss the toast
    const id = setTimeout(() => document.addEventListener('pointerdown', onPointerDown), 100);
    return () => {
      clearTimeout(id);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  if (!message) return null;

  return (
    <div id="toast-box" onClick={onDismiss}>
      {message}
    </div>
  );
}
