import { useEffect, useState, useRef } from 'react';
import { useAppStore } from './store';
import { notifyRestTimerComplete } from './notifications';

export function useRestTimer() {
  const restTimerActive = useAppStore(state => state.restTimerActive);
  const restTimerEndsAt = useAppStore(state => state.restTimerEndsAt);
  const restTimerSeconds = useAppStore(state => state.restTimerSeconds);
  const stopRestTimer = useAppStore(state => state.stopRestTimer);
  
  const [remaining, setRemaining] = useState(0);
  const prevRemainingRef = useRef<number>(0);

  useEffect(() => {
    if (!restTimerActive || restTimerEndsAt === null) {
      setTimeout(() => {
        setRemaining(0);
        prevRemainingRef.current = 0;
      }, 0);
      return;
    }

    const update = () => {
      const left = Math.max(0, Math.ceil((restTimerEndsAt - Date.now()) / 1000));
      setRemaining(left);
      
      if (left === 0) {
        if (prevRemainingRef.current > 0) {
          const soundEnabled = useAppStore.getState().user.soundEnabled ?? true;
          if (soundEnabled) {
            notifyRestTimerComplete();
          }
        }
        stopRestTimer();
      }
      prevRemainingRef.current = left;
    };

    update();
    const id = setInterval(update, 250);

    return () => clearInterval(id);
  }, [restTimerActive, restTimerEndsAt, stopRestTimer]);

  return {
    remaining,
    active: restTimerActive,
    total: restTimerSeconds
  };
}
