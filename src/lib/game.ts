import { newId } from "./storage";
import type { GameState, PowerUpFrequency, PowerUpKind, QuestionSet, Team, Tile } from "./types";

export const TEAM_COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b"];
export const DEFAULT_TEAM_NAMES = ["Đội Đỏ", "Đội Xanh Dương", "Đội Xanh Lá", "Đội Vàng"];

export const POWER_UPS: Record<PowerUpKind, { icon: string; title: string; needsTarget: boolean; describe: (n: number) => string }> = {
  bonus: { icon: "🎁", title: "Quà tặng", needsTarget: false, describe: (n) => `Đội của bạn được cộng ${n} điểm!` },
  lose: { icon: "💣", title: "Bom", needsTarget: false, describe: (n) => `Ôi không! Đội của bạn bị trừ ${n} điểm.` },
  double: { icon: "⚡", title: "Nhân đôi", needsTarget: false, describe: () => "Câu trả lời đúng tiếp theo của đội bạn được nhân đôi điểm." },
  steal: { icon: "🦊", title: "Cướp điểm", needsTarget: true, describe: (n) => `Chọn một đội để lấy ${n} điểm của họ.` },
  swap: { icon: "🔄", title: "Đổi điểm", needsTarget: true, describe: () => "Chọn một đội để hoán đổi toàn bộ điểm số." },
  give: { icon: "🤝", title: "Tặng điểm", needsTarget: true, describe: (n) => `Bạn phải tặng ${n} điểm cho một đội khác.` },
};

const POWER_UP_AMOUNTS: Record<PowerUpKind, number[]> = {
  bonus: [10, 15, 20],
  lose: [5, 10, 15],
  double: [0],
  steal: [10, 15],
  swap: [0],
  give: [5, 10],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createGame(
  set: QuestionSet,
  teams: { name: string; color: string }[],
  frequency: PowerUpFrequency,
): GameState {
  const questions = set.questions.filter((q) => q.prompt.trim());
  const ratio = frequency === "none" ? 0 : frequency === "some" ? 0.25 : 0.5;
  const powerCount = Math.round(questions.length * ratio);
  const kinds = Object.keys(POWER_UPS) as PowerUpKind[];

  const raw: Omit<Tile, "number">[] = [
    ...questions.map((question) => ({ id: newId(), used: false, kind: "question" as const, question })),
    ...Array.from({ length: powerCount }, () => {
      const powerUp = pick(kinds);
      return { id: newId(), used: false, kind: "powerup" as const, powerUp, amount: pick(POWER_UP_AMOUNTS[powerUp]) };
    }),
  ];

  return {
    setId: set.id,
    setTitle: set.title,
    teams: teams.map((t): Team => ({ id: newId(), name: t.name, color: t.color, score: 0, doubleNext: false })),
    tiles: shuffle(raw).map((t, i) => ({ ...t, number: i + 1 }) as Tile),
    currentTeam: 0,
    startedAt: Date.now(),
  };
}

function finishTurn(game: GameState, tileId: string, teams: Team[]): GameState {
  return {
    ...game,
    teams,
    tiles: game.tiles.map((t) => (t.id === tileId ? { ...t, used: true } : t)),
    currentTeam: (game.currentTeam + 1) % game.teams.length,
  };
}

export function resolveQuestion(game: GameState, tileId: string, correct: boolean): GameState {
  const tile = game.tiles.find((t) => t.id === tileId);
  if (!tile || tile.kind !== "question") return game;
  const teams = game.teams.map((team, i) => {
    if (i !== game.currentTeam || !correct) return team;
    const gain = tile.question.points * (team.doubleNext ? 2 : 1);
    return { ...team, score: team.score + gain, doubleNext: false };
  });
  return finishTurn(game, tileId, teams);
}

export function resolvePowerUp(game: GameState, tileId: string, targetIndex?: number): GameState {
  const tile = game.tiles.find((t) => t.id === tileId);
  if (!tile || tile.kind !== "powerup") return game;
  const me = game.currentTeam;
  const teams = game.teams.map((t) => ({ ...t }));
  const n = tile.amount;
  const target = targetIndex !== undefined ? teams[targetIndex] : undefined;

  switch (tile.powerUp) {
    case "bonus":
      teams[me].score += n;
      break;
    case "lose":
      teams[me].score -= n;
      break;
    case "double":
      teams[me].doubleNext = true;
      break;
    case "steal":
      if (target) {
        target.score -= n;
        teams[me].score += n;
      }
      break;
    case "swap":
      if (target) {
        [teams[me].score, target.score] = [target.score, teams[me].score];
      }
      break;
    case "give":
      if (target) {
        teams[me].score -= n;
        target.score += n;
      }
      break;
  }
  return finishTurn(game, tileId, teams);
}

export function isFinished(game: GameState): boolean {
  return game.tiles.length > 0 && game.tiles.every((t) => t.used);
}
