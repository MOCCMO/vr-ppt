import { useEffect, useRef, useState } from 'react';
import { ArrowRight, AudioLines, Check, Edit3, Info, Leaf, Mic, MicOff, Send, Snowflake, Sparkles, Sun, Volume2 } from 'lucide-react';
import { analyzeSeasonAnswer, type AnswerAnalysis } from '../../analyzer';
import { SEASONS } from '../../data';
import type { MissionProps } from '../../types';
import { CompletionPanel, GuideAvatar, MissionHeader } from '../LearningUI';

interface RecognitionResultLike {
  results: {
    length: number;
    [index: number]: { [index: number]: { transcript: string } };
  };
}
interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: RecognitionResultLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}
type RecognitionConstructor = new () => RecognitionLike;

const PROMPTS = ['I like … best.', "It's … .", 'I wear … .', 'I can … because … .'];

interface FinalMissionProps extends MissionProps {
  allSeasonsCompleted: boolean;
}

export default function FinalMission({ onComplete, onBack, onNext, speak, playEffect, allSeasonsCompleted }: FinalMissionProps) {
  const [answer, setAnswer] = useState('');
  const [analysis, setAnalysis] = useState<AnswerAnalysis | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [correctAttempts, setCorrectAttempts] = useState(0);
  const [bestStars, setBestStars] = useState(0);
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState('点击麦克风说话，也可以直接在下方输入英文。');
  const [showCompletion, setShowCompletion] = useState(false);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const finishingRef = useRef(false);
  const Recognition = (window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }).SpeechRecognition
    ?? (window as unknown as { webkitSpeechRecognition?: RecognitionConstructor }).webkitSpeechRecognition;
  const selectedSeason = analysis?.season ?? SEASONS.find((season) => answer.toLowerCase().includes(season.id))?.id ?? null;

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const toggleListening = () => {
    if (!Recognition) {
      setVoiceMessage('当前浏览器不支持语音识别，请使用文字输入；智能反馈仍然可用。');
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcripts: string[] = [];
      for (let index = 0; index < event.results.length; index += 1) transcripts.push(event.results[index][0].transcript);
      const transcript = transcripts.join(' ');
      setAnswer((current) => `${current.trim()} ${transcript}`.trim());
      setAnalysis(null);
      setVoiceMessage('语音已转成文字，可以检查、修改后再提交。');
    };
    recognition.onerror = () => {
      setVoiceMessage('这次没有听清或麦克风未授权，可以再试一次，也可以改用文字输入。');
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
      setVoiceMessage('正在聆听… 用英语说出你最喜欢的季节，说完稍等片刻。');
    } catch {
      setVoiceMessage('麦克风暂时无法启动，请检查浏览器权限或使用文字输入。');
    }
  };

  const submit = () => {
    if (!answer.trim()) {
      setVoiceMessage('先说一句英文，再让 AI 助教为你分析。');
      playEffect('wrong');
      return;
    }
    const result = analyzeSeasonAnswer(answer);
    const isCorrect = Boolean(result.season && result.fullSentence && !result.consistencyIssue);
    setAnalysis(result);
    setAttempts((value) => value + 1);
    if (isCorrect) setCorrectAttempts((value) => value + 1);
    setBestStars((value) => Math.max(value, result.stars));
    const issues: string[] = [];
    if (!result.season) issues.push('核心季节词');
    if (!result.fullSentence) issues.push('完整句型');
    if (result.consistencyIssue) issues.push('季节与天气、活动的一致性');
    if (!result.hasReason) issues.push('季节理由表达');
    if (!result.hasExtension) issues.push('衣物或活动拓展');
    if (issues.length) setMistakes((items) => [...items, ...issues]);
    playEffect(isCorrect ? 'correct' : 'wrong');
  };

  const finish = () => {
    if (finishingRef.current || !analysis || analysis.stars < 3) return;
    finishingRef.current = true;
    onComplete({ stars: 3, mistakes, attempts, correct: correctAttempts });
    setShowCompletion(true);
    playEffect('complete');
  };

  const addPrompt = (prompt: string) => {
    setAnswer((current) => `${current.trim()} ${prompt}`.trim());
    setAnalysis(null);
  };

  return (
    <main className="mission-page final-page">
      <MissionHeader number="05" title="AI 四季发布会" english="SEASON PRESENTATION" description="语音交互 · 完整表达 · 可解释的即时反馈" color="#7164ad" icon={<Sparkles />} onBack={onBack} />
      <div className="ai-disclosure"><Info size={15} /><span>文字作答与进度仅保存在当前浏览器；语音转文字由浏览器提供，可能调用厂商识别服务，请按课堂隐私要求授权。未连接外部大模型。</span></div>
      <div className="mission-workspace final-workspace">
        <section className={`presentation-stage ${selectedSeason ? `is-${selectedSeason}` : ''}`}>
          <div className="presentation-visual">
            <span className="presentation-orb orb-one" /><span className="presentation-orb orb-two" />
            <div className="season-symbol">{selectedSeason === 'spring' ? <Leaf /> : selectedSeason === 'summer' ? <Sun /> : selectedSeason === 'autumn' ? <Leaf /> : selectedSeason === 'winter' ? <Snowflake /> : <AudioLines />}</div>
            <span className="eyebrow">MY SEASON STORY</span>
            <h2>{selectedSeason ? `I like ${selectedSeason} best.` : 'Which season do you like best?'}</h2>
            <p>{selectedSeason ? '现在，为你的季节故事补上理由和细节。' : '选择一个季节，完成你的四季英语微演讲。'}</p>
          </div>
          <div className="season-quick-picker">
            {SEASONS.map((season) => <button key={season.id} className={selectedSeason === season.id ? 'is-selected' : ''} onClick={() => { setAnswer(`I like ${season.id} best. `); setAnalysis(null); }}>{season.name}<span>{season.english}</span></button>)}
          </div>
          <div className="presentation-prompts">
            <span>表达脚手架 · 点击添加</span>
            {PROMPTS.map((prompt) => <button key={prompt} onClick={() => addPrompt(prompt)}>{prompt}</button>)}
          </div>
        </section>

        <section className="ai-studio">
          <div className="ai-coach-header">
            <GuideAvatar small color="#7164ad" />
            <div><span className="eyebrow">AI LEARNING COMPANION</span><h2>小探 · AI 学习伙伴</h2><p>我会从内容完整性给出修改建议，不评价你的口音好坏。</p></div>
            <span className="local-ai-badge">本地反馈</span>
          </div>
          <div className="ai-question"><Sparkles size={18} /><p>Which season do you like best? Why? What can you do in this season?</p><button onClick={() => speak('Which season do you like best? Why? What can you do in this season?')} aria-label="聆听问题"><Volume2 size={18} /></button></div>
          <div className="answer-input-wrap">
            <textarea value={answer} onChange={(event) => { setAnswer(event.target.value); setAnalysis(null); }} placeholder="例如：I like spring best. It's warm. I can fly a kite." aria-label="英文季节表达" rows={4} />
            <button className={`mic-button ${listening ? 'is-listening' : ''}`} onClick={toggleListening} aria-label={listening ? '停止语音识别' : '开始语音识别'}>{listening ? <MicOff /> : <Mic />}</button>
            <button className="edit-button" onClick={() => setAnswer('')} aria-label="清空回答"><Edit3 size={17} /></button>
          </div>
          <div className={`voice-status ${listening ? 'is-listening' : ''}`}><span className="voice-dot" />{voiceMessage}</div>
          <button className="button button--primary ai-submit" onClick={submit}><Sparkles size={18} />生成学习反馈</button>

          {analysis && (
            <div className="analysis-result" aria-live="polite">
              <div className="analysis-dimensions">
                <span className={analysis.season ? 'is-met' : ''}>{analysis.season ? <Check /> : <span>1</span>}季节选择</span>
                <span className={analysis.hasReason ? 'is-met' : ''}>{analysis.hasReason ? <Check /> : <span>2</span>}天气 / 理由</span>
                <span className={analysis.hasExtension ? 'is-met' : ''}>{analysis.hasExtension ? <Check /> : <span>3</span>}衣物 / 活动</span>
              </div>
              <div className="analysis-comment"><strong>{analysis.praise}</strong><p>{analysis.suggestion}</p></div>
              {analysis.season && <button className="button button--primary" onClick={finish} disabled={analysis.stars < 3}>{analysis.stars === 3 ? '带着 3 颗星完成发布会' : '按建议补齐表达后完成'}<ArrowRight size={18} /></button>}
            </div>
          )}
        </section>
      </div>
      <div className="ai-method-note"><Send size={15} /><span>反馈维度：季节信息 → 理由表达 → 迁移运用。所有分析只针对当前输入，结果可修改后重新生成。</span></div>
      {showCompletion && <CompletionPanel final stars={Math.max(1, bestStars)} title={allSeasonsCompleted ? '四季探索徽章已点亮！' : '季节发布会完成！'} message={allSeasonsCompleted ? '你完成了从词句理解到情境表达的四季任务链，并能根据反馈修改自己的英语表达。' : '你完成了一次情境一致、内容完整的季节微演讲。返回地图，还可以继续点亮其余四季任务。'} mistakes={mistakes} onBack={onBack} onNext={onNext} />}
    </main>
  );
}
