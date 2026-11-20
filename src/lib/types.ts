export interface Question {
  id: string;
  prompt: string;
  answer: string;
  points: number;
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
