const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (url.startsWith("https://mock-redis.invalid")) {
    return Response.json(url.includes("/pipeline") ? [{ result: 1 }] : { result: 1 });
  }
  if (url.startsWith("https://generativelanguage.googleapis.com/")) {
    const body = JSON.parse(init.body);
    const inputText = body.contents[0].parts[0].text;
    if (inputText.includes("mock-quota")) return Response.json({}, { status: 429 });
    if (inputText.includes("mock-blocked")) return Response.json({ candidates: [{ finishReason: "SAFETY" }] });
    if (inputText.includes("mock-invalid")) return Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: "[]" }] } }] });
    const text = body.generationConfig.responseSchema?.items?.properties?.english
      ? JSON.stringify([
        { english: "cat", vietnamese: "con mèo", picture: "🐱" },
        { english: "dog", vietnamese: "con chó", picture: "🐶" },
      ])
      : body.generationConfig.responseMimeType
      ? JSON.stringify([
        { prompt: "1 + 1 bằng mấy?", options: ["2", "1", "3", "4"], correctIndex: 0 },
        { prompt: "2 + 1 bằng mấy?", options: ["1", "2", "3", "4"], correctIndex: 2 },
      ])
      : "Hãy thử đếm từng vật nhé!";
    return Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text }] } }] });
  }
  return originalFetch(input, init);
};
