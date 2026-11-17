import { lazy, Suspense, useState } from 'react';
import { Languages, Pause, Play, Volume2 } from 'lucide-react';
import type { AudioController } from '../types';
const JudyAvatar3D = lazy(() => import('./JudyAvatar3D'));
import { NARRATION } from '../ppt-narration';

export default function JudyGuide({ page, audio, compact = false, follow, onFollow }: { page: number; audio: AudioController; compact?: boolean; follow: boolean; onFollow: (value: boolean) => void }) {
  const [chinese, setChinese] = useState(true);
  const active = audio.playing === `judy-${String(page).padStart(2, '0')}`;
  const speaking = audio.playing !== null;
  const narration = NARRATION[page - 1];
  return <aside className={`judy-guide ${compact ? 'judy-guide--compact' : ''} ${speaking ? 'is-speaking' : ''}`} aria-label="朱迪数字讲解员">
    <div className="judy-heading"><span className="judy-status" /><span>JUDY HOPPS</span><span className="judy-live">{speaking ? '正在讲解' : '数字讲解员'}</span></div>
    <Suspense fallback={<div className="judy-3d"><span className="judy-3d-loading">朱迪正在就位…</span></div>}>
      <JudyAvatar3D page={page} audio={audio} active={speaking} onSpeak={() => speaking ? audio.stop() : audio.play(`judy-${String(page).padStart(2, '0')}`)} />
    </Suspense>
    <div className="judy-speech"><div className="judy-speech-label"><Volume2 size={13} /><span>{chinese ? '朱迪的提示' : 'Judy’s guide'}</span><button onClick={() => setChinese(v => !v)} aria-label={chinese ? '显示英语讲解文字' : '显示中文讲解文字'}><Languages size={14} />{chinese ? 'EN' : '中'}</button></div><p lang={chinese ? 'zh-CN' : 'en'}>{chinese ? narration.cn : narration.en}</p></div>
    <button className={`judy-play ${active ? 'is-active' : ''}`} onClick={() => audio.play(`judy-${String(page).padStart(2, '0')}`)}>{active ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}{active ? '暂停讲解' : '听朱迪讲这页'}</button>
    {active && <div className="judy-audio-progress"><span style={{ width: `${audio.duration ? audio.currentTime / audio.duration * 100 : 0}%` }} /></div>}
    <label className="judy-follow"><input type="checkbox" checked={follow} onChange={e => onFollow(e.target.checked)} /><span>翻页时自动讲解</span></label>
    {audio.error && <p className="judy-error" role="status">{audio.error}</p>}
  </aside>;
}
