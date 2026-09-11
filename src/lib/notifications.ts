let audioContext: AudioContext | null = null;

export function initGlobalAudio() {
  if (typeof window === 'undefined') return;
  try {
    if (!audioContext) {
      // @ts-expect-error - webkitAudioContext is for Safari compatibility
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioContext = new AudioCtx();
      }
    }
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume().catch((err) => console.warn('Audio resume failed', err));
    }
  } catch (err) {
    console.warn('AudioContext initialization failed', err);
  }
}

export function notifyRestTimerComplete() {
  // Sound
  try {
    if (audioContext) {
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
      }
      
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.frequency.value = 880;
      osc.start();

      gain.gain.setValueAtTime(0.15, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.15
      );

      osc.stop(audioContext.currentTime + 0.15);
    }
  } catch (err) {
    console.warn('Audio playback failed', err);
  }

  // Vibration
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  } catch {
    // Ignore optionally thrown vibration errors on some browsers
  }
}
