import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidImage, MAX_IMAGE_LENGTH, parseSet } from "../src/lib/validate.ts";
import { grade, isAssignmentCode, studentAssignment } from "../src/lib/assignments.ts";

const question = { id: "q1", prompt: "Đây là gì?", answer: "Táo", points: 10 };
const makeSet = (item) => ({ id: "set1", title: "Bé vui", questions: [item] });

test("keeps image data when parsing a set and accepts older questions", () => {
  for (const image of ["/images/apple.svg", "https://example.com/apple.png", "data:image/png;base64,YQ=="]) {
    const result = parseSet(makeSet({ ...question, image }));
    assert.equal(typeof result, "object");
    assert.equal(result.questions[0].image, image);
  }
  const old = parseSet(makeSet(question));
  assert.equal(typeof old, "object");
  assert.equal(old.questions[0].image, undefined);
});

test("validates and preserves multiple choice options", () => {
  const choice = { ...question, options: ["Táo", "Cam"], correctIndex: 0 };
  assert.deepEqual(parseSet(makeSet(choice)).questions[0].options, choice.options);
  for (const invalid of [
    { ...choice, options: ["Táo", " táo "] },
    { ...choice, options: ["Táo", ""] },
    { ...choice, correctIndex: 2 },
    { ...choice, answer: "Cam" },
    { ...choice, options: ["Táo"] },
  ]) assert.equal(typeof parseSet(makeSet(invalid)), "string");
});

test("hides answers and grades weighted choices with expiry and input checks", () => {
  const assignment = { code: "ABCDEF012345", title: "Lớp học", createdAt: 0, expiresAt: 100,
    questions: [
      { ...question, image: "/images/apple.svg", options: ["Táo", "Cam"], correctIndex: 0 },
      { ...question, id: "q2", points: 20, options: ["Một", "Hai"], correctIndex: 1 },
    ] };
  const safe = studentAssignment(assignment);
  assert.equal(safe.questions[0].image, "/images/apple.svg");
  assert.equal("answer" in safe.questions[0], false);
  assert.equal("correctIndex" in safe.questions[0], false);
  assert.equal(isAssignmentCode(assignment.code), true);
  assert.equal(isAssignmentCode("abc"), false);
  const result = grade(assignment, " Bé ", [0, 0], "submission", 99);
  assert.equal(result.name, "Bé");
  assert.equal(result.score, 10);
  assert.equal(result.total, 30);
  for (const [name, answers, now] of [["", [0, 0], 99], ["Bé", [0], 99], ["Bé", [0, 2], 99], ["Bé", [0, 1], 100]]) {
    assert.equal(typeof grade(assignment, name, answers, "id", now), "string");
  }
});

test("rejects invalid and oversized image references", () => {
  for (const image of ["javascript:alert(1)", "//example.com/a.png", "data:image/svg+xml;base64,YQ==", "https://example.com/" + "a".repeat(MAX_IMAGE_LENGTH), 12]) {
    assert.equal(typeof parseSet(makeSet({ ...question, image })), "string");
  }
  assert.equal(isValidImage("/images/my image.svg"), false);
});
