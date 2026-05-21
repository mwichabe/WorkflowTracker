import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User, Loader } from "lucide-react";

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || "";
const API_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

const SYSTEM_PROMPT = `You are a helpful assistant for WorkflowTracker, an application workflow management platform.

Key facts about WorkflowTracker:
- Users submit formal applications that go through an admin-gated review process
- Application lifecycle: Draft → Submitted → Under Review → Approved / Rejected / Need More Information
- Need More Information sends the application back to the owner to edit and resubmit
- Application types: Recordation, Renewal, Change of Ownership, Change of Name, Discontinuation
- Roles: Guest (read-only), User (create & submit own applications), Admin (review & decide), Super Admin (manage admin roles)
- Users can apply to become an Admin; Super Admins approve or reject those requests
- In-app notifications alert users when their application status changes, and alert admins when new applications are submitted
- Auth: register with username/password, sign in, or continue as Guest
- Guest mode: can view applications but cannot create or submit them
- Admin Dashboard: shows stats, all applications with review actions, and admin role requests (Super Admin only)
- Each application has a tracking number (e.g. APP-1A2B3C4D), applicant details, description, and full audit trail

Be concise, friendly, and helpful. If asked something unrelated to the app, politely redirect to WorkflowTracker topics.`;

const SUGGESTIONS = [
  "How do I submit an application?",
  "What happens after I submit?",
  "How do I become an admin?",
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

    if (!API_KEY) {
      setConversation(prev => prev.slice(0, -1));
      setMessages(prev => [...prev, { role: "bot", text: "AI assistant is not configured. Please set the REACT_APP_GEMINI_API_KEY environment variable.", error: true }]);
      setTyping(false);
      return;
    }

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

      const data = await res.json();

      if (!res.ok) {
        const apiMsg = data?.error?.message || `HTTP ${res.status}`;
        console.error("Gemini API error:", data);
        throw new Error(apiMsg);
      }

      const reply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I couldn't generate a response. Please try again.";

      setConversation(prev => [
        ...prev,
        { role: "model", parts: [{ text: reply }] },
      ]);
      setMessages(prev => [...prev, { role: "bot", text: reply }]);
    } catch (err) {
      console.error("ChatBot error:", err);
      setConversation(prev => prev.slice(0, -1));
      const errorText = err.message?.includes("API_KEY")
        ? "Invalid API key. Please check your Gemini API key configuration."
        : err.message?.includes("quota") || err.message?.includes("429")
        ? "Rate limit reached. Please wait a moment and try again."
        : err.message?.includes("not found") || err.message?.includes("404")
        ? "AI model unavailable. Please try again later."
        : "Sorry, something went wrong. Please check your connection and try again.";
      setMessages(prev => [
        ...prev,
        { role: "bot", text: errorText, error: true },
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
