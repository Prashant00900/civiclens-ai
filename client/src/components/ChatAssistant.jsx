import { useEffect, useRef, useState } from "react";
import api from "../services/api";

const SpeechRecognition =
  typeof window !== "undefined" &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

const SUGGESTIONS = [
  "Meri complaint ka kya hua?",
  "Which department has my complaint?",
  "Helpline number kya hai?",
];

export default function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Namaste! Ask me about your complaints in Hindi, Hinglish, Punjabi or English.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async (text) => {
    const message = (text ?? input).trim();
    if (!message || sending) return;

    // pehla greeting message history me nahi bhejte
    const history = messages.slice(1);
    setMessages((m) => [...m, { role: "user", text: message }]);
    setInput("");
    setSending(true);

    try {
      const { data } = await api.post("/assistant/chat", { message, history });
      setMessages((m) => [...m, { role: "assistant", text: data.reply }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text:
            err.response?.data?.message ||
            "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const listen = () => {
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.lang = "hi-IN";
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e) => setInput(e.results[0][0].transcript);
    rec.start();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 bg-ink text-white font-medium px-5 py-3 rounded-full border-2 border-signal shadow-lg hover:bg-black"
      >
        Ask AI
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 w-[calc(100vw-2.5rem)] sm:w-96 h-[30rem] max-h-[80vh] bg-white border-2 border-ink rounded-md shadow-2xl flex flex-col">
      <div className="flex items-center justify-between bg-ink text-white px-4 py-3">
        <span className="font-display font-bold">CivicLens assistant</span>
        <button
          onClick={() => setOpen(false)}
          className="text-sm text-white/80 hover:text-white"
        >
          Close
        </button>
      </div>
      <div className="centerline" />

      <div className="flex-1 overflow-y-auto p-3 space-y-2" aria-live="polite">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] px-3 py-2 rounded text-sm whitespace-pre-wrap ${
              m.role === "user"
                ? "bg-teal text-white ml-auto"
                : "bg-paper text-ink"
            }`}
          >
            {m.text}
          </div>
        ))}
        {sending && (
          <div className="bg-paper text-ink-soft px-3 py-2 rounded text-sm w-fit">
            Typing...
          </div>
        )}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-xs border border-ink rounded-full px-3 py-1 hover:bg-paper"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 p-2 border-t border-line">
        {SpeechRecognition && (
          <button
            onClick={listen}
            title="Speak in Hindi"
            className={`px-3 py-2 rounded text-sm border ${
              listening
                ? "bg-signal border-ink"
                : "border-line hover:bg-paper"
            }`}
          >
            {listening ? "Listening" : "Speak"}
          </button>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type your question"
          aria-label="Your question"
          maxLength={500}
          className="flex-1 min-w-0 border border-line rounded px-3 py-2 text-sm focus:border-teal"
        />
        <button
          onClick={() => send()}
          disabled={sending}
          className="bg-teal text-white px-4 py-2 rounded text-sm font-medium hover:bg-teal-dark disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}