export interface Question {
  id: string;
  prompt: string;
  answer: string;
  points: number;
  image?: string;
  options?: string[];
  correctIndex?: number;
}

export interface Assignment {
  code: string;
  title: string;
  createdAt: number;
  expiresAt: number;
  questions: Question[];
}

export interface Submission {
  id: string;
  name: string;
  submittedAt: number;
  answers: number[];
  score: number;
  total: number;
}

export interface StudentAssignment {
  code: string;
  title: string;
  expiresAt: number;
  questions: Pick<Question, "id" | "prompt" | "image" | "options">[];
}

export interface QuestionSet {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  updatedAt: number;
  category?: string;
}

export type PowerUpKind = "bonus" | "lose" | "double" | "steal" | "swap" | "give";

export interface Team {
  id: string;
  name: string;
  color: string;
  score: number;
  doubleNext: boolean;
}

export type Tile =
  | { id: string; number: number; used: boolean; kind: "question"; question: Question }
  | { id: string; number: number; used: boolean; kind: "powerup"; powerUp: PowerUpKind; amount: number };

export type PowerUpFrequency = "none" | "some" | "many";

export interface GameState {
  setId: string;
  setTitle: string;
  teams: Team[];
  tiles: Tile[];
  currentTeam: number;
  startedAt: number;
}
