import { useCallback, useRef } from 'react';

export function useClassroomAudio(soundEnabled: boolean) {
  const audioContext = useRef<AudioContext | null>(null);

  const speak = useCallback((text: string) => {
    if (!soundEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.82;
    utterance.pitch = 1.04;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((item) => item.lang.startsWith('en') && /Samantha|Google|Natural/i.test(item.name))
      ?? voices.find((item) => item.lang.startsWith('en'));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }, [soundEnabled]);

  const playEffect = useCallback((kind: 'correct' | 'wrong' | 'complete') => {
    if (!soundEnabled) return;
    try {
      audioContext.current ??= new AudioContext();
      const context = audioContext.current;
      const notes = kind === 'correct' ? [523.25, 659.25, 783.99]
        : kind === 'complete' ? [523.25, 659.25, 783.99, 1046.5]
          : [220, 185];
      notes.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = kind === 'wrong' ? 'sine' : 'triangle';
        oscillator.frequency.value = frequency;
        const start = context.currentTime + index * 0.09;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(kind === 'wrong' ? 0.05 : 0.08, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.2);
      });
    } catch {
      // Audio feedback is optional; the visual feedback remains available.
    }
  }, [soundEnabled]);

  return { speak, playEffect };
}
