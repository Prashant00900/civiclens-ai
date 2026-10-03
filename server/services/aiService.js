const CATEGORIES = [
  "pothole",
  "garbage",
  "streetlight",
  "water_leakage",
  "drainage",
  "other",
];

async function callGemini(model, key, body) {
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
    const err = new Error(`${model} returned ${res.status}`);
    err.detail = await res.text();
    throw err;
  }
  return res.json();
}

export async function analyzeComplaint({ title, description, imageBuffer, mimeType }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  // pehla model busy ho to agla try hoga
  const models = [
    ...new Set([
      process.env.GEMINI_MODEL || "gemini-3.8-flash",
      "gemini-flash-latest",
      "gemini-3.5-flash",
    ]),
  ];

  const prompt = `You review civic complaints from citizens in India.
Look at the photo and the text, then reply with JSON only, in this exact shape:
{"category": "...", "severity": 1, "summary": "..."}

Rules:
- category must be one of: ${CATEGORIES.join(", ")}
- severity is an integer from 1 (minor) to 5 (dangerous or urgent)
- summary is one short English sentence

Title: ${title}
Description: ${description}`;

  const body = JSON.stringify({
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: imageBuffer.toString("base64"),
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  for (const model of models) {
    try {
      const json = await callGemini(model, key, body);
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = JSON.parse(text);

      const severity = Math.min(
        5,
        Math.max(1, Math.round(Number(parsed.severity) || 1))
      );

      return {
        category: CATEGORIES.includes(parsed.category) ? parsed.category : "other",
        severity,
        summary: String(parsed.summary || "").slice(0, 200),
      };
    } catch (err) {
      console.error("AI attempt failed:", err.message);
    }
  }

  return null;
}