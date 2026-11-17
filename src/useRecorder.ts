import { useCallback, useEffect, useRef, useState } from 'react';
import type { SeasonId } from './types';

export interface Recording { url: string; extension: string; seconds: number; bytes: number; }
export default function useRecorder() {
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const urls = useRef<string[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const token = useRef(0);
  const mounted = useRef(true);
  const [recordingFor, setRecordingFor] = useState<SeasonId | null>(null);
  const [pending, setPending] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const [recordings, setRecordings] = useState<Partial<Record<SeasonId, Recording>>>({});
  const stop = useCallback(() => {
    token.current++;
    if (recorder.current?.state === 'recording') recorder.current.stop();
    stream.current?.getTracks().forEach(track => track.stop()); stream.current = null;
    if (timer.current) clearInterval(timer.current); timer.current = null;
    if (mounted.current) { setRecordingFor(null); setPending(false); }
  }, []);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; stop(); urls.current.forEach(url => URL.revokeObjectURL(url)); };
  }, [stop]);
  const start = useCallback(async (season: SeasonId) => {
    stop(); setError(''); setPending(true);
    const currentToken = ++token.current;
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') throw new Error('unsupported');
      const input = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current || token.current !== currentToken) { input.getTracks().forEach(track => track.stop()); return; }
      stream.current = input;
      const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find(type => MediaRecorder.isTypeSupported(type));
      const mediaRecorder = new MediaRecorder(input, mimeType ? { mimeType } : undefined);
      recorder.current = mediaRecorder;
      const chunks: BlobPart[] = []; const started = performance.now();
      mediaRecorder.ondataavailable = event => { if (event.data.size > 0) chunks.push(event.data); };
      mediaRecorder.onerror = () => { if (mounted.current) setError('录音中断，请检查麦克风后重试。'); stop(); };
      mediaRecorder.onstop = () => {
        const duration = Math.round((performance.now() - started) / 1000);
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' });
        if (mounted.current && blob.size > 0) {
          const url = URL.createObjectURL(blob); urls.current.push(url);
          setRecordings(previous => ({ ...previous, [season]: { url, extension: blob.type.includes('mp4') ? 'm4a' : 'webm', seconds: duration, bytes: blob.size } }));
        }
      };
      mediaRecorder.start(250); setSeconds(0); setRecordingFor(season); setPending(false);
      timer.current = setInterval(() => {
        const elapsed = Math.floor((performance.now() - started) / 1000); setSeconds(elapsed);
        if (elapsed >= 180) stop();
      }, 250);
    } catch (e) {
      if (!mounted.current || token.current !== currentToken) return;
      stop(); setError(e instanceof Error && e.message === 'unsupported' ? '当前浏览器暂不支持录音。请在 HTTPS 或本机地址下使用新版 Chrome / Safari；文字稿仍可下载。' : '麦克风未开启。请在浏览器中允许麦克风访问后重试；文字稿仍可下载。');
    }
  }, [stop]);
  return { recordingFor, pending, seconds, error, recordings, start, stop };
}
export type RecorderController = ReturnType<typeof useRecorder>;
