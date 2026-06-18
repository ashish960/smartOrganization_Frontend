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

interface Department {
  _id: string;
  name: string;
  icon: string;
  code: string;
}

interface Document {
  _id: string;
  originalName: string;
  fileType: string;
  department?: { _id: string; name: string } | null;
}

interface Scope {
  type: "all" | "department" | "document";
  departmentId?: string;
  documentId?: string;
  label: string;
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
  if (days < 7)  return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const SUGGESTIONS = [
  "Summarize the documents in my department",
  "What are the key policies in my organization?",
  "Find information about leave policy",
  "What documents were uploaded recently?",
];

// ── SVG Icons ──────────────────────────────────────────────────────────────
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const BotIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/>
    <path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/>
  </svg>
);

const ChatIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const ScopeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const ChevronIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const FileIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

// ── Scope Selector Component ───────────────────────────────────────────────
function ScopeSelector({
  scope, departments, documents, onScopeChange,
}: {
  scope: Scope;
  departments: Department[];
  documents: Document[];
  onScopeChange: (scope: Scope) => void;
}) {
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [showDocDropdown, setShowDocDropdown]   = useState(false);
  const [docSearch, setDocSearch]               = useState("");

  const filteredDocs = documents.filter(d =>
    d.originalName.toLowerCase().includes(docSearch.toLowerCase())
  );

  // Count docs per department
  const docCountByDept = (deptId: string) =>
    documents.filter(d => d.department?._id === deptId).length;

  const pillStyle = (active: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: "6px",
    padding: "5px 10px", borderRadius: "20px", fontSize: "12px",
    cursor: "pointer", transition: "all 0.15s ease", userSelect: "none",
    background: active ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.05)",
    border: active ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.08)",
    color: active ? "rgba(147,197,253,1)" : "rgba(255,255,255,0.5)",
    fontWeight: active ? "500" : "400",
    position: "relative",
  });

  const countBadgeStyle: React.CSSProperties = {
    fontSize: "10px",
    opacity: 0.7,
    background: "rgba(255,255,255,0.1)",
    borderRadius: "10px",
    padding: "1px 6px",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "rgba(255,255,255,0.3)", fontSize: "11px" }}>
        <ScopeIcon />
        <span style={{ fontWeight: "500", letterSpacing: "0.04em" }}>SCOPE</span>
      </div>

      {/* All Documents */}
      <div
        style={pillStyle(scope.type === "all")}
        onClick={() => { onScopeChange({ type: "all", label: "All Documents" }); setShowDeptDropdown(false); setShowDocDropdown(false); }}
      >
        All Documents
        <span style={countBadgeStyle}>{documents.length}</span>
      </div>

      {/* Department scope */}
      <div style={{ position: "relative" }}>
        <div
          style={pillStyle(scope.type === "department")}
          onClick={() => { setShowDeptDropdown(p => !p); setShowDocDropdown(false); }}
        >
          {scope.type === "department" ? scope.label : "Department"}
          <ChevronIcon />
        </div>
        {showDeptDropdown && (
          <div style={{
            position: "absolute", bottom: "calc(100% + 8px)", left: 0, zIndex: 50,
            background: "#161622", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "10px", padding: "6px", minWidth: "220px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}>
            {departments.length === 0 ? (
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", padding: "8px 10px" }}>No departments</p>
            ) : departments.map(d => {
              const count = docCountByDept(d._id);
              return (
                <div key={d._id} onClick={() => { onScopeChange({ type: "department", departmentId: d._id, label: `${d.icon} ${d.name}` }); setShowDeptDropdown(false); }}
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", color: "rgba(255,255,255,0.8)", transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <span>{d.icon}</span>
                  <span style={{ flex: 1 }}>{d.name}</span>
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.07)", borderRadius: "10px", padding: "1px 7px", flexShrink: 0 }}>
                    {count} {count === 1 ? "doc" : "docs"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Specific document scope */}
      <div style={{ position: "relative" }}>
        <div
          style={pillStyle(scope.type === "document")}
          onClick={() => { setShowDocDropdown(p => !p); setShowDeptDropdown(false); }}
        >
          {scope.type === "document" ? (
            <span style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{scope.label}</span>
          ) : "Specific Document"}
          <ChevronIcon />
        </div>
        {showDocDropdown && (
          <div style={{
            position: "absolute", bottom: "calc(100% + 8px)", left: 0, zIndex: 50,
            background: "#161622", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "10px", padding: "6px", width: "280px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}>
            <input
              value={docSearch} onChange={(e) => setDocSearch(e.target.value)}
              placeholder="Search documents..." autoFocus
              style={{ width: "100%", padding: "7px 10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "rgba(255,255,255,0.8)", fontSize: "12px", outline: "none", boxSizing: "border-box", marginBottom: "4px" }}
            />
            <div style={{ maxHeight: "200px", overflowY: "auto" }}>
              {filteredDocs.length === 0 ? (
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", padding: "8px 10px" }}>No documents found</p>
              ) : filteredDocs.map(d => (
                <div key={d._id}
                  onClick={() => { onScopeChange({ type: "document", documentId: d._id, label: d.originalName }); setShowDocDropdown(false); setDocSearch(""); }}
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "6px", cursor: "pointer", transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }}><FileIcon /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.originalName}</p>
                    {d.department && <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>{d.department.name}</p>}
                  </div>
                  <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>{d.fileType.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Active scope badge */}
      {scope.type !== "all" && (
        <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "20px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)", fontSize: "11px", color: "rgba(16,185,129,0.8)" }}>
          Scoped search active
          <button onClick={() => onScopeChange({ type: "all", label: "All Documents" })}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(16,185,129,0.6)", fontSize: "14px", lineHeight: 1, padding: "0 0 0 2px" }}>×</button>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ChatPage() {
  const { token } = useSelector((state: AppRootState) => state.auth);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);

  const [sessions, setSessions]               = useState<Session[]>([]);
  const [activeSession, setActiveSession]     = useState<Session | null>(null);
  const [messages, setMessages]               = useState<Message[]>([]);
  const [input, setInput]                     = useState("");
  const [isLoading, setIsLoading]             = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [error, setError]                     = useState<string | null>(null);
  const [editingTitle, setEditingTitle]       = useState<string | null>(null);
  const [newTitle, setNewTitle]               = useState("");
  const [hoveredSession, setHoveredSession]   = useState<string | null>(null);
  const [departments, setDepartments]         = useState<Department[]>([]);
  const [documents, setDocuments]             = useState<Document[]>([]);
  const [scope, setScope]                     = useState<Scope>({ type: "all", label: "All Documents" });

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const loadSessions = useCallback(async () => {
    try {
      setSessionsLoading(true);
      const [sessRes, deptRes, docRes] = await Promise.all([
        fetch(`${API_BASE}/chat/sessions`,  { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/departments`,    { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/documents`,      { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [sessData, deptData, docData] = await Promise.all([sessRes.json(), deptRes.json(), docRes.json()]);
      if (sessData.success) setSessions(sessData.data);
      if (deptData.success) setDepartments(deptData.data);
      if (docData.success)  setDocuments(docData.data);
    } catch { /* silent */ }
    finally { setSessionsLoading(false); }
  }, [token]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

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

  const createNewSession = async () => {
    try {
      const res  = await fetch(`${API_BASE}/chat/sessions`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setActiveSession(data.data);
        setMessages([]);
        setSessions(prev => [data.data, ...prev]);
        setScope({ type: "all", label: "All Documents" });
        setError(null);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } catch { setError("Failed to create session"); }
  };

  const handleSend = async (question?: string) => {
    const q = question || input.trim();
    if (!q || isLoading) return;

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
        body: JSON.stringify({
          question: q,
          scope: {
            type:         scope.type,
            departmentId: scope.departmentId || null,
            documentId:   scope.documentId   || null,
          },
        }),
      });
      const data = await res.json();

      if (data.success) {
        const aiMsg: Message = { role: "assistant", content: data.data.answer, sources: data.data.sources, createdAt: new Date().toISOString() };
        setMessages(prev => [...prev.slice(0, -1), aiMsg]);
        setSessions(prev => prev.map(s => s._id === sessionId ? { ...s, title: data.data.title, updatedAt: new Date().toISOString() } : s));
        setActiveSession(prev => prev ? { ...prev, title: data.data.title } : null);
      } else throw new Error(data.message || "Failed to get response");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this conversation?")) return;
    try {
      await fetch(`${API_BASE}/chat/sessions/${sessionId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setSessions(prev => prev.filter(s => s._id !== sessionId));
      if (activeSession?._id === sessionId) { setActiveSession(null); setMessages([]); }
    } catch { /* silent */ }
  };

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

  const todaySessions     = sessions.filter(s => formatDate(s.updatedAt) === "Today");
  const yesterdaySessions = sessions.filter(s => formatDate(s.updatedAt) === "Yesterday");
  const olderSessions     = sessions.filter(s => !["Today","Yesterday"].includes(formatDate(s.updatedAt)));

  const renderSession = (session: Session) => (
    <div key={session._id} onClick={() => selectSession(session._id)}
      onMouseEnter={() => setHoveredSession(session._id)}
      onMouseLeave={() => setHoveredSession(null)}
      style={{ padding: "8px 10px", borderRadius: "8px", cursor: "pointer", marginBottom: "1px", display: "flex", alignItems: "center", gap: "8px", background: activeSession?._id === session._id ? "rgba(255,255,255,0.08)" : hoveredSession === session._id ? "rgba(255,255,255,0.04)" : "transparent", transition: "background 0.15s ease" }}
    >
      <span style={{ color: "rgba(255,255,255,0.35)", flexShrink: 0 }}><ChatIcon /></span>
      {editingTitle === session._id ? (
        <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
          onBlur={() => handleRename(session._id)}
          onKeyDown={(e) => { if (e.key === "Enter") handleRename(session._id); if (e.key === "Escape") setEditingTitle(null); }}
          onClick={(e) => e.stopPropagation()} autoFocus
          style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--color-text)", fontSize: "13px", padding: 0 }}
        />
      ) : (
        <span style={{ flex: 1, fontSize: "13px", color: activeSession?._id === session._id ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {session.title}
        </span>
      )}
      {(hoveredSession === session._id || activeSession?._id === session._id) && editingTitle !== session._id && (
        <div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
          <button onClick={(e) => { e.stopPropagation(); setEditingTitle(session._id); setNewTitle(session.title); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: "3px", borderRadius: "4px", display: "flex", alignItems: "center" }}><EditIcon /></button>
          <button onClick={(e) => deleteSession(session._id, e)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(239,68,68,0.6)", padding: "3px", borderRadius: "4px", display: "flex", alignItems: "center" }}><TrashIcon /></button>
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout title="AI Chat" subtitle="Ask questions about your organization's documents">
      <div style={{ display: "flex", height: "calc(100vh - 140px)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", background: "#0d0d14" }}>

        {/* Sidebar */}
        <div style={{ width: "256px", flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", background: "#0a0a12" }}>
          <div style={{ padding: "12px" }}>
            <button onClick={createNewSession} style={{ width: "100%", padding: "9px 14px", borderRadius: "8px", fontSize: "13px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)", cursor: "pointer", fontWeight: "500", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.15s ease" }}>
              <PlusIcon />New conversation
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 8px" }}>
            {sessionsLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "24px" }}>
                <div style={{ width: "18px", height: "18px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.08)", borderTop: "2px solid rgba(255,255,255,0.4)", animation: "spin 0.8s linear infinite" }}/>
              </div>
            ) : sessions.length === 0 ? (
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)", textAlign: "center", padding: "24px 12px" }}>No conversations yet</p>
            ) : (
              <>
                {todaySessions.length > 0 && (<><p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", fontWeight: "600", padding: "8px 10px 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Today</p>{todaySessions.map(renderSession)}</>)}
                {yesterdaySessions.length > 0 && (<><p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", fontWeight: "600", padding: "8px 10px 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Yesterday</p>{yesterdaySessions.map(renderSession)}</>)}
                {olderSessions.length > 0 && (<><p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", fontWeight: "600", padding: "8px 10px 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Older</p>{olderSessions.map(renderSession)}</>)}
              </>
            )}
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "#0d0d14" }}>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "32px 0" }}>
            {messages.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "32px", padding: "0 20px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "linear-gradient(135deg, #3b82f6, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <BotIcon />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <h2 style={{ fontSize: "22px", fontWeight: "600", marginBottom: "6px", color: "rgba(255,255,255,0.9)" }}>How can I help you today?</h2>
                    <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>Search through your organization&apos;s documents with AI</p>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", width: "100%", maxWidth: "580px" }}>
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => handleSend(s)} style={{ padding: "14px 16px", borderRadius: "10px", textAlign: "left", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.75)", fontSize: "13px", cursor: "pointer", transition: "all 0.15s ease", lineHeight: 1.5 }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: "28px" }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ display: "flex", gap: "14px", alignItems: "flex-start", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0, background: msg.role === "user" ? "linear-gradient(135deg, #3b82f6, #6366f1)" : "rgba(255,255,255,0.06)", border: msg.role === "assistant" ? "1px solid rgba(255,255,255,0.1)" : "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {msg.role === "user" ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      ) : (
                        <div style={{ color: "rgba(255,255,255,0.7)" }}><BotIcon /></div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "8px", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                      <div style={{ padding: "12px 16px", borderRadius: msg.role === "user" ? "18px 4px 18px 18px" : "4px 18px 18px 18px", background: msg.role === "user" ? "linear-gradient(135deg, #3b82f6, #6366f1)" : "rgba(255,255,255,0.05)", border: msg.role === "assistant" ? "1px solid rgba(255,255,255,0.07)" : "none", fontSize: "14px", lineHeight: "1.7", color: "rgba(255,255,255,0.9)", whiteSpace: "pre-wrap", maxWidth: "100%" }}>
                        {msg.isLoading ? (
                          <div style={{ display: "flex", gap: "5px", alignItems: "center", padding: "2px 0" }}>
                            {[0,1,2].map(j => <div key={j} style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgba(255,255,255,0.5)", animation: `bounce 1.2s ease infinite ${j * 0.2}s` }}/>)}
                          </div>
                        ) : msg.content}
                      </div>
                      {msg.sources && msg.sources.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {msg.sources.map((src, j) => (
                            <span key={j} style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "20px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)", color: "rgba(16,185,129,0.9)", fontWeight: "500" }}>
                              Source {j+1} · p.{src.page + 1} · {Math.round(src.relevance * 100)}%
                            </span>
                          ))}
                        </div>
                      )}
                      {msg.createdAt && !msg.isLoading && (
                        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)" }}>{formatTime(msg.createdAt)}</p>
                      )}
                    </div>
                  </div>
                ))}
                {error && (
                  <div style={{ padding: "12px 16px", borderRadius: "10px", fontSize: "13px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", color: "rgba(239,68,68,0.9)", display: "flex", alignItems: "center", gap: "10px" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    {error}
                    <button onClick={() => setError(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "rgba(239,68,68,0.7)", fontSize: "16px", lineHeight: 1 }}>×</button>
                  </div>
                )}
                <div ref={messagesEndRef}/>
              </div>
            )}
          </div>

          {/* Input area */}
          <div style={{ padding: "12px 24px 20px", background: "#0d0d14" }}>
            <div style={{ maxWidth: "720px", margin: "0 auto" }}>

              {/* Scope selector */}
              <ScopeSelector
                scope={scope}
                departments={departments}
                documents={documents}
                onScopeChange={setScope}
              />

              {/* Input box */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", padding: "12px 16px", borderRadius: "14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", transition: "border-color 0.2s ease" }}>
                <textarea
                  ref={inputRef} value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message SmartOrg AI..."
                  disabled={isLoading} rows={1}
                  style={{ flex: 1, background: "none", border: "none", outline: "none", color: "rgba(255,255,255,0.9)", fontSize: "14px", resize: "none", lineHeight: "1.6", maxHeight: "160px", overflowY: "auto", fontFamily: "inherit" }}
                  onInput={(e) => { const el = e.target as HTMLTextAreaElement; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 160) + "px"; }}
                />
                <button onClick={() => handleSend()} disabled={isLoading || !input.trim()} style={{ width: "34px", height: "34px", borderRadius: "8px", flexShrink: 0, background: input.trim() && !isLoading ? "linear-gradient(135deg, #3b82f6, #6366f1)" : "rgba(255,255,255,0.07)", border: "none", cursor: input.trim() && !isLoading ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", color: input.trim() && !isLoading ? "#fff" : "rgba(255,255,255,0.25)", transition: "all 0.2s ease" }}>
                  {isLoading ? <div style={{ width: "14px", height: "14px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)", borderTop: "2px solid rgba(255,255,255,0.7)", animation: "spin 0.8s linear infinite" }}/> : <SendIcon />}
                </button>
              </div>

              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: "10px" }}>
                {scope.type !== "all"
                  ? `Searching within: ${scope.label} · Press Enter to send`
                  : "SmartOrg AI searches only documents you have access to · Press Enter to send"
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        textarea::placeholder { color: rgba(255,255,255,0.25) !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
      `}</style>
    </DashboardLayout>
  );
}