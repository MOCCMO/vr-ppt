import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Film, Focus, Headphones, Home, Layers, Mic, MousePointer2, Pause, Play, RotateCcw, SkipForward, Undo2 } from 'lucide-react';
import manifest from '../ppt-manifest.json';
import { SEASONS, SLIDE_TITLES } from '../curriculum';
import { asset } from '../lib';
import type { AudioController, SeasonId } from '../types';
import JudyGuide from './JudyGuide';
import CoverPatch from './CoverPatch';

export default function PPTClassroom({ page, step, onStep, onPage, onHome, onNext, onPrevious, onContents, audio, sound, follow, onFollow, focused, onFocus, onActivity, onExplore }: {
  page: number; step: number; onStep: (value: number) => void; onPage: (page: number) => void; onHome: () => void; onNext: () => void; onPrevious: () => void;
  onContents: () => void; audio: AudioController; sound: boolean; follow: boolean; onFollow: (value: boolean) => void; focused: boolean; onFocus: () => void; onActivity: (step: number) => void; onExplore: (season: SeasonId) => void;
}) {
  const meta = manifest.slides[page - 1];
  const [laser, setLaser] = useState(false);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const [video, setVideo] = useState(false);
  const [imageError, setImageError] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const currentSeason = page >= 4 && page <= 6 ? 'winter' : page >= 7 && page <= 9 ? 'spring' : page >= 10 && page <= 12 ? 'summer' : page >= 13 && page <= 15 ? 'autumn' : null;
  const isMap = [4, 7, 10, 13].includes(page);
  const key = meta.frames[Math.min(step, meta.frames.length - 1)];
  const mediaSeason = page === 9 ? 'spring' : 'autumn';
  useEffect(() => { setVideo(false); setImageError(false); setPointer(null); }, [page]);
  useEffect(() => {
    const candidates = [meta.frames[step + 1], manifest.slides[page]?.frames[0]].filter(Boolean);
    candidates.forEach(path => { const img = new Image(); img.src = asset(path); });
  }, [page, step, meta.frames]);
  const rect = meta.videoRect;
  const videoVisible = rect && step >= (meta.videoFrom ?? 0);
  useEffect(() => { if (!videoVisible) setVideo(false); }, [videoVisible]);
  const groupName = page <= 3 ? 'Case introduction' : page <= 15 ? 'Case search' : page <= 19 ? 'Detective guide' : 'Thinking of the case';
  return <main className={`ppt-classroom ${currentSeason ? `room-${currentSeason}` : 'room-case'} ${focused ? 'is-focused' : ''}`}>
    <div className="ppt-chapter-bar"><button className="ppt-home-back" onClick={onHome}><Home size={15} /><span>课程首页</span></button><span className="chapter-divider" /><span className="ppt-group-name">{groupName}</span><nav className="ppt-season-nav" aria-label="季节章节">{SEASONS.map((s, i) => <button key={s.id} className={currentSeason === s.id ? 'is-current' : ''} aria-current={currentSeason === s.id ? 'step' : undefined} onClick={() => onPage(s.pages[0])}><span>0{i + 1}</span>{s.name}{i < 3 && <ChevronRight size={12} />}</button>)}</nav><button className="icon-button" onClick={onContents} aria-label="打开 22 页课件目录" title="课件目录"><Layers size={18} /></button></div>
    <div className="ppt-room">
      <div className="ppt-room-background" style={{ backgroundImage: `url(${asset('assets/seasons-panorama.webp')})` }} />
      <div className="ppt-screen-area">
        <div className="ppt-screen-top"><span><i />{isMap ? 'THE SEASON MAP' : 'THE ORIGINAL PRESENTATION'}</span><button onClick={onFocus} aria-label={focused ? '退出课件专注模式' : '放大课件专注模式'}><Focus size={15} />{focused ? '显示朱迪' : '放大课件'}</button></div>
        <div ref={frameRef} className={`ppt-screen ${laser ? 'laser-enabled' : ''}`} onPointerMove={event => { if (!laser) return; const bounds = event.currentTarget.getBoundingClientRect(); setPointer({ x: (event.clientX - bounds.left) / bounds.width * 100, y: (event.clientY - bounds.top) / bounds.height * 100 }); }} onPointerLeave={() => setPointer(null)}>
          <img className="ppt-frame" src={asset(key)} alt={`原课件第 ${page} 页：${SLIDE_TITLES[page - 1]}，第 ${step + 1} 个画面，共 ${meta.frames.length} 个画面`} onLoad={() => setImageError(false)} onError={() => setImageError(true)} draggable={false} />
          {page === 1 && <CoverPatch />}
          <button className="ppt-click-layer" aria-label="点击课件显示下一步" onClick={() => { if (!laser) onNext(); }} />
          {meta.mapHotspots.map(h => <button key={h.season} className={`ppt-map-hotspot ${h.season === currentSeason ? 'is-next' : ''}`} style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.w}%`, height: `${h.h}%` }} onClick={() => onPage(SEASONS.find(s => s.id === h.season)!.pages[0])} aria-label={`从地图进入 ${h.season}`}><span>进入 {SEASONS.find(s => s.id === h.season)!.name}<ArrowRight size={12} /></span></button>)}
          {rect && videoVisible && !video && <button className="ppt-video-play" style={{ left: `${rect.x + rect.w / 2}%`, top: `${rect.y + rect.h / 2}%` }} onClick={() => { audio.stop(); setVideo(true); }} aria-label="播放课件中的原视频"><Play size={24} fill="currentColor" /></button>}
          {rect && videoVisible && video && <video key={page} className="ppt-native-video" style={{ left: `${rect.x}%`, top: `${rect.y}%`, width: `${rect.w}%`, height: `${rect.h}%` }} controls playsInline autoPlay muted={!sound} src={asset(`media/${mediaSeason}.mp4`)} poster={asset(`assets/${mediaSeason}-video-poster.webp`)} onPlay={audio.stop}><track kind="captions" srcLang="en" label="Poem" src={asset(`media/${mediaSeason}.vtt`)} default /></video>}
          {laser && pointer && <span className="ppt-laser" style={{ left: `${pointer.x}%`, top: `${pointer.y}%` }} />}
          {imageError && <div className="ppt-image-error" role="alert">这页画面暂时未加载，请刷新页面重试。</div>}
        </div>
        <div className="ppt-screen-under"><span>{String(page).padStart(2, '0')} <i>/ 22</i><b>{SLIDE_TITLES[page - 1]}</b></span><span>{meta.frames.length > 1 ? `点击逐步显现 · ${step + 1} / ${meta.frames.length}` : isMap ? '点击岛屿，进入对应季节' : '点击画面，继续下一页'}</span></div>
        <div className="ppt-context-tools">
          <button className={laser ? 'is-selected' : ''} aria-pressed={laser} onClick={() => { setLaser(v => !v); setPointer(null); }}><MousePointer2 size={14} />激光笔</button>
          <button onClick={() => onStep(0)} disabled={step === 0}><RotateCcw size={14} />重放本页</button>
          {currentSeason && !isMap && <button onClick={() => audio.play(currentSeason)}>{audio.playing === currentSeason ? <Pause size={14} /> : <Headphones size={14} />}听本节诗歌</button>}
          {rect && <button onClick={() => { audio.stop(); if (!video) onStep(Math.max(step, meta.videoFrom ?? 0)); setVideo(v => !v); }}><Film size={14} />{video ? '收起视频' : '播放原视频'}</button>}
          {page >= 16 && page <= 19 && <button className="context-primary" onClick={() => onActivity(page === 16 ? 0 : page === 17 ? 1 : 2)}>{page >= 18 ? <Mic size={14} /> : <Play size={14} />}{page === 16 ? '听读词汇' : page === 17 ? '完成填空' : '录制我的导览'}</button>}
          {page >= 20 && <button className="context-primary" onClick={() => onActivity(3)}><Mic size={14} />写下我的思考与诗歌</button>}
          {currentSeason && <button className="context-explore" onClick={() => onExplore(currentSeason)}>环顾{SEASONS.find(s => s.id === currentSeason)!.chinese}日诗境 <ArrowRight size={12} /></button>}
        </div>
      </div>
      {!focused && <JudyGuide page={page} audio={audio} follow={follow} onFollow={onFollow} />}
    </div>
    <footer className="ppt-player"><button className="player-back" onClick={onPrevious} disabled={page === 1 && step === 0} aria-label="上一步"><ArrowLeft size={19} /><span>上一步</span></button><div className="ppt-page-progress"><span style={{ '--course-progress': `${((page - 1) + (step + 1) / meta.frames.length) / 22 * 100}%` } as CSSProperties} /><small>{isMap ? '沿着课件路线继续' : `原课件第 ${page} 页`}</small></div><div className="player-next-group"><button className="player-skip" onClick={() => page < 22 ? onPage(page + 1) : onHome()} aria-label={page === 22 ? '返回首页' : '直接下一页'}><SkipForward size={17} /><span>{page === 22 ? '首页' : '下一页'}</span></button><button className="player-next" onClick={onNext}>{step < meta.frames.length - 1 ? '下一步' : page === 22 ? '完成课堂' : isMap ? '按顺序出发' : '继续'}{page === 22 && step === meta.frames.length - 1 ? <Check size={18} /> : <ArrowRight size={18} />}</button></div></footer>
    {focused && <button className="exit-focus" onClick={onFocus}><Undo2 size={15} />返回课堂视图</button>}
  </main>;
}
