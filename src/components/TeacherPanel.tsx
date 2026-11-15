import { useMemo, useState } from 'react';
import { BarChart3, BookOpen, BrainCircuit, Check, ChevronRight, ClipboardList, Database, Lightbulb, RotateCcw, Sparkles, Target, X } from 'lucide-react';
import { MISSION_ORDER, SEASONS } from '../data';
import type { MissionId, Progress } from '../types';
import { StarRating, useModalFocus } from './LearningUI';

interface TeacherPanelProps {
  open: boolean;
  onClose: () => void;
  progress: Progress;
  onReset: () => void;
  onNavigate: (id: MissionId) => void;
}

const MISSION_NAMES: Record<MissionId, string> = {
  spring: '春日词句花园', summer: '夏日清凉衣橱', autumn: '秋日落叶分类站', winter: '冰雪发音实验室', final: 'AI 四季发布会',
};

export default function TeacherPanel({ open, onClose, progress, onReset, onNavigate }: TeacherPanelProps) {
  const [tab, setTab] = useState<'insight' | 'design'>('insight');
  const summary = useMemo(() => {
    const missions = MISSION_ORDER.map((id) => progress[id]);
    const attempts = missions.reduce((sum, mission) => sum + mission.attempts, 0);
    const correct = missions.reduce((sum, mission) => sum + mission.correct, 0);
    const stars = missions.reduce((sum, mission) => sum + mission.stars, 0);
    const completed = missions.filter((mission) => mission.completed).length;
    const mistakeCounts = new Map<string, number>();
    missions.forEach((mission) => mission.mistakes.forEach((mistake) => mistakeCounts.set(mistake, (mistakeCounts.get(mistake) ?? 0) + 1)));
    const weakPoints = [...mistakeCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { attempts, correct, stars, completed, weakPoints, accuracy: attempts ? Math.round((correct / attempts) * 100) : 0 };
  }, [progress]);

  const dialogRef = useModalFocus<HTMLDivElement>(open, onClose);

  if (!open) return null;

  const reset = () => {
    if (window.confirm('确定清空当前浏览器中的全部任务进度和学情记录吗？')) onReset();
  };

  return (
    <div ref={dialogRef} className="teacher-overlay" role="dialog" aria-modal="true" aria-labelledby="teacher-panel-title" tabIndex={-1}>
      <button className="teacher-backdrop" onClick={onClose} aria-label="关闭教师面板" tabIndex={-1} />
      <aside className="teacher-panel">
        <header className="teacher-header">
          <div><span className="eyebrow">TEACHER DASHBOARD</span><h2 id="teacher-panel-title">教师观课面板</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="关闭"><X /></button>
        </header>
        <div className="teacher-tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'insight'} className={tab === 'insight' ? 'is-active' : ''} onClick={() => setTab('insight')}><BarChart3 size={17} />课堂学情</button>
          <button role="tab" aria-selected={tab === 'design'} className={tab === 'design' ? 'is-active' : ''} onClick={() => setTab('design')}><BookOpen size={17} />教学设计</button>
        </div>
        <div className="teacher-content">
          {tab === 'insight' ? (
            <>
              <div className="teacher-metrics">
                <div><strong>{summary.completed}<span>/5</span></strong><small>完成任务</small></div>
                <div><strong>{summary.stars}<span>/15</span></strong><small>累计星章</small></div>
                <div><strong>{summary.attempts ? `${summary.accuracy}%` : '—'}</strong><small>作答达成率</small></div>
              </div>
              <section className="teacher-section">
                <div className="teacher-section__title"><ClipboardList size={18} /><h3>任务表现</h3><span>点击进入</span></div>
                <div className="teacher-mission-list">
                  {MISSION_ORDER.map((id, index) => {
                    const mission = progress[id];
                    const accuracy = mission.attempts ? Math.round((mission.correct / mission.attempts) * 100) : null;
                    return (
                      <button key={id} onClick={() => onNavigate(id)}>
                        <span className={`teacher-mission-index ${mission.completed ? 'is-complete' : ''}`}>{mission.completed ? <Check size={16} /> : `0${index + 1}`}</span>
                        <span><strong>{MISSION_NAMES[id]}</strong><small>{mission.attempts ? `${mission.attempts} 次作答 · 达成率 ${accuracy}%` : '尚未开始'}</small></span>
                        <StarRating value={mission.stars} />
                        <ChevronRight size={16} />
                      </button>
                    );
                  })}
                </div>
              </section>
              <section className="teacher-section">
                <div className="teacher-section__title"><BrainCircuit size={18} /><h3>AI 学情诊断</h3><span className="local-ai-badge">本地分析</span></div>
                <div className="diagnosis-card">
                  <Sparkles size={21} />
                  {summary.attempts === 0 ? (
                    <div><strong>等待第一份学习证据</strong><p>学生完成任务后，这里会汇总错误点，并给出下一步教学建议。</p></div>
                  ) : summary.weakPoints.length ? (
                    <div><strong>建议进行二次针对性练习</strong><p>当前高频错误：{summary.weakPoints.slice(0, 2).map(([name]) => name).join('、')}。可先让学生听辨，再回到对应站点完成一次无提示挑战。</p></div>
                  ) : (
                    <div><strong>当前没有明显知识性错误</strong><p>可以提高表达要求：减少句型支架，引导学生补充季节活动与选择理由。</p></div>
                  )}
                </div>
                {summary.weakPoints.length > 0 && <div className="weak-point-list">{summary.weakPoints.map(([name, count]) => <span key={name}>{name}<small>{count} 次</small></span>)}</div>}
              </section>
              <div className="privacy-note"><Database size={16} /><span>文字作答与进度仅保存在当前浏览器；语音识别可能由浏览器厂商处理，请按课堂隐私要求授权。</span></div>
            </>
          ) : (
            <>
              <section className="teacher-section design-intro">
                <span className="eyebrow">GRADE 4 · ENGLISH REVIEW</span>
                <h3>四季奇境：从语言复习到情境表达</h3>
                <p>以四季探索为任务主线，把季节、天气、衣物、活动与语音知识组织成可观察、可评价的学习过程。</p>
              </section>
              <section className="teacher-section">
                <div className="teacher-section__title"><Target size={18} /><h3>学习目标</h3></div>
                <div className="objective-list">
                  <div><span>01</span><p><strong>语言理解</strong>在四季语境中理解并运用核心词汇、短语和句型。</p></div>
                  <div><span>02</span><p><strong>思维发展</strong>比较季节特征，按词义分类，判断天气与穿搭的关系。</p></div>
                  <div><span>03</span><p><strong>语音意识</strong>发现 ea 与 wh 的发音规律，并迁移到同类单词。</p></div>
                  <div><span>04</span><p><strong>综合表达</strong>借助支架完成季节微演讲，根据反馈主动修改。</p></div>
                </div>
              </section>
              <section className="teacher-section">
                <div className="teacher-section__title"><BrainCircuit size={18} /><h3>AI 与教学融合点</h3></div>
                <div className="ai-design-list">
                  <div><span>课前</span><p>以 3D 情境激活已有经验，用任务地图呈现学习目标。</p></div>
                  <div><span>课中</span><p>语音朗读与识别降低表达门槛；错误类型触发自适应提示。</p></div>
                  <div><span>评价</span><p>采集本地作答证据，生成可解释的反馈与薄弱点诊断。</p></div>
                  <div><span>迁移</span><p>通过减少句型支架，引导学生从完成任务走向自主表达。</p></div>
                </div>
              </section>
              <section className="teacher-section lesson-flow">
                <div className="teacher-section__title"><Lightbulb size={18} /><h3>比赛展示动线</h3></div>
                <p>3D 情境导入 → 任选一个站点展示交互 → AI 发布会展示语音/文字反馈 → 教师面板呈现学情闭环。</p>
                <small>可根据赛制时间自由跳转，所有站点无需按顺序解锁。</small>
              </section>
            </>
          )}
        </div>
        <footer className="teacher-footer">
          <button className="button button--ghost" onClick={reset}><RotateCcw size={17} />重置演示数据</button>
          <button className="button button--primary" onClick={onClose}>继续课堂<ChevronRight size={17} /></button>
        </footer>
        <div className="teacher-season-strip">{SEASONS.map((season) => <span key={season.id} style={{ background: season.color }} />)}</div>
      </aside>
    </div>
  );
}
