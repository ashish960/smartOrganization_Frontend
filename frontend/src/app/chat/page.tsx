"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useSelector } from "react-redux";
import { AppRootState } from "@/store";

// ── Types ──────────────────────────────────────────────────────────────────
interface Message {
  _id?: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  createdAt?: string;
  isLoading?: boolean;
}

interface Source {
  document_id: string;
  page: number;
  relevance: number;
}

interface Session {
  _id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  department?: { name: string; icon: string } | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const formatTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now  = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)  return `${days} days ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const SUGGESTIONS = [
  "Summarize the documents in my department",
  "What are the key policies in my organization?",
  "Find information about leave policy",
  "What documents were uploaded recently?",
];

// ── Component ──────────────────────────────────────────────────────────────
export default function ChatPage() {
  const { token } = useSelector((state: AppRootState) => state.auth);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);

  const [sessions, setSessions]             = useState<Session[]>([]);
  const [activeSession, setActiveSession]   = useState<Session | null>(null);
  const [messages, setMessages]             = useState<Message[]>([]);
  const [input, setInput]                   = useState("");
  const [isLoading, setIsLoading]           = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [editingTitle, setEditingTitle]     = useState<string | null>(null);
  const [newTitle, setNewTitle]             = useState("");

  // ── Auto scroll ───────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Load sessions ─────────────────────────────────────────────────────
  const loadSessions = useCallback(async () => {
    try {
      setSessionsLoading(true);
      const res  = await fetch(`${API_BASE}/chat/sessions`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setSessions(data.data);
    } catch { /* silent */ }
    finally { setSessionsLoading(false); }
  }, [token]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // ── Select session ────────────────────────────────────────────────────
  const selectSession = async (sessionId: string) => {
    try {
      const res  = await fetch(`${API_BASE}/chat/sessions/${sessionId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setActiveSession(data.data);
        setMessages(data.data.messages);
        setError(null);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "auto" }), 100);
      }
    } catch { setError("Failed to load session"); }
  };

  // ── New session ───────────────────────────────────────────────────────
  const createNewSession = async () => {
    try {
      const res  = await fetch(`${API_BASE}/chat/sessions`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setActiveSession(data.data);
        setMessages([]);
        setSessions(prev => [data.data, ...prev]);
        setError(null);
        inputRef.current?.focus();
      }
    } catch { setError("Failed to create session"); }
  };

  // ── Send message ──────────────────────────────────────────────────────
  const handleSend = async (question?: string) => {
    const q = question || input.trim();
    if (!q || isLoading) return;

    // Create session if none active
    let sessionId = activeSession?._id;
    if (!sessionId) {
      const res  = await fetch(`${API_BASE}/chat/sessions`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setActiveSession(data.data);
        setSessions(prev => [data.data, ...prev]);
        sessionId = data.data._id;
      } else return;
    }

    setInput("");
    setError(null);

    const userMsg: Message    = { role: "user",      content: q,  createdAt: new Date().toISOString() };
    const loadingMsg: Message = { role: "assistant", content: "", createdAt: new Date().toISOString(), isLoading: true };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setIsLoading(true);

    try {
      const res  = await fetch(`${API_BASE}/chat/sessions/${sessionId}/message`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();

      if (data.success) {
        const aiMsg: Message = {
          role:      "assistant",
          content:   data.data.answer,
          sources:   data.data.sources,
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev.slice(0, -1), aiMsg]);

        // Update session title in sidebar
        setSessions(prev => prev.map(s =>
          s._id === sessionId ? { ...s, title: data.data.title, updatedAt: new Date().toISOString() } : s
        ));
        setActiveSession(prev => prev ? { ...prev, title: data.data.title } : null);
      } else {
        throw new Error(data.message || "Failed to get response");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // ── Delete session ────────────────────────────────────────────────────
  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this conversation?")) return;
    try {
      await fetch(`${API_BASE}/chat/sessions/${sessionId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setSessions(prev => prev.filter(s => s._id !== sessionId));
      if (activeSession?._id === sessionId) { setActiveSession(null); setMessages([]); }
    } catch { /* silent */ }
  };

  // ── Rename session ────────────────────────────────────────────────────
  const handleRename = async (sessionId: string) => {
    if (!newTitle.trim()) return setEditingTitle(null);
    try {
      const res  = await fetch(`${API_BASE}/chat/sessions/${sessionId}/rename`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      const data = await res.json();
      if (data.success) {
        setSessions(prev => prev.map(s => s._id === sessionId ? { ...s, title: newTitle } : s));
        if (activeSession?._id === sessionId) setActiveSession(prev => prev ? { ...prev, title: newTitle } : null);
      }
    } catch { /* silent */ }
    finally { setEditingTitle(null); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <DashboardLayout title="AI Chat" subtitle="Ask questions about your organization's documents">
      <div style={{ display: "flex", height: "calc(100vh - 140px)", borderRadius: "16px", border: "1px solid var(--color-border)", overflow: "hidden", background: "rgba(255,255,255,0.01)" }}>

        {/* ── Sessions sidebar ── */}
        <div style={{ width: "260px", flexShrink: 0, borderRight: "1px solid var(--color-border)", display: "flex", flexDirection: "column", background: "rgba(255,255,255,0.01)" }}>

          {/* New chat button */}
          <div style={{ padding: "14px" }}>
            <button onClick={createNewSession} className="gradient-button" style={{ width: "100%", padding: "10px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              ✏️ New Chat
            </button>
          </div>

          {/* Sessions list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 8px" }}>
            {sessionsLoading ? (
              <div style={{ padding: "20px", textAlign: "center", opacity: 0.5 }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)", borderTop: "2px solid #3b82f6", animation: "spin 0.8s linear infinite", margin: "0 auto" }}/>
              </div>
            ) : sessions.length === 0 ? (
              <p style={{ fontSize: "12px", color: "var(--color-text-muted)", textAlign: "center", padding: "20px", opacity: 0.5 }}>No conversations yet</p>
            ) : (
              sessions.map(session => (
                <div
                  key={session._id}
                  onClick={() => selectSession(session._id)}
                  style={{
                    padding: "10px 12px", borderRadius: "8px", cursor: "pointer", marginBottom: "2px",
                    background: activeSession?._id === session._id ? "rgba(59,130,246,0.12)" : "transparent",
                    border: activeSession?._id === session._id ? "1px solid rgba(59,130,246,0.2)" : "1px solid transparent",
                    transition: "all 0.15s ease",
                  }}
                >
                  {editingTitle === session._id ? (
                    <input
                      value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                      onBlur={() => handleRename(session._id)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleRename(session._id); if (e.key === "Escape") setEditingTitle(null); }}
                      onClick={(e) => e.stopPropagation()} autoFocus
                      style={{ width: "100%", background: "none", border: "none", outline: "none", color: "var(--color-text)", fontSize: "13px" }}
                    />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <p style={{ fontSize: "13px", fontWeight: "500", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {session.title}
                      </p>
                      <div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
                        <button onClick={(e) => { e.stopPropagation(); setEditingTitle(session._id); setNewTitle(session.title); }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: "2px", fontSize: "11px", opacity: 0.6 }}>✏️</button>
                        <button onClick={(e) => deleteSession(session._id, e)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: "2px", fontSize: "11px", opacity: 0.6 }}>🗑️</button>
                      </div>
                    </div>
                  )}
                  <p style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>{formatDate(session.updatedAt)}</p>
                  {session.messages.length > 0 && (
                    <p style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{session.messages.length} messages</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Main chat area ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          {/* Chat header */}
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.02)" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #3b82f6, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🤖</div>
            <div>
              <p style={{ fontSize: "14px", fontWeight: "700" }}>{activeSession ? activeSession.title : "SmartOrg AI"}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981" }}/>
                <p style={{ fontSize: "11px", color: "#10b981" }}>Online</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>

            {messages.length === 0 && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "24px", padding: "40px 20px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "48px", marginBottom: "12px" }}>🧠</div>
                  <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px" }}>Ask anything about your documents</h2>
                  <p style={{ fontSize: "14px", color: "var(--color-text-muted)" }}>I can search through all documents you have access to</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", width: "100%", maxWidth: "560px" }}>
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => handleSend(s)} style={{ padding: "12px 16px", borderRadius: "10px", textAlign: "left", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)", color: "var(--color-text)", fontSize: "13px", cursor: "pointer", lineHeight: 1.4 }}>
                      💬 {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", flexDirection: msg.role === "user" ? "row-reverse" : "row", alignItems: "flex-start", gap: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0, background: msg.role === "user" ? "linear-gradient(135deg, #3b82f6, #a855f7)" : "linear-gradient(135deg, #10b981, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>
                  {msg.role === "user" ? "👤" : "🤖"}
                </div>
                <div style={{ maxWidth: "70%", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{
                    padding: "12px 16px",
                    borderRadius: msg.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                    background: msg.role === "user" ? "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(168,85,247,0.2))" : "rgba(255,255,255,0.04)",
                    border: "1px solid", borderColor: msg.role === "user" ? "rgba(59,130,246,0.3)" : "var(--color-border)",
                    fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap",
                  }}>
                    {msg.isLoading ? (
                      <div style={{ display: "flex", gap: "4px", alignItems: "center", padding: "4px 0" }}>
                        {[0,1,2].map(i => <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#3b82f6", animation: `bounce 1s ease infinite ${i * 0.15}s` }}/>)}
                      </div>
                    ) : msg.content}
                  </div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {msg.sources.map((src, i) => (
                        <span key={i} style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "6px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981", fontWeight: "600" }}>
                          📄 Source {i+1} · Page {src.page + 1} · {Math.round(src.relevance * 100)}% match
                        </span>
                      ))}
                    </div>
                  )}
                  {msg.createdAt && !msg.isLoading && (
                    <p style={{ fontSize: "10px", color: "var(--color-text-muted)", textAlign: msg.role === "user" ? "right" : "left" }}>
                      {formatTime(msg.createdAt)}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {error && (
              <div style={{ padding: "12px 16px", borderRadius: "10px", fontSize: "13px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", display: "flex", alignItems: "center", gap: "8px" }}>
                ❌ {error}
                <button onClick={() => setError(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}>✕</button>
              </div>
            )}

            <div ref={messagesEndRef}/>
          </div>

          {/* Input */}
          <div style={{ padding: "16px 20px", borderTop: "1px solid var(--color-border)", background: "rgba(255,255,255,0.02)" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", padding: "10px 14px", borderRadius: "12px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--color-border)" }}>
              <textarea
                ref={inputRef} value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about your documents... (Enter to send)"
                disabled={isLoading} rows={1}
                style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--color-text)", fontSize: "14px", resize: "none", lineHeight: "1.5", maxHeight: "120px", overflowY: "auto", fontFamily: "inherit" }}
                onInput={(e) => { const el = e.target as HTMLTextAreaElement; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 120) + "px"; }}
              />
              <button onClick={() => handleSend()} disabled={isLoading || !input.trim()} style={{
                width: "36px", height: "36px", borderRadius: "8px", flexShrink: 0,
                background: input.trim() && !isLoading ? "linear-gradient(135deg, #3b82f6, #a855f7)" : "rgba(255,255,255,0.08)",
                border: "none", cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", transition: "all 0.2s ease",
              }}>
                {isLoading ? <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", animation: "spin 0.8s linear infinite" }}/> : "➤"}
              </button>
            </div>
            <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "8px", textAlign: "center" }}>
              AI answers are based on your organization&apos;s documents only · Sources shown with each answer
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
      `}</style>
    </DashboardLayout>
  );
}