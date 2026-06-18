"use client";

import { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useSelector } from "react-redux";
import { AppRootState } from "@/store";

// ── Types ──────────────────────────────────────────────────────────────────
interface DocumentFile {
  _id: string;
  name: string;
  originalName: string;
  description?: string;
  fileType: string;
  mimeType: string;
  size: number;
  s3Url: string;
  uploadedBy: { _id: string; name: string; email: string };
  department: { _id: string; name: string; icon: string } | null;
  createdAt: string;
  visibility: string;
  aiProcessingStatus: string;
}

interface Department {
  _id: string;
  name: string;
  code: string;
  icon: string;
}

interface Filters {
  search: string;
  fileType: string;
  dateFrom: string;
  dateTo: string;
  department: string;
  visibility: string;
  aiStatus: string;
  sortBy: string;
}

interface UploadForm {
  departmentId: string;
  visibility: string;
  description: string;
}

interface EditForm {
  visibility: string;
  departmentId: string;
  description: string;
}

interface AuthUser {
  id: string;   // ← was _id
  _id?: string; // ← keep as optional fallback
  name: string;
  email: string;
  role: string;
}
type Tab = "all" | "mine";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// ── Helpers ────────────────────────────────────────────────────────────────
const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const getFileIcon = (fileType: string) => {
  const icons: Record<string, { icon: string; color: string; bg: string }> = {
    pdf:  { icon: "📄", color: "#ef4444", bg: "rgba(239,68,68,0.1)"   },
    doc:  { icon: "📝", color: "#3b82f6", bg: "rgba(59,130,246,0.1)"  },
    docx: { icon: "📝", color: "#3b82f6", bg: "rgba(59,130,246,0.1)"  },
    xls:  { icon: "📊", color: "#10b981", bg: "rgba(16,185,129,0.1)"  },
    xlsx: { icon: "📊", color: "#10b981", bg: "rgba(16,185,129,0.1)"  },
    ppt:  { icon: "📋", color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
    pptx: { icon: "📋", color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
    png:  { icon: "🖼️", color: "#a855f7", bg: "rgba(168,85,247,0.1)"  },
    jpg:  { icon: "🖼️", color: "#a855f7", bg: "rgba(168,85,247,0.1)"  },
    jpeg: { icon: "🖼️", color: "#a855f7", bg: "rgba(168,85,247,0.1)"  },
    csv:  { icon: "📈", color: "#06b6d4", bg: "rgba(6,182,212,0.1)"   },
    txt:  { icon: "📃", color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
  };
  return icons[fileType?.toLowerCase()] ?? { icon: "📁", color: "#6b7280", bg: "rgba(107,114,128,0.1)" };
};

const selectStyle: React.CSSProperties = {
  padding: "8px 12px", borderRadius: "8px",
  background: "rgba(255,255,255,0.04)", border: "1px solid var(--color-border)",
  color: "var(--color-text)", fontSize: "13px", cursor: "pointer", outline: "none",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: "8px",
  background: "rgba(255,255,255,0.04)", border: "1px solid var(--color-border)",
  color: "var(--color-text)", fontSize: "14px", outline: "none", boxSizing: "border-box",
};

// ── Modal ──────────────────────────────────────────────────────────────────
function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={onClose}
    >
      <div
        style={{ background: "var(--color-surface)", borderRadius: "16px", border: "1px solid var(--color-border)", padding: "28px", width: "100%", maxWidth: "480px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────
export default function DocumentsPage() {
  const { token, user } = useSelector((state: AppRootState) => state.auth) as {
    token: string | null;
    user: AuthUser | null;
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents,       setDocuments]      = useState<DocumentFile[]>([]);
  const [departments,     setDepartments]    = useState<Department[]>([]);
  const [isLoading,       setIsLoading]      = useState(true);
  const [isUploading,     setIsUploading]    = useState(false);
  const [uploadProgress,  setUploadProgress] = useState(0);
  const [error,           setError]          = useState<string | null>(null);
  const [successMsg,      setSuccessMsg]     = useState<string | null>(null);
  const [deletingId,      setDeletingId]     = useState<string | null>(null);
  const [refresh,         setRefresh]        = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingFile,     setPendingFile]    = useState<File | null>(null);
  const [activeTab,       setActiveTab]      = useState<Tab>("all");

  // ── Edit state ─────────────────────────────────────────────────────────
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const editingDoc = documents.find(d => d._id === editingDocId) ?? null;
  const [editForm,   setEditForm]   = useState<EditForm>({ visibility: "", departmentId: "", description: "" });
  const [isEditing,  setIsEditing]  = useState(false);

  const [uploadForm, setUploadForm] = useState<UploadForm>({
    departmentId: "", visibility: "DEPARTMENT", description: "",
  });

  const [filters, setFilters] = useState<Filters>({
    search: "", fileType: "all", dateFrom: "", dateTo: "",
    department: "all", visibility: "all", aiStatus: "all", sortBy: "newest",
  });

  const setFilter = (key: keyof Filters, value: string) =>
    setFilters(prev => ({ ...prev, [key]: value }));

  console.log("user._id:", user?._id, typeof user?._id);
console.log("first doc uploadedBy._id:", documents[0]?.uploadedBy?._id, typeof documents[0]?.uploadedBy?._id);

  // ── Fetch ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        const [docRes, deptRes] = await Promise.all([
          fetch(`${API_BASE}/documents`,   { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/departments`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const [docData, deptData] = await Promise.all([docRes.json(), deptRes.json()]);
        if (!cancelled) {
          if (docData.success)  setDocuments(docData.data);
          if (deptData.success) setDepartments(deptData.data);
        }
      } catch { if (!cancelled) setError("Failed to load documents"); }
      finally  { if (!cancelled) setIsLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [token, refresh]);

  // ── File select ────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setShowUploadModal(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Upload ─────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!pendingFile) return;
    setShowUploadModal(false);
    setIsUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 85) { clearInterval(progressInterval); return prev; }
        return prev + 10;
      });
    }, 200);

    try {
      const formData = new FormData();
      formData.append("file", pendingFile);
      if (uploadForm.departmentId) formData.append("departmentId", uploadForm.departmentId);
      formData.append("visibility", uploadForm.visibility);
      if (uploadForm.description) formData.append("description", uploadForm.description);

      const res  = await fetch(`${API_BASE}/documents/upload`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData,
      });
      const data = await res.json();
      clearInterval(progressInterval);

      if (data.success) {
        setUploadProgress(100);
        setSuccessMsg(`"${pendingFile.name}" uploaded successfully!`);
        setTimeout(() => { setSuccessMsg(null); setUploadProgress(0); }, 3000);
        setRefresh(p => p + 1);
      } else throw new Error(data.message || "Upload failed");
    } catch (err: unknown) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
      setPendingFile(null);
      setUploadForm({ departmentId: "", visibility: "DEPARTMENT", description: "" });
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────
  const openEditModal = (doc: DocumentFile) => {
    setEditingDocId(doc._id);
    setEditForm({
      visibility:   doc.visibility,
      departmentId: doc.department?._id || "",
      description:  doc.description     || "",
    });
  };

  const handleEdit = async () => {
    if (!editingDoc) return;
    setIsEditing(true);
    try {
      const res  = await fetch(`${API_BASE}/documents/${editingDoc._id}`, {
        method:  "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body:    JSON.stringify({
          visibility:   editForm.visibility,
          departmentId: editForm.departmentId || null,
          description:  editForm.description,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDocuments(prev => prev.map(d =>
          d._id === editingDoc._id
            ? { ...d, visibility: data.data.visibility, department: data.data.department, description: data.data.description }
            : d
        ));
        setSuccessMsg("Document updated successfully");
        setTimeout(() => setSuccessMsg(null), 3000);
        setEditingDocId(null);
      } else throw new Error(data.message);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setIsEditing(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────
  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    setDeletingId(docId);
    try {
      const res  = await fetch(`${API_BASE}/documents/${docId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDocuments(prev => prev.filter(d => d._id !== docId));
        setSuccessMsg("Document deleted");
        setTimeout(() => setSuccessMsg(null), 3000);
      } else throw new Error(data.message);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Delete failed"); }
    finally { setDeletingId(null); }
  };

  // ── Can user edit this doc? ────────────────────────────────────────────
  const canEdit = (doc: DocumentFile) =>
    user?.role === "ORG_ADMIN" || 
    doc.uploadedBy?._id?.toString() === (user?.id || user?._id)?.toString();

  // ── Tab split ──────────────────────────────────────────────────────────
 const myUploads = documents.filter(d => 
    d.uploadedBy?._id?.toString() === (user?.id || user?._id)?.toString()
);
  const sourceList = activeTab === "mine" ? myUploads : documents;

  // ── Apply filters + sort ───────────────────────────────────────────────
  const filtered = sourceList
    .filter(d => {
      if (filters.search && !d.originalName.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.fileType !== "all") {
        const typeMap: Record<string, string[]> = {
          pdf:   ["pdf"],
          word:  ["doc", "docx"],
          excel: ["xls", "xlsx", "csv"],
          image: ["png", "jpg", "jpeg", "gif", "webp"],
          other: ["ppt", "pptx", "txt"],
        };
        if (!typeMap[filters.fileType]?.includes(d.fileType.toLowerCase())) return false;
      }
      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom); from.setHours(0, 0, 0, 0);
        if (new Date(d.createdAt) < from) return false;
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo); to.setHours(23, 59, 59, 999);
        if (new Date(d.createdAt) > to) return false;
      }
      if (filters.department !== "all") {
        if (filters.department === "none" && d.department !== null) return false;
        if (filters.department !== "none" && d.department?._id !== filters.department) return false;
      }
      if (filters.visibility !== "all" && d.visibility !== filters.visibility) return false;
      if (filters.aiStatus !== "all") {
        if (filters.aiStatus === "ready"   && d.aiProcessingStatus !== "COMPLETED") return false;
        if (filters.aiStatus === "pending" && d.aiProcessingStatus === "COMPLETED") return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (filters.sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (filters.sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (filters.sortBy === "name")   return a.originalName.localeCompare(b.originalName);
      if (filters.sortBy === "size")   return b.size - a.size;
      return 0;
    });

  const activeDateFilter  = filters.dateFrom || filters.dateTo;
  const activeFilterCount = [filters.fileType, filters.department, filters.visibility, filters.aiStatus]
    .filter(v => v !== "all").length + (activeDateFilter ? 1 : 0);

  const clearAllFilters = () => setFilters({
    search: "", fileType: "all", dateFrom: "", dateTo: "",
    department: "all", visibility: "all", aiStatus: "all", sortBy: "newest",
  });

  // ── Tab style helper ───────────────────────────────────────────────────
  const tabStyle = (t: Tab): React.CSSProperties => ({
    padding: "8px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: "600",
    cursor: "pointer", border: "none", transition: "all 0.15s ease",
    background: activeTab === t ? "rgba(59,130,246,0.15)" : "transparent",
    color:      activeTab === t ? "#3b82f6"                : "var(--color-text-muted)",
    borderBottom: activeTab === t ? "2px solid #3b82f6" : "2px solid transparent",
  });

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <DashboardLayout title="Documents" subtitle="Upload and manage your organization's files">

      {/* Toast messages */}
      {successMsg && (
        <div style={{ position: "fixed", top: "80px", right: "24px", zIndex: 999, padding: "12px 20px", borderRadius: "10px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", fontSize: "14px", fontWeight: "500", animation: "slideIn 0.3s ease" }}>
          ✅ {successMsg}
        </div>
      )}
      {error && (
        <div style={{ position: "fixed", top: "80px", right: "24px", zIndex: 999, padding: "12px 20px", borderRadius: "10px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontSize: "14px", fontWeight: "500" }}>
          ❌ {error}
          <button onClick={() => setError(null)} style={{ marginLeft: "12px", background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}>✕</button>
        </div>
      )}

      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
        <input
          type="text" placeholder="Search documents..." value={filters.search}
          onChange={(e) => setFilter("search", e.target.value)}
          style={{ flex: 1, minWidth: "200px", maxWidth: "360px", padding: "10px 16px", borderRadius: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--color-border)", color: "var(--color-text)", fontSize: "14px", outline: "none" }}
        />
        <input ref={fileInputRef} type="file" onChange={handleFileSelect} style={{ display: "none" }}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.gif,.webp" />
        <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="gradient-button"
          style={{ padding: "10px 20px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          {isUploading ? "Uploading..." : "⬆ Upload File"}
        </button>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "16px", borderBottom: "1px solid var(--color-border)", paddingBottom: "0" }}>
        <button style={tabStyle("all")} onClick={() => setActiveTab("all")}>
          All Documents
          <span style={{ marginLeft: "6px", fontSize: "11px", padding: "1px 6px", borderRadius: "10px", background: activeTab === "all" ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.06)", color: activeTab === "all" ? "#3b82f6" : "var(--color-text-muted)" }}>
            {documents.length}
          </span>
        </button>
        <button style={tabStyle("mine")} onClick={() => setActiveTab("mine")}>
          My Uploads
          <span style={{ marginLeft: "6px", fontSize: "11px", padding: "1px 6px", borderRadius: "10px", background: activeTab === "mine" ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.06)", color: activeTab === "mine" ? "#3b82f6" : "var(--color-text-muted)" }}>
            {myUploads.length}
          </span>
        </button>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", padding: "14px 16px", borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--color-border)", flexWrap: "wrap" }}>
        <span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: "600" }}>
          FILTERS {activeFilterCount > 0 && (
            <span style={{ background: "#3b82f6", color: "#fff", borderRadius: "10px", padding: "1px 6px", marginLeft: "4px" }}>{activeFilterCount}</span>
          )}
        </span>

        <select value={filters.fileType} onChange={(e) => setFilter("fileType", e.target.value)} style={selectStyle}>
          <option value="all">All Types</option>
          <option value="pdf">📄 PDF</option>
          <option value="word">📝 Word</option>
          <option value="excel">📊 Excel / CSV</option>
          <option value="image">🖼️ Images</option>
          <option value="other">📁 Other</option>
        </select>

        <select value={filters.department} onChange={(e) => setFilter("department", e.target.value)} style={selectStyle}>
          <option value="all">All Departments</option>
          <option value="none">No Department</option>
          {departments.map(d => <option key={d._id} value={d._id}>{d.icon} {d.name}</option>)}
        </select>

        <select value={filters.visibility} onChange={(e) => setFilter("visibility", e.target.value)} style={selectStyle}>
          <option value="all">All Visibility</option>
          <option value="PUBLIC">🌐 Public</option>
          <option value="DEPARTMENT">🏢 Department</option>
          <option value="PRIVATE">🔒 Private</option>
        </select>

        <select value={filters.aiStatus} onChange={(e) => setFilter("aiStatus", e.target.value)} style={selectStyle}>
          <option value="all">All AI Status</option>
          <option value="ready">✓ AI Ready</option>
          <option value="pending">⏳ Pending AI</option>
        </select>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>From</span>
          <input type="date" value={filters.dateFrom} onChange={(e) => setFilter("dateFrom", e.target.value)}
            style={{ ...selectStyle, padding: "7px 10px", colorScheme: "dark" }} />
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>To</span>
          <input type="date" value={filters.dateTo} onChange={(e) => setFilter("dateTo", e.target.value)}
            style={{ ...selectStyle, padding: "7px 10px", colorScheme: "dark" }}
            min={filters.dateFrom || undefined} />
          {activeDateFilter && (
            <button onClick={() => { setFilter("dateFrom", ""); setFilter("dateTo", ""); }}
              style={{ padding: "6px 8px", borderRadius: "6px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", cursor: "pointer", fontSize: "11px" }}>✕</button>
          )}
        </div>

        <select value={filters.sortBy} onChange={(e) => setFilter("sortBy", e.target.value)} style={selectStyle}>
          <option value="newest">↓ Newest</option>
          <option value="oldest">↑ Oldest</option>
          <option value="name">A→Z Name</option>
          <option value="size">Largest First</option>
        </select>

        {activeFilterCount > 0 && (
          <button onClick={clearAllFilters}
            style={{ padding: "8px 12px", borderRadius: "8px", fontSize: "12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", cursor: "pointer", fontWeight: "600" }}>
            Clear All
          </button>
        )}
      </div>

      {/* Upload progress */}
      {isUploading && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Uploading to S3...</span>
            <span style={{ fontSize: "13px", color: "#3b82f6" }}>{uploadProgress}%</span>
          </div>
          <div style={{ height: "6px", borderRadius: "4px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: "4px", background: "linear-gradient(135deg, #3b82f6, #a855f7)", width: `${uploadProgress}%`, transition: "width 0.2s ease" }} />
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        {[
          { label: "Total Files", value: sourceList.length,                                                              color: "#3b82f6" },
          { label: "Showing",     value: filtered.length,                                                                color: "#a855f7" },
          { label: "PDFs",        value: sourceList.filter(d => d.fileType === "pdf").length,                            color: "#ef4444" },
          { label: "Images",      value: sourceList.filter(d => ["png","jpg","jpeg"].includes(d.fileType)).length,       color: "#10b981" },
        ].map(s => (
          <div key={s.label} style={{ padding: "12px 20px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px", fontWeight: "700", color: s.color }}>{s.value}</span>
            <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Document grid */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px", opacity: 0.5 }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)", borderTop: "2px solid #3b82f6", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", gap: "16px", opacity: 0.5 }}>
          <span style={{ fontSize: "48px" }}>📂</span>
          <p style={{ fontSize: "18px", fontWeight: "600" }}>
            {filters.search || activeFilterCount > 0
              ? "No documents match your filters"
              : activeTab === "mine"
              ? "You haven't uploaded any documents yet"
              : "No documents yet"}
          </p>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)" }}>
            {filters.search || activeFilterCount > 0
              ? "Try adjusting your filters"
              : activeTab === "mine"
              ? "Click 'Upload File' to add your first document"
              : "Click 'Upload File' to add your first document"}
          </p>
          {activeFilterCount > 0 && (
            <button onClick={clearAllFilters}
              style={{ padding: "8px 16px", borderRadius: "8px", fontSize: "13px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#3b82f6", cursor: "pointer" }}>
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
          {filtered.map(doc => {
            const fileInfo    = getFileIcon(doc.fileType);
            const userCanEdit = canEdit(doc);
            const isMyDoc = doc.uploadedBy?._id?.toString() === (user?.id || user?._id)?.toString();
            return (
              <div key={doc._id}
                style={{ padding: "20px", borderRadius: "14px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "12px", transition: "all 0.2s ease", opacity: deletingId === doc._id ? 0.5 : 1, position: "relative" }}
              >
                {/* Edit icon — top right */}
                {userCanEdit && (
                  <button
                    onClick={() => openEditModal(doc)}
                    title="Edit document"
                    style={{ position: "absolute", top: "12px", right: "12px", width: "28px", height: "28px", borderRadius: "6px", background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.15)", color: "#a855f7", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s ease" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(168,85,247,0.2)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(168,85,247,0.08)"; }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                )}

                {/* File header */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingRight: userCanEdit ? "36px" : "0" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: fileInfo.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
                    {fileInfo.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "13px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doc.originalName}</p>
                    <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>{doc.fileType.toUpperCase()} · {formatSize(doc.size)}</p>
                  </div>
                </div>

                {/* Department badge + My Upload tag */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  {doc.department && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 8px", borderRadius: "7px", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.12)" }}>
                      <span style={{ fontSize: "11px" }}>{doc.department.icon}</span>
                      <span style={{ fontSize: "11px", color: "#3b82f6", fontWeight: "600" }}>{doc.department.name}</span>
                    </div>
                  )}
                  {isMyDoc && activeTab === "all" && (
                    <div style={{ padding: "4px 8px", borderRadius: "7px", background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.12)", fontSize: "10px", color: "#a855f7", fontWeight: "600" }}>
                      My Upload
                    </div>
                  )}
                </div>

                {/* AI status + date */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "6px", fontWeight: "600", background: doc.aiProcessingStatus === "COMPLETED" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)", color: doc.aiProcessingStatus === "COMPLETED" ? "#10b981" : "#f59e0b" }}>
                    {doc.aiProcessingStatus === "COMPLETED" ? "✓ AI Ready" : "⏳ Pending AI"}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{formatDate(doc.createdAt)}</span>
                </div>

                {/* Uploader + visibility */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                    {isMyDoc ? "You" : `By ${doc.uploadedBy?.name ?? "Unknown"}`}
                  </p>
                  <span style={{
                    fontSize: "10px", padding: "2px 7px", borderRadius: "5px", fontWeight: "600",
                    background: doc.visibility === "PUBLIC" ? "rgba(16,185,129,0.1)" : doc.visibility === "PRIVATE" ? "rgba(239,68,68,0.1)" : "rgba(59,130,246,0.1)",
                    color:      doc.visibility === "PUBLIC" ? "#10b981"               : doc.visibility === "PRIVATE" ? "#ef4444"               : "#3b82f6",
                  }}>
                    {doc.visibility}
                  </span>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
                  <a href={doc.s3Url} target="_blank" rel="noopener noreferrer"
                    style={{ flex: 1, padding: "8px", borderRadius: "8px", textAlign: "center", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#3b82f6", fontSize: "12px", fontWeight: "600", textDecoration: "none" }}>
                    View
                  </a>

                  {userCanEdit && (
                    <button onClick={() => handleDelete(doc._id)} disabled={deletingId === doc._id}
                      style={{ flex: 1, padding: "8px", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
                      {deletingId === doc._id ? "..." : "Delete"}
                    </button>
                  )}

                  {!userCanEdit && (
                    <div style={{ flex: 1, padding: "8px", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", color: "var(--color-text-muted)", fontSize: "11px", textAlign: "center" }}>
                      Read only
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Upload Modal ── */}
      {showUploadModal && pendingFile && (
        <Modal onClose={() => { setShowUploadModal(false); setPendingFile(null); }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "6px" }}>Upload Document</h2>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "20px" }}>Configure your document before uploading</p>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--color-border)", marginBottom: "20px" }}>
            <span style={{ fontSize: "24px" }}>{getFileIcon(pendingFile.name.split(".").pop() ?? "").icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "13px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pendingFile.name}</p>
              <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{formatSize(pendingFile.size)}</p>
            </div>
          </div>

          <Field label="Department">
            <select value={uploadForm.departmentId} onChange={(e) => setUploadForm(p => ({ ...p, departmentId: e.target.value }))} style={inputStyle}>
              <option value="">All Departments (Public)</option>
              {departments.map(d => <option key={d._id} value={d._id}>{d.icon} {d.name}</option>)}
            </select>
            <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>
              Select "All Departments" to make it visible to everyone
            </p>
          </Field>

          <Field label="Visibility">
            <select value={uploadForm.visibility} onChange={(e) => setUploadForm(p => ({ ...p, visibility: e.target.value }))} style={inputStyle}>
              <option value="PUBLIC">🌐 Public — Everyone can see</option>
              <option value="DEPARTMENT">🏢 Department — Only dept members</option>
              <option value="PRIVATE">🔒 Private — Only me</option>
            </select>
          </Field>

          <Field label="Description (optional)">
            <textarea value={uploadForm.description} onChange={(e) => setUploadForm(p => ({ ...p, description: e.target.value }))}
              style={{ ...inputStyle, minHeight: "70px", resize: "vertical" } as React.CSSProperties}
              placeholder="What is this document about?" />
          </Field>

          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
            <button onClick={() => { setShowUploadModal(false); setPendingFile(null); }}
              style={{ flex: 1, padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "14px" }}>
              Cancel
            </button>
            <button onClick={handleUpload} className="gradient-button" style={{ flex: 1, padding: "10px", fontSize: "14px" }}>
              Upload to S3 ⬆
            </button>
          </div>
        </Modal>
      )}

      {/* ── Edit Modal ── */}
      {editingDoc && (
        <Modal onClose={() => setEditingDocId(null)}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "6px" }}>Edit Document</h2>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "20px" }}>
            Update scope and visibility for this document
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--color-border)", marginBottom: "20px" }}>
            <span style={{ fontSize: "24px" }}>{getFileIcon(editingDoc.fileType).icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "13px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{editingDoc.originalName}</p>
              <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{editingDoc.fileType.toUpperCase()} · {formatSize(editingDoc.size)}</p>
            </div>
          </div>

          <Field label="Department">
            <select value={editForm.departmentId} onChange={(e) => setEditForm(p => ({ ...p, departmentId: e.target.value }))} style={inputStyle}>
              <option value="">No Department</option>
              {departments.map(d => <option key={d._id} value={d._id}>{d.icon} {d.name}</option>)}
            </select>
          </Field>

          <Field label="Visibility">
            <select value={editForm.visibility} onChange={(e) => setEditForm(p => ({ ...p, visibility: e.target.value }))} style={inputStyle}>
              <option value="PUBLIC">🌐 Public — Everyone can see</option>
              <option value="DEPARTMENT">🏢 Department — Only dept members</option>
              <option value="PRIVATE">🔒 Private — Only me</option>
            </select>
          </Field>

          <Field label="Description (optional)">
            <textarea value={editForm.description} onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))}
              style={{ ...inputStyle, minHeight: "70px", resize: "vertical" } as React.CSSProperties}
              placeholder="What is this document about?" />
          </Field>

          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
            <button onClick={() => setEditingDocId(null)}
              style={{ flex: 1, padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "14px" }}>
              Cancel
            </button>
            <button onClick={handleEdit} disabled={isEditing} className="gradient-button" style={{ flex: 1, padding: "10px", fontSize: "14px" }}>
              {isEditing ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </Modal>
      )}

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.6; cursor: pointer; }
      `}</style>
    </DashboardLayout>
  );
}