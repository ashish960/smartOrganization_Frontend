"use client";

import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useSelector } from "react-redux";
import { AppRootState } from "@/store";

// ── Types ──────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  timestamp: Date;
  isLoading?: boolean;
}

interface Source {
  document_id: string;
  page: number;
  relevance: number;
}

interface ConversationItem {
  role: string;
  content: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// ── Helpers ────────────────────────────────────────────────────────────────
const formatTime = (date: Date) =>
  date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const generateId = () => Math.random().toString(36).substring(2, 9);

// ── Suggested questions ────────────────────────────────────────────────────
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

  const [messages, setMessages]               = useState<Message[]>([]);
  const [input, setInput]                     = useState("");
  const [isLoading, setIsLoading]             = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationItem[]>([]);
  const [error, setError]                     = useState<string | null>(null);

  // Auto scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ── Send message ───────────────────────────────────────────────────────
  const handleSend = async (question?: string) => {
    const q = question || input.trim();
    if (!q || isLoading) return;

    setInput("");
    setError(null);

    // Add user message
    const userMsg: Message = {
      id:        generateId(),
      role:      "user",
      content:   q,
      timestamp: new Date(),
    };

    // Add loading message
    const loadingMsg: Message = {
      id:        generateId(),
      role:      "assistant",
      content:   "",
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setIsLoading(true);

    try {
      const res  = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          question:            q,
          conversationHistory: conversationHistory,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const aiMsg: Message = {
          id:        generateId(),
          role:      "assistant",
          content:   data.data.answer,
          sources:   data.data.sources,
          timestamp: new Date(),
        };

        // Replace loading message with real answer
        setMessages(prev => [...prev.slice(0, -1), aiMsg]);

        // Update conversation history for context
        setConversationHistory(data.data.conversation_history);
      } else {
        throw new Error(data.message || "Failed to get response");
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Something went wrong";
      setError(errMsg);
      // Replace loading message with error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setConversationHistory([]);
    setError(null);
  };

  return (
    <DashboardLayout title="AI Chat" subtitle="Ask questions about your organization's documents">
      <div style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 140px)",
        borderRadius: "16px",
        border: "1px solid var(--color-border)",
        background: "rgba(255,255,255,0.01)",
        overflow: "hidden",
      }}>

        {/* ── Chat header ── */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(255,255,255,0.02)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "linear-gradient(135deg, #3b82f6, #a855f7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px",
            }}>🤖</div>
            <div>
              <p style={{ fontSize: "14px", fontWeight: "700" }}>SmartOrg AI</p>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981" }}/>
                <p style={{ fontSize: "11px", color: "#10b981" }}>Online</p>
              </div>
            </div>
          </div>

          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              style={{
                padding: "6px 14px", borderRadius: "8px", fontSize: "12px",
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                color: "#ef4444", cursor: "pointer", fontWeight: "600",
              }}
            >
              Clear Chat
            </button>
          )}
        </div>

        {/* ── Messages area ── */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}>

          {/* Empty state with suggestions */}
          {messages.length === 0 && (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: "24px",
              padding: "40px 20px",
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>🧠</div>
                <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px" }}>
                  Ask anything about your documents
                </h2>
                <p style={{ fontSize: "14px", color: "var(--color-text-muted)" }}>
                  I can search through all documents you have access to and answer your questions
                </p>
              </div>

              {/* Suggestion chips */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                width: "100%",
                maxWidth: "600px",
              }}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    style={{
                      padding: "12px 16px", borderRadius: "10px", textAlign: "left",
                      background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)",
                      color: "var(--color-text)", fontSize: "13px", cursor: "pointer",
                      transition: "all 0.15s ease", lineHeight: 1.4,
                    }}
                  >
                    💬 {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: "flex",
                flexDirection: msg.role === "user" ? "row-reverse" : "row",
                alignItems: "flex-start",
                gap: "10px",
              }}
            >
              {/* Avatar */}
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
                background: msg.role === "user"
                  ? "linear-gradient(135deg, #3b82f6, #a855f7)"
                  : "linear-gradient(135deg, #10b981, #3b82f6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "14px",
              }}>
                {msg.role === "user" ? "👤" : "🤖"}
              </div>

              {/* Bubble */}
              <div style={{ maxWidth: "70%", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{
                  padding: "12px 16px",
                  borderRadius: msg.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                  background: msg.role === "user"
                    ? "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(168,85,247,0.2))"
                    : "rgba(255,255,255,0.04)",
                  border: "1px solid",
                  borderColor: msg.role === "user"
                    ? "rgba(59,130,246,0.3)"
                    : "var(--color-border)",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap",
                }}>
                  {msg.isLoading ? (
                    <div style={{ display: "flex", gap: "4px", alignItems: "center", padding: "4px 0" }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: "6px", height: "6px", borderRadius: "50%",
                          background: "#3b82f6",
                          animation: `bounce 1s ease infinite ${i * 0.15}s`,
                        }}/>
                      ))}
                    </div>
                  ) : msg.content}
                </div>

                {/* Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {msg.sources.map((src, i) => (
                      <span key={i} style={{
                        fontSize: "10px", padding: "3px 8px", borderRadius: "6px",
                        background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
                        color: "#10b981", fontWeight: "600",
                      }}>
                        📄 Source {i + 1} · Page {src.page + 1} · {Math.round(src.relevance * 100)}% match
                      </span>
                    ))}
                  </div>
                )}

                {/* Timestamp */}
                <p style={{
                  fontSize: "10px", color: "var(--color-text-muted)",
                  textAlign: msg.role === "user" ? "right" : "left",
                }}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {/* Error message */}
          {error && (
            <div style={{
              padding: "12px 16px", borderRadius: "10px", fontSize: "13px",
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              color: "#ef4444", display: "flex", alignItems: "center", gap: "8px",
            }}>
              ❌ {error}
              <button onClick={() => setError(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}>✕</button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input area ── */}
        <div style={{
          padding: "16px 20px",
          borderTop: "1px solid var(--color-border)",
          background: "rgba(255,255,255,0.02)",
        }}>
          <div style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "10px",
            padding: "10px 14px",
            borderRadius: "12px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid var(--color-border)",
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your documents... (Enter to send, Shift+Enter for new line)"
              disabled={isLoading}
              rows={1}
              style={{
                flex: 1, background: "none", border: "none", outline: "none",
                color: "var(--color-text)", fontSize: "14px", resize: "none",
                lineHeight: "1.5", maxHeight: "120px", overflowY: "auto",
                fontFamily: "inherit",
              }}
              onInput={(e) => {
                const el = e.target as HTMLTextAreaElement;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 120) + "px";
              }}
            />

            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              style={{
                width: "36px", height: "36px", borderRadius: "8px", flexShrink: 0,
                background: input.trim() && !isLoading
                  ? "linear-gradient(135deg, #3b82f6, #a855f7)"
                  : "rgba(255,255,255,0.08)",
                border: "none", cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "16px", transition: "all 0.2s ease",
              }}
            >
              {isLoading ? (
                <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", animation: "spin 0.8s linear infinite" }}/>
              ) : "➤"}
            </button>
          </div>

          <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "8px", textAlign: "center" }}>
            AI answers are based on your organization's documents only · Sources shown with each answer
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
      `}</style>
    </DashboardLayout>
  );
}