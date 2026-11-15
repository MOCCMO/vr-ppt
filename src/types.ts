export type SeasonId = 'spring' | 'summer' | 'autumn' | 'winter';
export type MissionId = SeasonId | 'final';
export type ViewId = 'cover' | 'map' | MissionId;

export interface MissionReport {
  stars: number;
  mistakes: string[];
  attempts: number;
  correct: number;
}

export interface MissionProgress extends MissionReport {
  completed: boolean;
}

export type Progress = Record<MissionId, MissionProgress>;

export interface MissionProps {
  onComplete: (report: MissionReport) => void;
  onBack: () => void;
  onNext: () => void;
  speak: (text: string) => void;
  playEffect: (kind: 'correct' | 'wrong' | 'complete') => void;
  completed: boolean;
}

export interface SeasonMeta {
  id: SeasonId;
  name: string;
  english: string;
  mission: string;
  missionEn: string;
  description: string;
  color: string;
  softColor: string;
  weather: string;
  sentence: string;
}
