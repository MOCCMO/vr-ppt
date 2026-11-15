import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Award, Check, Map, Star, Volume2 } from 'lucide-react';

export function GuideAvatar({ color = '#7569bd', small = false }: { color?: string; small?: boolean }) {
  return (
    <svg className={`guide-avatar ${small ? 'guide-avatar--small' : ''}`} viewBox="0 0 150 170" role="img" aria-label="AI 学习伙伴小探">
      <ellipse cx="75" cy="158" rx="45" ry="8" fill="#173f35" opacity=".1" />
      <path d="M43 64C29 40 29 8 42 6c14-2 22 30 23 53" fill="#d9d5ec" stroke="#394b55" strokeWidth="3" />
      <path d="M84 59C85 31 94 4 107 7c13 4 6 38-7 62" fill="#d9d5ec" stroke="#394b55" strokeWidth="3" />
      <path d="M43 51c-7-17-7-34-2-35 6-1 13 20 15 38" fill="#efadba" />
      <path d="M94 51c3-18 9-34 13-33 5 2 0 22-7 38" fill="#efadba" />
      <ellipse cx="75" cy="87" rx="47" ry="43" fill="#e8e5f2" stroke="#394b55" strokeWidth="3" />
      <path d="M37 80c4-27 22-40 39-40 21 0 36 14 40 35-12-7-22-19-27-28-11 17-29 28-52 33Z" fill="#c5c0dc" />
      <ellipse cx="55" cy="87" rx="6" ry="8" fill="#263f47" />
      <ellipse cx="96" cy="87" rx="6" ry="8" fill="#263f47" />
      <circle cx="57" cy="84" r="2" fill="white" />
      <circle cx="98" cy="84" r="2" fill="white" />
      <path d="M70 101q5-5 10 0-1 7-5 7t-5-7Z" fill="#d88999" stroke="#394b55" strokeWidth="2" />
      <path d="M75 108q-8 9-15 1m15-1q8 9 15 1" fill="none" stroke="#394b55" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="45" cy="103" r="7" fill="#efb1b8" opacity=".55" />
      <circle cx="105" cy="103" r="7" fill="#efb1b8" opacity=".55" />
      <path d="M44 126q31-15 62 0l8 29H36l8-29Z" fill={color} stroke="#394b55" strokeWidth="3" />
      <path d="m63 121 12 14 12-14" fill="#fff8e9" stroke="#394b55" strokeWidth="2.5" />
      <path d="M75 135v20" stroke="#394b55" strokeWidth="2.5" />
      <circle cx="91" cy="139" r="7" fill="#f6c85f" stroke="#394b55" strokeWidth="2" />
      <path d="m91 135 1.5 3 3.5.5-2.5 2.5.5 3.5-3-1.6-3 1.6.5-3.5-2.5-2.5 3.5-.5 1.5-3Z" fill="#fff7db" />
    </svg>
  );
}

export function SpeakButton({ text, speak, label = '听一听', compact = false }: { text: string; speak: (text: string) => void; label?: string; compact?: boolean }) {
  return (
    <button className={`speak-button ${compact ? 'speak-button--compact' : ''}`} onClick={() => speak(text)} aria-label={`${label}：${text}`}>
      <Volume2 size={compact ? 17 : 19} />
      {!compact && <span>{label}</span>}
    </button>
  );
}

export function StarRating({ value, large = false }: { value: number; large?: boolean }) {
  return (
    <span className={`star-rating ${large ? 'star-rating--large' : ''}`} aria-label={`获得 ${value} 颗星，共 3 颗`}>
      {[1, 2, 3].map((star) => <Star key={star} fill={star <= value ? 'currentColor' : 'none'} className={star <= value ? 'is-earned' : ''} />)}
    </span>
  );
}

interface MissionHeaderProps {
  number: string;
  title: string;
  english: string;
  description: string;
  color: string;
  icon: ReactNode;
  onBack: () => void;
}

export function MissionHeader({ number, title, english, description, color, icon, onBack }: MissionHeaderProps) {
  return (
    <header className="mission-header" style={{ '--mission-color': color } as React.CSSProperties}>
      <button className="icon-button mission-back" onClick={onBack} aria-label="返回四季地图"><ArrowLeft /></button>
      <div className="mission-emblem">{icon}</div>
      <div className="mission-heading">
        <span className="eyebrow">MISSION {number} · {english}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </header>
  );
}

const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]';

export function useModalFocus<T extends HTMLElement>(active: boolean, onClose?: () => void) {
  const dialogRef = useRef<T>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!active || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const background = Array.from(dialog.parentElement?.children ?? [])
      .filter((element): element is HTMLElement => element instanceof HTMLElement && element !== dialog);
    const previousInert = background.map((element) => element.inert);
    background.forEach((element) => { element.inert = true; });

    const getFocusable = () => Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      .filter((element) => element.tabIndex >= 0 && element.getAttribute('aria-hidden') !== 'true');
    const focusable = getFocusable();
    (focusable[0] ?? dialog).focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeRef.current) {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const elements = getFocusable();
      if (!elements.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      background.forEach((element, index) => { element.inert = previousInert[index]; });
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [active]);

  return dialogRef;
}

interface CompletionPanelProps {
  stars: number;
  title?: string;
  message: string;
  mistakes: string[];
  onBack: () => void;
  onNext: () => void;
  final?: boolean;
}

export function CompletionPanel({ stars, title = '任务完成！', message, mistakes, onBack, onNext, final = false }: CompletionPanelProps) {
  const dialogRef = useModalFocus<HTMLDivElement>(true);
  return (
    <div ref={dialogRef} className="completion-overlay" role="dialog" aria-modal="true" aria-labelledby="completion-title" tabIndex={-1}>
      <div className="completion-card">
        <div className="completion-badge"><Award size={42} /></div>
        <span className="eyebrow">{final ? 'SEASON EXPLORER' : 'MISSION COMPLETE'}</span>
        <h2 id="completion-title">{title}</h2>
        <StarRating value={stars} large />
        <p>{message}</p>
        {mistakes.length > 0 ? (
          <div className="completion-review">
            <strong>AI 学习建议</strong>
            <span>再练一练：{[...new Set(mistakes)].slice(0, 3).join('、')}，下次会更熟练。</span>
          </div>
        ) : (
          <div className="completion-review completion-review--success"><Check size={18} /><span>本轮没有知识性错误，表达与判断都很出色。</span></div>
        )}
        <div className="completion-actions">
          <button className="button button--secondary" onClick={onBack}><Map size={18} />返回地图</button>
          <button className="button button--primary" onClick={onNext}>{final ? '回到四季地图' : '前往下一站'}<ArrowRight size={18} /></button>
        </div>
      </div>
    </div>
  );
}
