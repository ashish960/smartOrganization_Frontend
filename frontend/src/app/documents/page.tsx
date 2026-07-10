"use client";

import { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useSelector } from "react-redux";
import { AppRootState } from "@/store";
import Button from "@/components/ui/Button";

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
  id: string;
  _id?: string;
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
  const icons: Record<string, { icon: string; colorClass: string; bgClass: string }> = {
    pdf:  { icon: "📄", colorClass: "text-error",     bgClass: "bg-error/10 border border-error/20" },
    doc:  { icon: "📝", colorClass: "text-primary",   bgClass: "bg-primary/10 border border-primary/20" },
    docx: { icon: "📝", colorClass: "text-primary",   bgClass: "bg-primary/10 border border-primary/20" },
    xls:  { icon: "📊", colorClass: "text-success",   bgClass: "bg-success/10 border border-success/20" },
    xlsx: { icon: "📊", colorClass: "text-success",   bgClass: "bg-success/10 border border-success/20" },
    ppt:  { icon: "📋", colorClass: "text-warning",   bgClass: "bg-warning/10 border border-warning/20" },
    pptx: { icon: "📋", colorClass: "text-warning",   bgClass: "bg-warning/10 border border-warning/20" },
    png:  { icon: "🖼️", colorClass: "text-secondary", bgClass: "bg-secondary/10 border border-secondary/20" },
    jpg:  { icon: "🖼️", colorClass: "text-secondary", bgClass: "bg-secondary/10 border border-secondary/20" },
    jpeg: { icon: "🖼️", colorClass: "text-secondary", bgClass: "bg-secondary/10 border border-secondary/20" },
    csv:  { icon: "📈", colorClass: "text-secondary", bgClass: "bg-secondary/10 border border-secondary/20" },
    txt:  { icon: "📃", colorClass: "text-text-muted", bgClass: "bg-surface-hover border border-border" },
  };
  return icons[fileType?.toLowerCase()] ?? { icon: "📁", colorClass: "text-text-muted", bgClass: "bg-surface-hover border border-border" };
};

const selectClasses = "px-3 py-2 rounded-lg bg-surface border border-border text-text-primary text-[13px] cursor-pointer outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all";

const inputClasses = "w-full px-4 py-3 rounded-xl bg-surface border border-border text-text-primary text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all";

// ── Modal ──────────────────────────────────────────────────────────────────
function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-5" onClick={onClose}>
      <div className="bg-surface rounded-2xl border border-border p-7 w-full max-w-[480px] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-[11px] font-bold text-text-muted mb-1.5 uppercase tracking-wider">{label}</label>
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
    if (token) load();
    return () => { cancelled = true; };
  }, [token, refresh]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (user?.email && user.email !== "owner@smartorg.com") {
      if (file.size > 1024 * 1024) {
        setError("Demo Mode: You are only allowed to upload files smaller than 1 MB to conserve S3 storage.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      const myUploadedCount = documents.filter(d => d.uploadedBy?._id?.toString() === (user?.id || user?._id)?.toString()).length;
      if (myUploadedCount >= 3) {
        setError("Demo Mode: You have reached the maximum limit of 3 uploaded documents.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
    }

    setPendingFile(file);
    setShowUploadModal(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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

  const canEdit = (doc: DocumentFile) =>
    user?.role === "ORG_ADMIN" || 
    doc.uploadedBy?._id?.toString() === (user?.id || user?._id)?.toString();

  const myUploads = documents.filter(d => 
    d.uploadedBy?._id?.toString() === (user?.id || user?._id)?.toString()
  );
  const sourceList = activeTab === "mine" ? myUploads : documents;

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

  return (
    <DashboardLayout title="Documents" subtitle="Upload and manage your organization's files">

      {successMsg && (
        <div className="fixed top-20 right-6 z-[999] px-5 py-3 rounded-xl bg-success/10 border border-success/30 text-success text-sm font-medium backdrop-blur-md shadow-lg animate-fade-in">
          ✅ {successMsg}
        </div>
      )}
      {error && (
        <div className="fixed top-20 right-6 z-[999] px-5 py-3 rounded-xl bg-error/10 border border-error/30 text-error text-sm font-medium backdrop-blur-md shadow-lg">
          ❌ {error}
          <button onClick={() => setError(null)} className="ml-3 text-error hover:opacity-75 transition-opacity">✕</button>
        </div>
      )}

      {/* Top row */}
      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
        <input
          type="text" placeholder="Search documents..." value={filters.search}
          onChange={(e) => setFilter("search", e.target.value)}
          className="flex-1 min-w-[200px] max-w-[360px] px-4 py-2.5 rounded-xl bg-surface border border-border text-text-primary text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-sm"
        />
        <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.gif,.webp" />
        <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} variant="primary" size="sm">
          {isUploading ? "Uploading..." : "⬆ Upload File"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4 border-b border-border pb-0">
        <button
          className={`px-4 py-2 rounded-t-lg text-sm font-semibold cursor-pointer transition-all border-b-2 ${
            activeTab === "all"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-text-muted hover:text-text-primary hover:bg-surface-hover"
          }`}
          onClick={() => setActiveTab("all")}
        >
          All Documents
          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
            activeTab === "all" ? "bg-primary/20 text-primary" : "bg-border text-text-muted"
          }`}>
            {documents.length}
          </span>
        </button>
        <button
          className={`px-4 py-2 rounded-t-lg text-sm font-semibold cursor-pointer transition-all border-b-2 ${
            activeTab === "mine"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-text-muted hover:text-text-primary hover:bg-surface-hover"
          }`}
          onClick={() => setActiveTab("mine")}
        >
          My Uploads
          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
            activeTab === "mine" ? "bg-primary/20 text-primary" : "bg-border text-text-muted"
          }`}>
            {myUploads.length}
          </span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-5 px-4 py-3 rounded-2xl bg-surface/50 border border-border flex-wrap backdrop-blur-sm shadow-sm">
        <span className="text-xs text-text-muted font-bold tracking-wider mr-1">
          FILTERS {activeFilterCount > 0 && (
            <span className="bg-primary text-white rounded-full px-2 py-0.5 ml-1.5 text-[10px] font-bold">{activeFilterCount}</span>
          )}
        </span>

        <select value={filters.fileType} onChange={(e) => setFilter("fileType", e.target.value)} className={selectClasses}>
          <option value="all">All Types</option>
          <option value="pdf">📄 PDF</option>
          <option value="word">📝 Word</option>
          <option value="excel">📊 Excel / CSV</option>
          <option value="image">🖼️ Images</option>
          <option value="other">📁 Other</option>
        </select>

        <select value={filters.department} onChange={(e) => setFilter("department", e.target.value)} className={selectClasses}>
          <option value="all">All Departments</option>
          <option value="none">No Department</option>
          {departments.map(d => <option key={d._id} value={d._id}>{d.icon} {d.name}</option>)}
        </select>

        <select value={filters.visibility} onChange={(e) => setFilter("visibility", e.target.value)} className={selectClasses}>
          <option value="all">All Visibility</option>
          <option value="PUBLIC">🌐 Public</option>
          <option value="DEPARTMENT">🏢 Department</option>
          <option value="PRIVATE">🔒 Private</option>
        </select>

        <select value={filters.aiStatus} onChange={(e) => setFilter("aiStatus", e.target.value)} className={selectClasses}>
          <option value="all">All AI Status</option>
          <option value="ready">✓ AI Ready</option>
          <option value="pending">⏳ Pending AI</option>
        </select>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-text-muted font-medium">From</span>
          <input type="date" value={filters.dateFrom} onChange={(e) => setFilter("dateFrom", e.target.value)}
            className="px-2 py-1.5 rounded-lg bg-surface border border-border text-text-primary text-[13px] outline-none" />
          <span className="text-xs text-text-muted font-medium">To</span>
          <input type="date" value={filters.dateTo} onChange={(e) => setFilter("dateTo", e.target.value)}
            className="px-2 py-1.5 rounded-lg bg-surface border border-border text-text-primary text-[13px] outline-none"
            min={filters.dateFrom || undefined} />
          {activeDateFilter && (
            <button onClick={() => { setFilter("dateFrom", ""); setFilter("dateTo", ""); }}
              className="px-2 py-1.5 rounded-md bg-error/10 border border-error/20 text-error cursor-pointer text-xs font-bold hover:bg-error/20 transition-all">✕</button>
          )}
        </div>

        <select value={filters.sortBy} onChange={(e) => setFilter("sortBy", e.target.value)} className={selectClasses}>
          <option value="newest">↓ Newest</option>
          <option value="oldest">↑ Oldest</option>
          <option value="name">A→Z Name</option>
          <option value="size">Largest First</option>
        </select>

        {activeFilterCount > 0 && (
          <button onClick={clearAllFilters}
            className="px-3 py-1.5 rounded-lg text-xs bg-error/10 border border-error/20 text-error cursor-pointer font-bold hover:bg-error/20 transition-all">
            Clear All
          </button>
        )}
      </div>

      {/* Upload progress */}
      {isUploading && (
        <div className="mb-5 p-4 rounded-xl bg-surface border border-border">
          <div className="flex justify-between mb-2">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Uploading to S3...</span>
            <span className="text-xs font-bold text-primary">{uploadProgress}%</span>
          </div>
          <div className="h-2 rounded bg-surface-hover overflow-hidden border border-border">
            <div
              className="h-full rounded bg-gradient-to-br from-primary to-secondary transition-[width] duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-4 mb-6 flex-wrap">
        {[
          { label: "Total Files", value: sourceList.length,                                                              colorClass: "text-primary", bg: "bg-primary/5" },
          { label: "Showing",     value: filtered.length,                                                                colorClass: "text-secondary", bg: "bg-secondary/5" },
          { label: "PDFs",        value: sourceList.filter(d => d.fileType === "pdf").length,                            colorClass: "text-error", bg: "bg-error/5" },
          { label: "Images",      value: sourceList.filter(d => ["png","jpg","jpeg"].includes(d.fileType)).length,       colorClass: "text-success", bg: "bg-success/5" },
        ].map(s => (
          <div key={s.label} className={`px-5 py-3 rounded-xl ${s.bg} border border-border flex items-center gap-2.5 backdrop-blur-sm shadow-sm`}>
            <span className={`text-2xl font-bold ${s.colorClass}`}>{s.value}</span>
            <span className="text-xs font-semibold text-text-muted">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Document grid */}
      {isLoading ? (
        <div className="flex justify-center py-20 opacity-50">
          <div className="w-8 h-8 rounded-full border-2 border-border border-t-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-5 gap-4 opacity-50">
          <span className="text-5xl">📂</span>
          <p className="text-lg font-semibold text-text-primary text-center">
            {filters.search || activeFilterCount > 0
              ? "No documents match your filters"
              : activeTab === "mine"
              ? "You haven't uploaded any documents yet"
              : "No documents yet"}
          </p>
          <p className="text-sm text-text-muted text-center">
            {filters.search || activeFilterCount > 0
              ? "Try adjusting your filters"
              : "Click 'Upload File' to add your first document"}
          </p>
          {activeFilterCount > 0 && (
            <Button onClick={clearAllFilters} variant="primary" size="sm">
              Clear all filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(doc => {
            const fileInfo    = getFileIcon(doc.fileType);
            const userCanEdit = canEdit(doc);
            const isMyDoc = doc.uploadedBy?._id?.toString() === (user?.id || user?._id)?.toString();
            return (
              <div key={doc._id}
                className={`p-5 rounded-2xl bg-surface/50 border border-border flex flex-col gap-4 transition-all duration-300 hover:border-border-hover hover:shadow-md relative ${
                  deletingId === doc._id ? "opacity-50" : "opacity-100"
                }`}
              >
                {/* Edit icon */}
                {userCanEdit && (
                  <button
                    onClick={() => openEditModal(doc)}
                    title="Edit document"
                    className="absolute top-3.5 right-3.5 w-7 h-7 rounded-lg bg-surface hover:bg-surface-hover border border-border text-text-primary cursor-pointer flex items-center justify-center transition-colors"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                )}

                {/* File header */}
                <div className={`flex items-center gap-3.5 ${userCanEdit ? "pr-8" : ""}`}>
                  <div className={`w-12 h-12 rounded-xl ${fileInfo.bgClass} flex items-center justify-center text-2xl shrink-0 shadow-sm`}>
                    {fileInfo.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate text-text-primary">{doc.originalName}</p>
                    <p className="text-[10px] text-text-muted mt-0.5 font-medium">{doc.fileType.toUpperCase()} · {formatSize(doc.size)}</p>
                  </div>
                </div>

                {/* Department badge + My Upload tag */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {doc.department && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/5 border border-primary/10">
                      <span className="text-[11px]">{doc.department.icon}</span>
                      <span className="text-[11px] text-primary font-bold">{doc.department.name}</span>
                    </div>
                  )}
                  {isMyDoc && activeTab === "all" && (
                    <div className="px-2.5 py-1 rounded-lg bg-secondary/5 border border-secondary/10 text-[10px] text-secondary font-bold">
                      My Upload
                    </div>
                  )}
                </div>

                {/* AI status + date */}
                <div className="flex items-center justify-between border-t border-border/50 pt-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                    doc.aiProcessingStatus === "COMPLETED"
                      ? "bg-success/10 text-success border border-success/20"
                      : "bg-warning/10 text-warning border border-warning/20"
                  }`}>
                    {doc.aiProcessingStatus === "COMPLETED" ? "✓ AI Ready" : "⏳ Pending AI"}
                  </span>
                  <span className="text-[10px] text-text-muted font-medium">{formatDate(doc.createdAt)}</span>
                </div>

                {/* Uploader + visibility */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-text-muted font-medium">
                    {isMyDoc ? "Uploaded by You" : `By ${doc.uploadedBy?.name ?? "Unknown"}`}
                  </p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                    doc.visibility === "PUBLIC"
                      ? "bg-success/10 text-success border border-success/20"
                      : doc.visibility === "PRIVATE"
                      ? "bg-error/10 text-error border border-error/20"
                      : "bg-primary/10 text-primary border border-primary/20"
                  }`}>
                    {doc.visibility}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-auto pt-2 border-t border-border/50">
                  <a href={doc.s3Url} target="_blank" rel="noopener noreferrer"
                    className="flex-1 py-2 rounded-lg text-center bg-primary/15 border border-primary/30 text-primary text-xs font-bold no-underline hover:bg-primary/25 transition-colors">
                    View
                  </a>

                  {userCanEdit && (
                    <Button onClick={() => handleDelete(doc._id)} disabled={deletingId === doc._id} variant="danger" size="sm" className="flex-1">
                      {deletingId === doc._id ? "..." : "Delete"}
                    </Button>
                  )}

                  {!userCanEdit && (
                    <div className="flex-1 py-2 rounded-lg bg-surface-hover border border-border text-text-muted text-[10px] text-center font-medium self-center">
                      Read Only
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Upload File Configuration */}
      {showUploadModal && pendingFile && (
        <Modal onClose={() => { setShowUploadModal(false); setPendingFile(null); }}>
          <h2 className="text-lg font-bold mb-1 text-text-primary">Upload Document</h2>
          <p className="text-xs text-text-muted mb-5">Configure your document before uploading</p>

          {user?.email && user.email !== "owner@smartorg.com" && (
            <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-warning/10 border border-warning/20 text-warning text-xs font-semibold select-none shadow-sm">
              ⚠️ Demo Mode Active: You can only upload files smaller than 1 MB, and are limited to 3 total documents.
            </div>
          )}

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-hover border border-border mb-5">
            <span className="text-3xl">{getFileIcon(pendingFile.name.split(".").pop() ?? "").icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-text-primary">{pendingFile.name}</p>
              <p className="text-[10px] text-text-muted mt-0.5">{formatSize(pendingFile.size)}</p>
            </div>
          </div>

          <Field label="Department">
            <select value={uploadForm.departmentId} onChange={(e) => setUploadForm(p => ({ ...p, departmentId: e.target.value }))} className={inputClasses}>
              <option value="">All Departments (Public)</option>
              {departments.map(d => <option key={d._id} value={d._id}>{d.icon} {d.name}</option>)}
            </select>
            <p className="text-[10px] text-text-muted mt-1">
              Select a department to assign this document, or leave public.
            </p>
          </Field>

          <Field label="Visibility">
            <select value={uploadForm.visibility} onChange={(e) => setUploadForm(p => ({ ...p, visibility: e.target.value }))} className={inputClasses}>
              <option value="PUBLIC">🌐 Public — Everyone can see</option>
              <option value="DEPARTMENT">🏢 Department — Only dept members</option>
              <option value="PRIVATE">🔒 Private — Only me</option>
            </select>
          </Field>

          <Field label="Description (optional)">
            <textarea value={uploadForm.description} onChange={(e) => setUploadForm(p => ({ ...p, description: e.target.value }))}
              className={`${inputClasses} min-h-[70px] resize-y`}
              placeholder="What is this document about?" />
          </Field>

          <div className="flex gap-2 mt-2">
            <Button onClick={() => { setShowUploadModal(false); setPendingFile(null); }} variant="secondary" className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleUpload} variant="primary" className="flex-1">
              Upload ⬆
            </Button>
          </div>
        </Modal>
      )}

      {/* Modal: Edit File Configuration */}
      {editingDoc && (
        <Modal onClose={() => setEditingDocId(null)}>
          <h2 className="text-lg font-bold mb-1 text-text-primary">Edit Document</h2>
          <p className="text-xs text-text-muted mb-5">Update scope and visibility for this document</p>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-hover border border-border mb-5">
            <span className="text-3xl">{getFileIcon(editingDoc.fileType).icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-text-primary">{editingDoc.originalName}</p>
              <p className="text-[10px] text-text-muted mt-0.5">{editingDoc.fileType.toUpperCase()} · {formatSize(editingDoc.size)}</p>
            </div>
          </div>

          <Field label="Department">
            <select value={editForm.departmentId} onChange={(e) => setEditForm(p => ({ ...p, departmentId: e.target.value }))} className={inputClasses}>
              <option value="">No Department</option>
              {departments.map(d => <option key={d._id} value={d._id}>{d.icon} {d.name}</option>)}
            </select>
          </Field>

          <Field label="Visibility">
            <select value={editForm.visibility} onChange={(e) => setEditForm(p => ({ ...p, visibility: e.target.value }))} className={inputClasses}>
              <option value="PUBLIC">🌐 Public — Everyone can see</option>
              <option value="DEPARTMENT">🏢 Department — Only dept members</option>
              <option value="PRIVATE">🔒 Private — Only me</option>
            </select>
          </Field>

          <Field label="Description (optional)">
            <textarea value={editForm.description} onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))}
              className={`${inputClasses} min-h-[70px] resize-y`}
              placeholder="What is this document about?" />
          </Field>

          <div className="flex gap-2 mt-2">
            <Button onClick={() => setEditingDocId(null)} variant="secondary" className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isEditing} variant="primary" className="flex-1">
              {isEditing ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </Modal>
      )}

    </DashboardLayout>
  );
}