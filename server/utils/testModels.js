import "dotenv/config";

const res = await fetch(
  "https://generativelanguage.googleapis.com/v1beta/models?pageSize=100",
  { headers: { "x-goog-api-key": process.env.GEMINI_API_KEY } }
);
const json = await res.json();

if (!res.ok) {
  console.log("Error:", res.status, json.error?.message);
  process.exit(1);
}

json.models
  .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
  .forEach((m) => console.log(m.name));

console.log("Current GEMINI_MODEL:", process.env.GEMINI_MODEL);