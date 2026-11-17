import { useCallback, useEffect, useRef, useState } from 'react';
import type { AudioController, Page, SeasonId } from './types';

export const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export function useSaved<T>(key: string, initial: T, valid: (value: unknown) => value is T) {
  const [value, setValue] = useState<T>(() => {
    try { const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? 'null'); return valid(parsed) ? parsed : initial; }
    catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Private browsing may disallow persistence. */ } }, [key, value]);
  return [value, setValue] as const;
}

export const isString = (v: unknown): v is string => typeof v === 'string';
export const isEvidence = (v: unknown): v is Record<string, boolean> => !!v && typeof v === 'object' && !Array.isArray(v) && Object.values(v).every(x => typeof x === 'boolean');
export const isDrafts = (v: unknown): v is Record<SeasonId, string> => !!v && typeof v === 'object' && ['winter', 'spring', 'summer', 'autumn'].every(k => typeof (v as Record<string, unknown>)[k] === 'string');

export function readRoute(): { page: Page; season: SeasonId } {
  const [, rawPage, rawSeason] = window.location.hash.split('/');
  const page = (['case', 'journey', 'guide', 'reflection'].includes(rawPage) ? rawPage : 'case') as Page;
  const season = (['winter', 'spring', 'summer', 'autumn'].includes(rawSeason) ? rawSeason : 'winter') as SeasonId;
  return { page, season };
}

export function useLessonAudio(enabled: boolean): AudioController {
  const player = useRef<HTMLAudioElement | null>(null);
  const active = useRef<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [level, setLevel] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const context = useRef<AudioContext | null>(null);
  const meterTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stop = useCallback(() => {
    if (meterTimer.current) clearInterval(meterTimer.current);
    meterTimer.current = null;
    if (player.current) { player.current.onended = null; player.current.onerror = null; player.current.pause(); player.current.src = ''; player.current = null; }
    active.current = null; setPlaying(null); setLevel(0); setCurrentTime(0); setDuration(0);
  }, []);
  useEffect(() => { if (!enabled) { stop(); document.querySelectorAll<HTMLMediaElement>('audio, video').forEach(media => media.pause()); } }, [enabled, stop]);
  useEffect(() => () => { player.current?.pause(); if (meterTimer.current) clearInterval(meterTimer.current); void context.current?.close(); }, []);
  const play = useCallback((key: string) => {
    if (!enabled) { setError('声音已关闭，请先开启右上角的声音。'); return; }
    if (active.current === key) { stop(); return; }
    stop(); setError('');
    document.querySelectorAll<HTMLMediaElement>('audio, video').forEach(media => media.pause());
    const audio = new Audio(asset(`audio/judy-en/${key}.mp3`));
    let analyser: AnalyserNode | null = null;
    try {
      if (!context.current || context.current.state === 'closed') context.current = new AudioContext();
      void context.current.resume();
      const source = context.current.createMediaElementSource(audio);
      analyser = context.current.createAnalyser(); analyser.fftSize = 256;
      source.connect(analyser); analyser.connect(context.current.destination);
    } catch { /* Standard audio still plays when audio analysis is unavailable. */ }
    player.current = audio; active.current = key; setPlaying(key);
    const finish = () => { if (player.current === audio) { active.current = null; setPlaying(null); setLevel(0); if (meterTimer.current) clearInterval(meterTimer.current); } };
    const data = new Uint8Array(256);
    meterTimer.current = setInterval(() => {
      if (audio.paused) { setLevel(0); return; }
      setCurrentTime(audio.currentTime); setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      if (analyser) { analyser.getByteTimeDomainData(data); const rms = Math.sqrt(data.reduce((sum, value) => sum + ((value - 128) / 128) ** 2, 0) / data.length); setLevel(Math.min(1, rms * 7)); }
    }, 90);
    audio.onended = finish;
    audio.onerror = () => { finish(); setError('这段示范暂时无法播放，请重试。'); };
    audio.play().catch(() => { if (player.current === audio) { finish(); setError('播放未开始，请再点一次播放按钮。'); } });
  }, [enabled, stop]);
  return { playing, play, stop, error, level, currentTime, duration };
}

export function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob(['\ufeff' + text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A', 'VIDEO', 'AUDIO'].includes(target.tagName) || target.isContentEditable);
}
