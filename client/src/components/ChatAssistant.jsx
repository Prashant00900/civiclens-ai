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
      text: "Namaste! Main aapki complaints ke baare me madad kar sakta hoon. Hindi, Hinglish, Punjabi ya English me poochiye.",
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
        className="fixed bottom-5 right-5 bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-blue-700"
      >
        Ask AI
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 w-80 h-[28rem] bg-white rounded-xl shadow-2xl flex flex-col border">
      <div className="flex items-center justify-between bg-blue-600 text-white px-4 py-3 rounded-t-xl">
        <span className="font-semibold">CivicLens Assistant</span>
        <button onClick={() => setOpen(false)} className="text-sm">
          Close
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
              m.role === "user"
                ? "bg-blue-600 text-white ml-auto"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {m.text}
          </div>
        ))}
        {sending && (
          <div className="bg-gray-100 text-gray-500 px-3 py-2 rounded-lg text-sm w-fit">
            Typing...
          </div>
        )}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-xs border border-blue-300 text-blue-700 rounded-full px-3 py-1 hover:bg-blue-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 p-2 border-t">
        {SpeechRecognition && (
          <button
            onClick={listen}
            title="Speak in Hindi"
            className={`px-2 py-2 rounded-lg text-sm ${
              listening ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
            }`}
          >
            {listening ? "Listening" : "Mic"}
          </button>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Apna sawal likhiye..."
          maxLength={500}
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
        />
        <button
          onClick={() => send()}
          disabled={sending}
          className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}