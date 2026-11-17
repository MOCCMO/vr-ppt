import { ArrowRight, BookOpen, Compass, Play } from 'lucide-react';
import { SEASONS } from '../curriculum';
import { asset } from '../lib';
import type { AudioController } from '../types';
import JudyGuide from './JudyGuide';
import CoverPatch from './CoverPatch';

export default function PPTHome({ onPage, audio, follow, onFollow }: { onPage: (page: number) => void; audio: AudioController; follow: boolean; onFollow: (value: boolean) => void }) {
  return <main className="ppt-home">
    <div className="ppt-home-intro"><div><h1>Seasons of the year<span>.</span></h1><p>跟随朱迪，走进课件里的四季。</p></div><div className="ppt-home-actions"><button className="text-button" onClick={() => onPage(4)}><Compass size={16} />四季地图</button><button className="button button--primary" onClick={() => onPage(1)}><Play size={15} fill="currentColor" />从第一页开始 <ArrowRight size={17} /></button></div></div>
    <div className="ppt-home-main"><button className="source-cover" onClick={() => onPage(1)} aria-label="打开 Seasons 原课件第一页"><img src={asset('ppt-frames/01-00.webp')} alt="11.17 seasons-1.pptx 原始封面：Unit 6 Seasons of the year" fetchPriority="high" /><CoverPatch /><span className="source-cover-open"><Play size={18} fill="currentColor" />开启这场四季侦查</span></button><JudyGuide page={1} audio={audio} follow={follow} onFollow={onFollow} compact /></div>
    <div className="ppt-route-heading"><span><Compass size={14} />THE SEASON ROUTE</span><p>按原课件顺序探索 · 冬 → 春 → 夏 → 秋</p></div>
    <nav className="ppt-portals" aria-label="按课件顺序进入四个季节">{SEASONS.map((s, i) => <button key={s.id} className={`ppt-portal portal-${s.id}`} onClick={() => onPage(s.pages[0])} aria-label={`进入 ${s.name} 原课件第 ${s.pages[0]} 页`}><span className="portal-order">0{i + 1}</span><img src={asset(`assets/${s.id}-island.webp`)} alt="" /><div><strong>{s.name}</strong><span>{s.chinese} · PPT {s.pages.join('–')}</span></div><ArrowRight size={18} /></button>)}</nav>
    <footer className="ppt-home-footer"><span><BookOpen size={13} />以 11.17 seasons-1.pptx 为准 · 22 页</span><span>点进季节，就是原课件画面。</span></footer>
  </main>;
}
