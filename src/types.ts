export type FontOption = "comic-neue" | "arial" | "andika" | "lexend" | "system-dyslexic";
export type ContrastTheme = "cream" | "warm-peach" | "pastel-yellow" | "soft-blue" | "dark-navy" | "charcoal";

export interface ReadingPreferences {
  fontFamily: FontOption;
  fontSize: number; // in pixels (e.g. 18, 20, 24)
  letterSpacing: number; // custom em/px adjustments (e.g., 1, 2, 3)
  wordSpacing: number; // custom spacing adjustments (e.g., 2, 4, 6)
  lineHeight: number; // e.g. 1.6, 2.0, 2.4
  theme: ContrastTheme;
  speechSpeed: number; // 0.5 to 2.0
  speechPitch: number; // 0.5 to 2.0
  voiceName: string;
  showRuler: boolean;
  rulerColor: string; // hex or tailwind color
  rulerHeight: number; // height of the focus window in px
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  encouragement: string;
}

export interface TopicNote {
  term: string;
  definition: string;
}

export interface SectionAnalysis {
  biteSizedSummary: string[];
  topicNotes: TopicNote[];
  quiz: QuizQuestion[];
}

export interface SavedCourse {
  id: string;
  title: string;
  sections: string[];
  currentSectionIndex: number;
  sourceUrl?: string;
  dateAdded: string;
  notes: string; // Text notes taken in workspace
  drawingStrokes?: string; // Serialized drawing strokes for the scribble pad
}

export interface ScribbleStroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
}
