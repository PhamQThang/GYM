import { useEffect, useState } from 'react';
import { useAppStore } from './store';

export function useRestTimer() {
  const restTimerActive = useAppStore(state => state.restTimerActive);
  const restTimerEndsAt = useAppStore(state => state.restTimerEndsAt);
  const restTimerSeconds = useAppStore(state => state.restTimerSeconds);
  const stopRestTimer = useAppStore(state => state.stopRestTimer);
  
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!restTimerActive || restTimerEndsAt === null) {
      setTimeout(() => setRemaining(0), 0);
      return;
    }

    const update = () => {
      const left = Math.max(0, Math.ceil((restTimerEndsAt - Date.now()) / 1000));
      setRemaining(left);
      
      if (left === 0) {
        stopRestTimer();
      }
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
