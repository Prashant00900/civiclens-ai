const CATEGORIES = [
  "pothole",
  "garbage",
  "streetlight",
  "water_leakage",
  "drainage",
  "other",
];

export async function analyzeComplaint({ title, description, imageBuffer, mimeType }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const prompt = `You review civic complaints from citizens in India.
Look at the photo and the text, then reply with JSON only, in this exact shape:
{"category": "...", "severity": 1, "summary": "..."}

Rules:
- category must be one of: ${CATEGORIES.join(", ")}
- severity is an integer from 1 (minor) to 5 (dangerous or urgent)
- summary is one short English sentence

Title: ${title}
Description: ${description}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key,
        },
        body: JSON.stringify({
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
        }),
      }
    );

    if (!res.ok) {
      console.error("Gemini error:", res.status, await res.text());
      return null;
    }

    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(text);

    const severity = Math.min(5, Math.max(1, Math.round(Number(parsed.severity) || 1)));

    return {
      category: CATEGORIES.includes(parsed.category) ? parsed.category : "other",
      severity,
      summary: String(parsed.summary || "").slice(0, 200),
    };
  } catch (err) {
    console.error("AI analysis failed:", err.message);
    return null;
  }
}