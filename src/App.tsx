import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Compass, GraduationCap, Map, Maximize, Minimize, MousePointer2, Play, Sparkles, Star, Volume2, VolumeX } from 'lucide-react';
import SeasonWorld from './components/SeasonWorld';
import TeacherPanel from './components/TeacherPanel';
import { GuideAvatar } from './components/LearningUI';
import SpringMission from './components/missions/SpringMission';
import SummerMission from './components/missions/SummerMission';
import AutumnMission from './components/missions/AutumnMission';
import WinterMission from './components/missions/WinterMission';
import FinalMission from './components/missions/FinalMission';
import { initialProgress, MISSION_ORDER } from './data';
import { useClassroomAudio } from './hooks';
import type { MissionId, MissionReport, Progress, ViewId } from './types';

const STORAGE_KEY = 'season-quest-progress-v1';

function loadProgress(): Progress {
  const fallback = initialProgress();
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved) as Partial<Progress>;
    MISSION_ORDER.forEach((id) => {
      const mission = parsed[id];
      if (mission && typeof mission.completed === 'boolean') {
        fallback[id] = {
          completed: mission.completed,
          stars: Math.min(3, Math.max(0, Number(mission.stars) || 0)),
          mistakes: Array.isArray(mission.mistakes) ? mission.mistakes.filter((item): item is string => typeof item === 'string') : [],
          attempts: Math.max(0, Number(mission.attempts) || 0),
          correct: Math.max(0, Number(mission.correct) || 0),
        };
      }
    });
    return fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [view, setView] = useState<ViewId>('cover');
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { speak, playEffect } = useClassroomAudio(soundEnabled);
  const completed = MISSION_ORDER.filter((id) => progress[id].completed);
  const totalStars = MISSION_ORDER.reduce((sum, id) => sum + progress[id].stars, 0);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch { /* Storage can be disabled without blocking the lesson. */ }
  }, [progress]);

  useEffect(() => {
    const update = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);

  useEffect(() => {
    if (!soundEnabled && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  }, [soundEnabled]);

  const navigate = (nextView: ViewId) => {
    setView(nextView);
    setTeacherOpen(false);
    window.scrollTo(0, 0);
  };

  const completeMission = (id: MissionId, report: MissionReport) => {
    setProgress((current) => ({
      ...current,
      [id]: {
        completed: true,
        stars: Math.max(current[id].stars, report.stars),
        mistakes: [...current[id].mistakes, ...report.mistakes],
        attempts: current[id].attempts + report.attempts,
        correct: current[id].correct + report.correct,
      },
    }));
  };

  const nextMission = () => {
    const index = MISSION_ORDER.indexOf(view as MissionId);
    navigate(index >= 0 && index < MISSION_ORDER.length - 1 ? MISSION_ORDER[index + 1] : 'map');
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen is an optional classroom convenience.
    }
  };

  const resetProgress = () => {
    setProgress(initialProgress());
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* Ignore unavailable storage. */ }
  };

  const missionProps = (id: MissionId) => ({
    onComplete: (report: MissionReport) => completeMission(id, report),
    onBack: () => navigate('map'),
    onNext: nextMission,
    speak,
    playEffect,
    completed: progress[id].completed,
  });

  return (
    <div className={`app view-${view}`}>
      {view === 'cover' ? (
        <main className="cover-page">
          <div className="cover-world"><SeasonWorld compact /></div>
          <nav className="cover-nav">
            <button className="brand" onClick={() => navigate('cover')} aria-label="四季奇境首页">
              <span className="brand-mark"><i /><i /><i /><i /></span>
              <span><strong>四季奇境</strong><small>SEASON QUEST</small></span>
            </button>
            <div className="cover-nav__right"><span>四年级英语 · 单元复习</span><button className="button button--glass" onClick={() => setTeacherOpen(true)}><GraduationCap size={18} />教师观课</button></div>
          </nav>
          <div className="cover-content">
            <div className="cover-kicker"><span><Sparkles size={15} /></span>AI × ENGLISH · 互动复习课</div>
            <h1><span>四季奇境</span><strong>Season<br />Quest<em>®</em></strong></h1>
            <p className="cover-lead">穿越春、夏、秋、冬，在可探索的 3D 世界里<br className="desktop-only" />听英语、做选择、解任务，说出你的季节故事。</p>
            <div className="cover-actions">
              <button className="button button--hero" onClick={() => navigate('map')}><Play size={20} fill="currentColor" />开始四季冒险<ArrowRight size={20} /></button>
              <button className="button button--secondary cover-lesson-button" onClick={() => setTeacherOpen(true)}><BookOpen size={18} />查看教学设计</button>
            </div>
            <div className="cover-features" aria-label="课程特色">
              <span><Compass size={17} />3D 情境探索</span>
              <span><Sparkles size={17} />AI 适应性反馈</span>
              <span><Volume2 size={17} />语音互动</span>
              <span><GraduationCap size={17} />课堂学情诊断</span>
            </div>
          </div>
          <div className="cover-guide">
            <div className="cover-guide__bubble"><span>你的 AI 学习伙伴</span><strong>嗨，我是小探！</strong><p>准备好和我一起发现四季的语言密码了吗？</p></div>
            <GuideAvatar />
          </div>
          <div className="cover-bottom"><span><MousePointer2 size={15} />可拖动的 3D 四季世界</span><span>基于原课件教学内容重构 · 无需外部 API</span></div>
        </main>
      ) : (
        <>
          <header className="app-header">
            <button className="brand brand--small" onClick={() => navigate('cover')}>
              <span className="brand-mark"><i /><i /><i /><i /></span>
              <span><strong>四季奇境</strong><small>SEASON QUEST</small></span>
            </button>
            <button className={`header-map-button ${view === 'map' ? 'is-active' : ''}`} onClick={() => navigate('map')}><Map size={17} />四季地图</button>
            <div className="header-progress"><span>{completed.length}/5 任务</span><span><Star size={16} fill="currentColor" />{totalStars}</span></div>
            <div className="header-actions">
              <button className="icon-button" onClick={() => setSoundEnabled((value) => !value)} aria-label={soundEnabled ? '关闭声音' : '开启声音'} title={soundEnabled ? '关闭声音' : '开启声音'}>{soundEnabled ? <Volume2 /> : <VolumeX />}</button>
              <button className="icon-button fullscreen-button" onClick={toggleFullscreen} aria-label={isFullscreen ? '退出全屏' : '进入全屏'} title={isFullscreen ? '退出全屏' : '全屏授课'}>{isFullscreen ? <Minimize /> : <Maximize />}</button>
              <button className="button button--teacher" onClick={() => setTeacherOpen(true)}><GraduationCap size={18} /><span>教师面板</span></button>
            </div>
          </header>
          {view === 'map' && (
            <main className="map-page">
              <div className="map-heading">
                <div><span className="eyebrow"><Compass size={15} />3D LEARNING WORLD</span><h1>下一站，你想探索哪个季节？</h1><p>拖动旋转岛屿，点击季节场景进入任务；也可以使用下方任务卡。</p></div>
                <div className="map-progress-card"><span>探索进度</span><strong>{completed.length}<small>/ 5</small></strong><div><i style={{ width: `${(completed.length / 5) * 100}%` }} /></div><p>{completed.length === 0 ? '每一段语言冒险，都从这里开始' : completed.length === 5 ? '四季任务全部点亮，太出色了！' : `已获得 ${totalStars} 颗星，继续保持探索欲`}</p></div>
              </div>
              <SeasonWorld onSelect={navigate} completed={completed} />
              <div className="map-pedagogy"><span><b>01</b>情境中理解</span><i /><span><b>02</b>任务中运用</span><i /><span><b>03</b>反馈中改进</span><i /><span><b>04</b>表达中迁移</span></div>
            </main>
          )}
          {view === 'spring' && <SpringMission {...missionProps('spring')} />}
          {view === 'summer' && <SummerMission {...missionProps('summer')} />}
          {view === 'autumn' && <AutumnMission {...missionProps('autumn')} />}
          {view === 'winter' && <WinterMission {...missionProps('winter')} />}
          {view === 'final' && <FinalMission {...missionProps('final')} allSeasonsCompleted={MISSION_ORDER.filter((id) => id !== 'final').every((id) => progress[id].completed)} />}
        </>
      )}
      <TeacherPanel open={teacherOpen} onClose={() => setTeacherOpen(false)} progress={progress} onReset={resetProgress} onNavigate={navigate} />
    </div>
  );
}
