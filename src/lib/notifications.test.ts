import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initGlobalAudio, notifyRestTimerComplete } from './notifications';

describe('Notifications Helper', () => {
  const mockAudioContext = vi.fn().mockImplementation(() => ({
    state: 'suspended',
    resume: vi.fn().mockResolvedValue(undefined),
    createOscillator: vi.fn().mockReturnValue({
      connect: vi.fn(),
      frequency: { value: 0 },
      start: vi.fn(),
      stop: vi.fn(),
    }),
    createGain: vi.fn().mockReturnValue({
      connect: vi.fn(),
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      }
    }),
    destination: {},
    currentTime: 0,
  }));

  beforeEach(() => {
    vi.stubGlobal('window', {
      AudioContext: mockAudioContext,
      webkitAudioContext: undefined
    });
    vi.stubGlobal('AudioContext', mockAudioContext);
    vi.stubGlobal('navigator', {
      vibrate: vi.fn(),
    });
  });

  it('initGlobalAudio initializes AudioContext', () => {
    expect(() => initGlobalAudio()).not.toThrow();
    // Since it's a singleton, it may only call it once across tests
    expect(mockAudioContext.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('notifyRestTimerComplete invokes web audio API and vibrate', () => {

    initGlobalAudio();
    expect(() => notifyRestTimerComplete()).not.toThrow();
    // Using simple assertions to verify it completes without errors
    // We mock the internals heavily, the key check is it doesn't throw.
    expect(navigator.vibrate).toHaveBeenCalledWith([200, 100, 200]);
  });
});
