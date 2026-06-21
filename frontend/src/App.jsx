import { useEffect, useState } from "react";
import "./App.css";

export default function App() {
  const [topic, setTopic] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [notes, setNotes] = useState(null);

  const [history, setHistory] = useState([]);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);

  const [isFull, setIsFull] = useState(false);

  const level = Math.floor(xp / 50) + 1;

  // 🌿 LOAD EVERYTHING ON START
  useEffect(() => {
    setXp(Number(localStorage.getItem("xp") || 0));
    setStreak(Number(localStorage.getItem("streak") || 0));

    try {
      const saved = JSON.parse(localStorage.getItem("history"));
      if (Array.isArray(saved)) setHistory(saved);
    } catch {
      setHistory([]);
    }
  }, []);

  // 🌿 suggestions (Wikipedia search)
  async function fetchSuggestions(value) {
    if (!value) return setSuggestions([]);

    try {
      const res = await fetch(
        `https://en.wikipedia.org/w/api.php?action=opensearch&search=${value}&limit=5&namespace=0&format=json&origin=*`
      );

      const data = await res.json();
      setSuggestions(data?.[1] || []);
    } catch {
      setSuggestions([]);
    }
  }

  function handleInput(e) {
    const v = e.target.value;
    setTopic(v);
    fetchSuggestions(v);
  }

  function selectSuggestion(s) {
    setTopic(s);
    setSuggestions([]);
  }

  // 🌿 clean text engine
  function cleanSentence(s) {
    return s
      .replace(/\([^)]*\)/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isValid(s) {
    return s && s.length > 35 && !s.toLowerCase().includes("may refer to");
  }

  function buildBullets(raw) {
    const sentences = raw
      .split(".")
      .map(cleanSentence)
      .filter(isValid);

    const unique = [...new Set(sentences)];

    return unique.slice(0, 8).map((s) => `• ${s}`);
  }

  // 🧠 GENERATE NOTES (FIXED + SAFE MEMORY)
  async function generateNotes(customTopic) {
    const finalTopic = customTopic || topic;
    if (!finalTopic.trim()) return;

    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(finalTopic)}`
      );

      if (!res.ok) throw new Error();

      const data = await res.json();
      const raw = data.extract || "";

      const bullets = buildBullets(raw);

      const newNote = {
        title: data.title,
        bullets,
      };

      setNotes(newNote);

      // 🌿 FORCE SAVE MEMORY (NO ASYNC ISSUES)
      const newHistory = [
        {
          title: data.title,
          time: new Date().toLocaleTimeString(),
        },
        ...history.filter((h) => h.title !== data.title),
      ].slice(0, 15);

      setHistory(newHistory);
      localStorage.setItem("history", JSON.stringify(newHistory));

      // 🌱 XP + streak (also immediate save)
      const newXp = xp + 15;
      const newStreak = streak + 1;

      setXp(newXp);
      setStreak(newStreak);

      localStorage.setItem("xp", newXp);
      localStorage.setItem("streak", newStreak);
    } catch {
      setNotes({ error: "No proper Wikipedia match found 😢" });
    }
  }

  function revisitTopic(title) {
    setTopic(title);
    generateNotes(title);
  }

  // 🖥 fullscreen
  function toggleFullScreen() {
    const el = document.documentElement;

    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
      setIsFull(true);
    } else {
      document.exitFullscreen?.();
      setIsFull(false);
    }
  }

  return (
    <div className="app">
      <h1>🌿 StudyGarden AI</h1>

      <p>
        Level {level} | XP {xp} | 🔥 {streak}
      </p>

      <div className="inputBox">
        <input
          value={topic}
          onChange={handleInput}
          placeholder="Enter topic..."
        />

        <button onClick={() => generateNotes()}>🧠 Generate</button>

        <button onClick={toggleFullScreen}>
          🖥 {isFull ? "Exit" : "Full Screen"}
        </button>
      </div>

      {/* 🌿 suggestions */}
      {suggestions.length > 0 && (
        <div className="suggestions">
          {suggestions.map((s, i) => (
            <div key={i} onClick={() => selectSuggestion(s)}>
              {s}
            </div>
          ))}
        </div>
      )}

      {/* 🌱 history */}
      <div className="history">
        <h3>🌿 Study Memory</h3>

        {history.length === 0 && <p>No topics yet 🌱</p>}

        {history.map((h, i) => (
          <div
            key={i}
            className="historyCard"
            onClick={() => revisitTopic(h.title)}
          >
            <p>{h.title}</p>
            <span style={{ fontSize: "12px", opacity: 0.7 }}>
              {h.time}
            </span>
          </div>
        ))}
      </div>

      {/* 📘 notes */}
      {notes?.error && <p style={{ color: "red" }}>{notes.error}</p>}

      {notes && !notes.error && (
        <div className="notes">
          <h2>{notes.title}</h2>

          <div className="bulletBox">
            {notes.bullets.map((b, i) => (
              <p key={i}>{b}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}