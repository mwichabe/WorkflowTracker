import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User, Loader } from "lucide-react";

const API_KEY = "AIzaSyDPxdB68UMx1YP-rN9_MBkkzwu5IvYsXC8";
const API_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${API_KEY}`;

const SYSTEM_PROMPT = `You are a helpful assistant for WorkflowTracker, a job application management app.
You help users track their job applications through various stages.

Key facts about WorkflowTracker:
- Users can add job applications with company name, role, status, notes, salary, and location
- Application statuses: Saved (bookmarked, not yet applied), Applied (submitted application), Interviewing (in interview process), Offer (received offer), Rejected (application declined), Withdrawn (user withdrew)
- Each application has a workflow/timeline showing status history
- Users can edit, delete, and view detailed info for each application
- The sidebar shows total application count and a status breakdown
- Auth options: sign in with username/password, create a new account, or continue as Guest (read-only)
- Guest mode: can view applications but cannot create or edit them
- The dashboard/home page lists all applications with filters and sorting

Be concise, friendly, and helpful. If asked something unrelated to the app, politely redirect to WorkflowTracker topics.`;

const SUGGESTIONS = [
  "How do I add a new application?",
  "What statuses are available?",
  "Can I use the app without an account?",
];

function TypingDots() {
  return (
    <div className="cb-typing">
      <span /><span /><span />
    </div>
  );
}

function Message({ msg }) {
  const isBot = msg.role === "bot";
  return (
    <div className={`cb-msg ${isBot ? "cb-msg-bot" : "cb-msg-user"}`}>
      {isBot && (
        <div className="cb-avatar">
          <Bot size={13} strokeWidth={2} />
        </div>
      )}
      <div className="cb-bubble">
        {msg.text}
        {msg.error && <div className="cb-err-note">Tap to retry</div>}
      </div>
      {!isBot && (
        <div className="cb-avatar cb-avatar-user">
          <User size={13} strokeWidth={2} />
        </div>
      )}
    </div>
  );
}

export default function ChatBot() {
  const [open, setOpen]           = useState(false);
  const [input, setInput]         = useState("");
  const [typing, setTyping]       = useState(false);
  const [messages, setMessages]   = useState([
    { role: "bot", text: "Hi! I'm your WorkflowTracker assistant. Ask me anything about managing your job applications." },
  ]);
  const [conversation, setConversation] = useState([]);
  const bottomRef  = useRef(null);
  const textareaRef = useRef(null);
  const inputRef   = useRef(input);
  inputRef.current = input;

  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 120);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 100) + "px";
  }, []);

  async function sendMessage(text) {
    const trimmed = (text || inputRef.current).trim();
    if (!trimmed || typing) return;
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const userMsg = { role: "user", text: trimmed };
    setMessages(prev => [...prev, userMsg]);

    const newConversation = [
      ...conversation,
      { role: "user", parts: [{ text: trimmed }] },
    ];
    setConversation(newConversation);
    setTyping(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: newConversation,
          generationConfig: { maxOutputTokens: 400, temperature: 0.7 },
        }),
      });

      if (!res.ok) {
        throw new Error(`API error ${res.status}`);
      }

      const data = await res.json();
      const reply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I couldn't generate a response. Please try again.";

      setConversation(prev => [
        ...prev,
        { role: "model", parts: [{ text: reply }] },
      ]);
      setMessages(prev => [...prev, { role: "bot", text: reply }]);
    } catch {
      setConversation(prev => prev.slice(0, -1));
      setMessages(prev => [
        ...prev,
        { role: "bot", text: "Sorry, something went wrong. Please check your connection and try again.", error: true },
      ]);
    } finally {
      setTyping(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const showSuggestions = messages.length === 1;

  return (
    <>
      {/* toggle button */}
      <button
        className={`cb-toggle${open ? " cb-toggle-open" : ""}`}
        onClick={() => setOpen(v => !v)}
        aria-label="Toggle chat assistant"
      >
        {open ? <X size={20} strokeWidth={2.5} /> : <MessageCircle size={20} strokeWidth={2.5} />}
      </button>

      {/* panel */}
      {open && (
        <div className="cb-panel">
          {/* header */}
          <div className="cb-header">
            <div className="cb-header-icon">
              <Bot size={15} strokeWidth={2} color="#fff" />
            </div>
            <div>
              <div className="cb-header-title">AI Assistant</div>
              <div className="cb-header-sub">WorkflowTracker Help</div>
            </div>
            <button className="cb-close" onClick={() => setOpen(false)}>
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>

          {/* messages */}
          <div className="cb-body">
            {messages.map((msg, i) => (
              <Message key={i} msg={msg} />
            ))}
            {typing && (
              <div className="cb-msg cb-msg-bot">
                <div className="cb-avatar"><Bot size={13} strokeWidth={2} /></div>
                <div className="cb-bubble"><TypingDots /></div>
              </div>
            )}

            {/* suggestion chips */}
            {showSuggestions && !typing && (
              <div className="cb-suggestions">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} className="cb-chip" onClick={() => sendMessage(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* input */}
          <div className="cb-footer">
            <textarea
              ref={textareaRef}
              className="cb-input"
              placeholder="Ask about WorkflowTracker…"
              value={input}
              rows={1}
              onChange={e => { setInput(e.target.value); resizeTextarea(); }}
              onKeyDown={handleKeyDown}
              disabled={typing}
            />
            <button
              className="cb-send"
              onClick={() => sendMessage()}
              disabled={!input.trim() || typing}
              aria-label="Send"
            >
              {typing ? <Loader size={15} strokeWidth={2.5} className="cb-spin" /> : <Send size={15} strokeWidth={2.5} />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
