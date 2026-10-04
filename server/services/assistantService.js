const FALLBACK_MODELS = ["gemini-flash-latest", "gemini-3.5-flash"];

export async function askAssistant({ message, history = [], complaints }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const models = [
    ...new Set([process.env.GEMINI_MODEL || "gemini-3.8-flash", ...FALLBACK_MODELS]),
  ];

  const systemText = `You are the CivicLens AI helper for citizens in India.
Reply in the same language and script the user writes in (Hindi, Hinglish, Punjabi or English). Keep answers short and friendly.
You can only talk about the user's own complaints listed below. Use only this data.
If something is not in the data, say you do not know, and suggest the department helpline if one is listed.
Never invent officer names, phone numbers, emails or dates. Never reveal anything about other users.
If the user asks about anything unrelated to their complaints or civic issues, politely say you can only help with complaints.

USER'S COMPLAINTS (JSON):
${JSON.stringify(complaints)}`;

  const past = history
    .filter((h) => h && typeof h.text === "string" && h.text.trim())
    .slice(-8)
    .map((h) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.text.slice(0, 1000) }],
    }));

  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: systemText }] },
    contents: [...past, { role: "user", parts: [{ text: message }] }],
    generationConfig: { temperature: 0.3 },
  });

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": key,
          },
          body,
        }
      );
      if (!res.ok) {
        console.error("Assistant attempt failed:", model, res.status);
        continue;
      }
      const json = await res.json();
      const text = json.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || "")
        .join("")
        .trim();
      if (text) return text;
    } catch (err) {
      console.error("Assistant error:", err.message);
    }
  }
  return null;
}