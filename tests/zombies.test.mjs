import assert from "node:assert/strict";
import { test } from "node:test";
import { prepareZombieQuestions, startZombieGame, zombieReducer } from "../src/lib/zombies.ts";

const question = (id, answer, extra = {}) => ({ id, prompt: `Câu ${id}`, answer, points: 10, ...extra });

test("prepare questions preserves authored options and creates distinct alternatives from the same set", () => {
  const source = [
    question("a", "Hà Nội", { image: "/example.png" }),
    question("b", "Huế"),
    question("c", " huế "),
    question("d", "Đà Nẵng", { options: ["Đà Nẵng", "Cần Thơ"], correctIndex: 0 }),
  ];
  const result = prepareZombieQuestions(source);
  assert.equal(result.length, 4);
  assert.equal(result[0].image, "/example.png");
  assert.deepEqual(result[0].options, ["Hà Nội", "Huế", "Đà Nẵng"]);
  assert.equal(result[1].options[result[1].correctIndex], "Huế");
  assert.deepEqual(result[3].options, ["Đà Nẵng", "Cần Thơ"]);
  assert.equal(result[3].generated, false);
  assert.deepEqual(prepareZombieQuestions([question("only", "Một")]), []);
  assert.deepEqual(prepareZombieQuestions([question("bad", "A", { options: ["A", "B"], correctIndex: 5 }), question("other", "B")]).map((q) => q.id), ["other"]);
});

test("wrong answers accelerate, can retry, and correct answers advance", () => {
  const questions = prepareZombieQuestions([question("a", "A"), question("b", "B")]);
  let game = startZombieGame(questions, 0);
  game = zombieReducer(game, { type: "answer", index: 1, now: 3000 });
  assert.equal(game.distance, 0.1);
  assert.equal(game.mistakes, 1);
  game = zombieReducer(game, { type: "tick", now: 9000 });
  assert.equal(game.distance, 0.4);
  game = zombieReducer(game, { type: "answer", index: 1, now: 9000 });
  assert.equal(game.mistakes, 1);
  game = zombieReducer(game, { type: "answer", index: 0, now: 9000 });
  assert.equal(game.index, 1);
  assert.equal(game.distance, 0);
  assert.deepEqual(game.wrong, []);
  game = zombieReducer(game, { type: "answer", index: questions[1].correctIndex, now: 10_000 });
  assert.equal(game.status, "won");
});

test("pause freezes time and late answers cannot prevent reaching the fence", () => {
  const questions = prepareZombieQuestions([question("a", "A"), question("b", "B")]);
  let game = startZombieGame(questions, 1000);
  game = zombieReducer(game, { type: "pause", now: 4000 });
  game = zombieReducer(game, { type: "tick", now: 100_000 });
  assert.equal(game.distance, 0.1);
  game = zombieReducer(game, { type: "resume", now: 100_000 });
  game = zombieReducer(game, { type: "answer", index: 0, now: 127_000 });
  assert.equal(game.status, "lost");
  assert.equal(game.distance, 1);
  assert.throws(() => startZombieGame([], 0));
});
