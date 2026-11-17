export type SeasonId = 'winter' | 'spring' | 'summer' | 'autumn';
export type Page = 'case' | 'journey' | 'guide' | 'reflection';
export type Lens = 'rhyme' | 'images' | 'language' | 'feeling';
export type Evidence = Record<string, boolean>;
export interface Choice { question: string; options: string[]; answer: number; explanation: string; }
export interface Season {
  id: SeasonId; name: string; chinese: string; subtitle: string; color: string; pages: number[];
  heading: string; poem: string[]; translations: string[]; pauses: string[];
  rhymes: { word: string; partner: string; note?: string }[];
  images: { category: string; answer: string; choices: string[] }[];
  language: Choice; feeling: Choice;
  hotspots: { word: string; translation: string; line: number; angle: number; elevation: number }[];
  guide: string[];
}
export interface AudioController {
  playing: string | null;
  level: number;
  currentTime: number;
  duration: number;
  play: (key: string) => void;
  stop: () => void;
  error: string;
}
