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

  const docCountByDept = (deptId: string) =>
    documents.filter(d => d.department?._id === deptId).length;

  const pillClass = (active: boolean) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs cursor-pointer transition-all select-none ${
      active
        ? "bg-primary/20 border border-primary/40 text-primary font-medium shadow-sm"
        : "bg-surface border border-border text-text-muted hover:text-text-primary hover:bg-surface-hover hover:border-text-muted/30"
    }`;

  return (
    <div className="flex items-center gap-2 mb-3 flex-wrap">
      <div className="flex items-center gap-1.5 text-text-muted text-[11px] font-bold tracking-wider mr-1">
        <ScopeIcon />
        <span>SCOPE</span>
      </div>

      <div
        className={pillClass(scope.type === "all")}
        onClick={() => { onScopeChange({ type: "all", label: "All Documents" }); setShowDeptDropdown(false); setShowDocDropdown(false); }}
      >
        All Documents
        <span className="text-[10px] opacity-70 bg-border px-1.5 py-0.5 rounded-md text-text-primary">{documents.length}</span>
      </div>

      <div className="relative">
        <div
          className={pillClass(scope.type === "department")}
          onClick={() => { setShowDeptDropdown(p => !p); setShowDocDropdown(false); }}
        >
          {scope.type === "department" ? scope.label : "Department"}
          <ChevronIcon />
        </div>
        {showDeptDropdown && (
          <div className="absolute bottom-full mb-2 left-0 z-50 bg-surface/95 backdrop-blur-md border border-border rounded-xl p-1.5 min-w-[220px] shadow-lg">
            {departments.length === 0 ? (
              <p className="text-xs text-text-muted px-2.5 py-2">No departments</p>
            ) : departments.map(d => {
              const count = docCountByDept(d._id);
              return (
                <div key={d._id} onClick={() => { onScopeChange({ type: "department", departmentId: d._id, label: `${d.icon} ${d.name}` }); setShowDeptDropdown(false); }}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer text-sm text-text-primary hover:bg-surface-hover transition-colors"
                >
                  <span>{d.icon}</span>
                  <span className="flex-1 font-medium">{d.name}</span>
                  <span className="text-[10px] text-text-muted bg-border px-2 py-0.5 rounded-md flex-shrink-0">
                    {count} {count === 1 ? "doc" : "docs"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="relative">
        <div
          className={pillClass(scope.type === "document")}
          onClick={() => { setShowDocDropdown(p => !p); setShowDeptDropdown(false); }}
        >
          {scope.type === "document" ? (
            <span className="max-w-[120px] truncate">{scope.label}</span>
          ) : "Specific Document"}
          <ChevronIcon />
        </div>
        {showDocDropdown && (
          <div className="absolute bottom-full mb-2 left-0 z-50 bg-surface/95 backdrop-blur-md border border-border rounded-xl p-1.5 w-[280px] shadow-lg">
            <input
              value={docSearch} onChange={(e) => setDocSearch(e.target.value)}
              placeholder="Search documents..." autoFocus
              className="w-full px-3 py-2 mb-1 bg-surface-hover border border-border rounded-lg text-text-primary text-xs outline-none focus:border-primary/50 transition-colors"
            />
            <div className="max-h-[200px] overflow-y-auto">
              {filteredDocs.length === 0 ? (
                <p className="text-xs text-text-muted px-2.5 py-2">No documents found</p>
              ) : filteredDocs.map(d => (
                <div key={d._id}
                  onClick={() => { onScopeChange({ type: "document", documentId: d._id, label: d.originalName }); setShowDocDropdown(false); setDocSearch(""); }}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors hover:bg-surface-hover"
                >
                  <span className="text-text-muted flex-shrink-0"><FileIcon /></span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-primary truncate">{d.originalName}</p>
                    {d.department && <p className="text-[10px] text-text-muted truncate">{d.department.name}</p>}
                  </div>
                  <span className="text-[10px] text-text-muted flex-shrink-0 uppercase font-medium">{d.fileType}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {scope.type !== "all" && (
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-success/10 border border-success/20 text-[11px] text-success font-medium">
          Scoped search active
          <button onClick={() => onScopeChange({ type: "all", label: "All Documents" })} className="ml-1 opacity-70 hover:opacity-100 focus:outline-none">×</button>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ChatPage() {
  const { token, user } = useSelector((state: AppRootState) => state.auth);
  const isDemo = user?.email && user.email !== "owner@smartorg.com";
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

  useEffect(() => { if (token) loadSessions(); }, [loadSessions, token]);

  const selectSession = async (sessionId: string) => {
    try {
      const res  = await fetch(`${API_BASE}/chat/sessions/${sessionId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setActiveSession(data.data);
        setMessages(data.data.messages);
        setError(null);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
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
      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer mb-0.5 transition-colors ${activeSession?._id === session._id ? "bg-surface border-border shadow-sm" : hoveredSession === session._id ? "bg-surface-hover" : "bg-transparent"}`}
    >
      <span className="text-text-muted flex-shrink-0"><ChatIcon /></span>
      {editingTitle === session._id ? (
        <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
          onBlur={() => handleRename(session._id)}
          onKeyDown={(e) => { if (e.key === "Enter") handleRename(session._id); if (e.key === "Escape") setEditingTitle(null); }}
          onClick={(e) => e.stopPropagation()} autoFocus
          className="flex-1 bg-transparent border-none outline-none text-text-primary text-sm p-0 m-0"
        />
      ) : (
        <span className={`flex-1 text-sm truncate ${activeSession?._id === session._id ? "text-text-primary font-medium" : "text-text-muted"}`}>
          {session.title}
        </span>
      )}
      {(hoveredSession === session._id || activeSession?._id === session._id) && editingTitle !== session._id && (
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={(e) => { e.stopPropagation(); setEditingTitle(session._id); setNewTitle(session.title); }} className="p-1 rounded bg-transparent hover:bg-border text-text-muted transition-colors"><EditIcon /></button>
          <button onClick={(e) => deleteSession(session._id, e)} className="p-1 rounded bg-transparent hover:bg-error/10 text-error/70 transition-colors"><TrashIcon /></button>
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout title="AI Chat" subtitle="Ask questions about your organization's documents">
      <div className="flex h-[calc(100vh-140px)] rounded-2xl border border-border overflow-hidden bg-background shadow-sm">

        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 border-r border-border flex flex-col bg-surface/50 backdrop-blur-sm">
          <div className="p-3">
            <button onClick={createNewSession} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-surface hover:bg-surface-hover border border-border text-text-primary shadow-sm transition-all hover:border-primary/30">
              <PlusIcon /> New conversation
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {sessionsLoading ? (
              <div className="flex justify-center p-6 opacity-50">
                <div className="w-5 h-5 rounded-full border-2 border-border border-t-text-muted animate-spin"/>
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-text-muted text-center p-6">No conversations yet</p>
            ) : (
              <>
                {todaySessions.length > 0 && (<><p className="text-[10px] text-text-muted font-bold px-2.5 py-1.5 uppercase tracking-wider">Today</p>{todaySessions.map(renderSession)}</>)}
                {yesterdaySessions.length > 0 && (<><p className="text-[10px] text-text-muted font-bold px-2.5 py-1.5 uppercase tracking-wider">Yesterday</p>{yesterdaySessions.map(renderSession)}</>)}
                {olderSessions.length > 0 && (<><p className="text-[10px] text-text-muted font-bold px-2.5 py-1.5 uppercase tracking-wider">Older</p>{olderSessions.map(renderSession)}</>)}
              </>
            )}
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0 bg-background relative">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-8 px-5">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-md">
                    <BotIcon />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-text-primary tracking-tight mb-2">How can I help you today?</h2>
                    <p className="text-text-muted">Search through your organization&apos;s documents with AI</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-[600px]">
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => handleSend(s)} className="p-4 rounded-xl text-left bg-surface/50 border border-border text-text-muted text-sm cursor-pointer hover:bg-surface-hover hover:border-primary/30 hover:text-text-primary transition-all shadow-sm">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-[760px] mx-auto flex flex-col gap-7 pb-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-4 items-start ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${msg.role === "user" ? "bg-gradient-to-br from-primary to-secondary text-white" : "bg-surface border border-border text-text-primary"}`}>
                      {msg.role === "user" ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      ) : (
                        <BotIcon />
                      )}
                    </div>
                    <div className={`flex-1 min-w-0 flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                      <div className={`px-5 py-3.5 text-[15px] leading-relaxed whitespace-pre-wrap max-w-full shadow-sm ${msg.role === "user" ? "rounded-[20px_6px_20px_20px] bg-gradient-to-br from-primary to-primary-hover text-white shadow-primary/20" : "rounded-[6px_20px_20px_20px] bg-surface border border-border text-text-primary"}`}>
                        {msg.isLoading ? (
                          <div className="flex gap-1.5 items-center py-1 px-1">
                            {[0,1,2].map(j => <div key={j} className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: `${j * 0.15}s` }}/>)}
                          </div>
                        ) : msg.content}
                      </div>
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {msg.sources.map((src, j) => (
                            <span key={j} className="text-xs px-2.5 py-1 rounded-lg bg-success/10 border border-success/20 text-success font-medium flex items-center gap-1.5">
                              <FileIcon /> Source {j+1} · p.{src.page + 1} · {Math.round(src.relevance * 100)}%
                            </span>
                          ))}
                        </div>
                      )}
                      {msg.createdAt && !msg.isLoading && (
                        <p className="text-[11px] text-text-muted">{formatTime(msg.createdAt)}</p>
                      )}
                    </div>
                  </div>
                ))}
                {error && (
                  <div className="px-4 py-3 rounded-xl text-sm bg-error/10 border border-error/20 text-error flex items-center gap-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto bg-transparent border-none text-error/70 hover:text-error text-lg leading-none p-1">×</button>
                  </div>
                )}
                <div ref={messagesEndRef}/>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="p-4 md:px-8 pb-6 bg-gradient-to-t from-background via-background to-transparent relative z-10 pt-10 mt-auto">
            <div className="max-w-[760px] mx-auto">
              
              {isDemo && (
                <div className="mb-3 px-4 py-2.5 rounded-xl bg-warning/10 border border-warning/20 text-warning text-xs font-semibold text-center select-none animate-fade-in shadow-sm">
                  ⚠️ Demo Mode Active: You are restricted to a total of 3 AI messages to prevent token abuse.
                </div>
              )}

              <ScopeSelector scope={scope} departments={departments} documents={documents} onScopeChange={setScope} />

              <div className="flex items-end gap-3 p-3 rounded-2xl bg-surface border border-border shadow-lg transition-colors focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10">
                <textarea
                  ref={inputRef} value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message SmartOrg AI..."
                  disabled={isLoading} rows={1}
                  className="flex-1 bg-transparent border-none outline-none text-text-primary text-[15px] resize-none leading-relaxed max-h-[160px] overflow-y-auto px-2 py-1 placeholder:text-text-muted"
                  onInput={(e) => { const el = e.target as HTMLTextAreaElement; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 160) + "px"; }}
                />
                <button onClick={() => handleSend()} disabled={isLoading || !input.trim()} 
                  className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center transition-all ${input.trim() && !isLoading ? "bg-gradient-to-br from-primary to-secondary text-white shadow-md hover:shadow-lg" : "bg-surface-hover text-text-muted cursor-not-allowed"}`}>
                  {isLoading ? <div className="w-4 h-4 rounded-full border-2 border-border border-t-white animate-spin"/> : <SendIcon />}
                </button>
              </div>

              <p className="text-[11px] text-text-muted text-center mt-3 font-medium">
                {scope.type !== "all"
                  ? `Searching within: ${scope.label} · Press Enter to send`
                  : "SmartOrg AI searches only documents you have access to · Press Enter to send"
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}