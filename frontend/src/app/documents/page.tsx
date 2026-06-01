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
  fileType: string;
  mimeType: string;
  size: number;
  s3Url: string;
  uploadedBy: { name: string; email: string };
  createdAt: string;
  visibility: string;
  aiProcessingStatus: string;
}

// ── Filter state ───────────────────────────────────────────────────────────
interface Filters {
  search: string;
  fileType: string;
  dateRange: string;
  visibility: string;
  aiStatus: string;
  sortBy: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
};

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

const isWithinDateRange = (dateStr: string, range: string): boolean => {
  if (range === "all") return true;
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = diff / (1000 * 60 * 60 * 24);
  if (range === "today") return days < 1;
  if (range === "7days") return days <= 7;
  if (range === "30days") return days <= 30;
  if (range === "3months") return days <= 90;
  return true;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// ── Filter Select Component ────────────────────────────────────────────────
function FilterSelect({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "8px 12px", borderRadius: "8px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid var(--color-border)",
        color: "var(--color-text)", fontSize: "13px",
        cursor: "pointer", outline: "none",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ background: "#1a1a2e" }}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ── Component ──────────────────────────────────────────────────────────────
export default function DocumentsPage() {
  const { token } = useSelector((state: AppRootState) => state.auth);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  const [filters, setFilters] = useState<Filters>({
    search: "",
    fileType: "all",
    dateRange: "all",
    visibility: "all",
    aiStatus: "all",
    sortBy: "newest",
  });

  const setFilter = (key: keyof Filters, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  // ── Fetch documents ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE}/documents`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!cancelled && data.success) setDocuments(data.data);
      } catch {
        if (!cancelled) setError("Failed to load documents");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [token, refresh]);

  // ── Upload ─────────────────────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 85) { clearInterval(progressInterval); return prev; }
        return prev + 10;
      });
    }, 200);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      clearInterval(progressInterval);
      if (data.success) {
        setUploadProgress(100);
        setSuccessMsg(`"${file.name}" uploaded successfully!`);
        setTimeout(() => { setSuccessMsg(null); setUploadProgress(0); }, 3000);
        setRefresh((p) => p + 1);
      } else {
        throw new Error(data.message || "Upload failed");
      }
    } catch (err: unknown) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────
  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    setDeletingId(docId);
    try {
      const res = await fetch(`${API_BASE}/documents/${docId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDocuments((prev) => prev.filter((d) => d._id !== docId));
        setSuccessMsg("Document deleted successfully");
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        throw new Error(data.message);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Apply filters + sort ───────────────────────────────────────────────
  const filtered = documents
    .filter((d) => {
      if (filters.search && !d.originalName.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.fileType !== "all") {
        const typeMap: Record<string, string[]> = {
          pdf: ["pdf"],
          word: ["doc", "docx"],
          excel: ["xls", "xlsx", "csv"],
          image: ["png", "jpg", "jpeg", "gif", "webp"],
          other: ["ppt", "pptx", "txt"],
        };
        if (!typeMap[filters.fileType]?.includes(d.fileType.toLowerCase())) return false;
      }
      if (!isWithinDateRange(d.createdAt, filters.dateRange)) return false;
      if (filters.visibility !== "all" && d.visibility !== filters.visibility) return false;
      if (filters.aiStatus !== "all") {
        if (filters.aiStatus === "ready" && d.aiProcessingStatus !== "COMPLETED") return false;
        if (filters.aiStatus === "pending" && d.aiProcessingStatus === "COMPLETED") return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (filters.sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (filters.sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (filters.sortBy === "name") return a.originalName.localeCompare(b.originalName);
      if (filters.sortBy === "size") return b.size - a.size;
      return 0;
    });

  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => k !== "search" && k !== "sortBy" && v !== "all"
  ).length;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <DashboardLayout title="Documents" subtitle="Upload and manage your organization's files">

      {/* Toasts */}
      {successMsg && (
        <div style={{
          position: "fixed", top: "80px", right: "24px", zIndex: 999,
          padding: "12px 20px", borderRadius: "10px",
          background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)",
          color: "#10b981", fontSize: "14px", fontWeight: "500",
          animation: "slideIn 0.3s ease",
        }}>✅ {successMsg}</div>
      )}
      {error && (
        <div style={{
          position: "fixed", top: "80px", right: "24px", zIndex: 999,
          padding: "12px 20px", borderRadius: "10px",
          background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
          color: "#ef4444", fontSize: "14px", fontWeight: "500",
        }}>
          ❌ {error}
          <button onClick={() => setError(null)} style={{ marginLeft: "12px", background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}>✕</button>
        </div>
      )}

      {/* ── Top row: search + upload ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search documents..."
          value={filters.search}
          onChange={(e) => setFilter("search", e.target.value)}
          style={{
            flex: 1, minWidth: "200px", maxWidth: "360px",
            padding: "10px 16px", borderRadius: "10px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)", fontSize: "14px", outline: "none",
          }}
        />
        <input ref={fileInputRef} type="file" onChange={handleFileSelect} style={{ display: "none" }}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.gif,.webp" />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="gradient-button"
          style={{ padding: "10px 20px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}
        >
          {isUploading ? "Uploading..." : "⬆ Upload File"}
        </button>
      </div>

      {/* ── Filter bar ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: "10px",
        marginBottom: "20px", flexWrap: "wrap",
        padding: "14px 16px", borderRadius: "12px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid var(--color-border)",
      }}>
        <span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: "600", marginRight: "4px" }}>
          FILTERS {activeFilterCount > 0 && (
            <span style={{ background: "#3b82f6", color: "#fff", borderRadius: "10px", padding: "1px 6px", marginLeft: "4px" }}>
              {activeFilterCount}
            </span>
          )}
        </span>

        <FilterSelect value={filters.fileType} onChange={(v) => setFilter("fileType", v)} options={[
          { value: "all", label: "All Types" },
          { value: "pdf", label: "📄 PDF" },
          { value: "word", label: "📝 Word" },
          { value: "excel", label: "📊 Excel / CSV" },
          { value: "image", label: "🖼️ Images" },
          { value: "other", label: "📁 Other" },
        ]} />

        <FilterSelect value={filters.dateRange} onChange={(v) => setFilter("dateRange", v)} options={[
          { value: "all", label: "All Time" },
          { value: "today", label: "Today" },
          { value: "7days", label: "Last 7 Days" },
          { value: "30days", label: "Last 30 Days" },
          { value: "3months", label: "Last 3 Months" },
        ]} />

        <FilterSelect value={filters.visibility} onChange={(v) => setFilter("visibility", v)} options={[
          { value: "all", label: "All Visibility" },
          { value: "PUBLIC", label: "🌐 Public" },
          { value: "DEPARTMENT", label: "🏢 Department" },
          { value: "PRIVATE", label: "🔒 Private" },
        ]} />

        <FilterSelect value={filters.aiStatus} onChange={(v) => setFilter("aiStatus", v)} options={[
          { value: "all", label: "All AI Status" },
          { value: "ready", label: "✓ AI Ready" },
          { value: "pending", label: "⏳ Pending AI" },
        ]} />

        <FilterSelect value={filters.sortBy} onChange={(v) => setFilter("sortBy", v)} options={[
          { value: "newest", label: "↓ Newest First" },
          { value: "oldest", label: "↑ Oldest First" },
          { value: "name", label: "A→Z Name" },
          { value: "size", label: "Largest First" },
        ]} />

        {activeFilterCount > 0 && (
          <button
            onClick={() => setFilters({ search: filters.search, fileType: "all", dateRange: "all", visibility: "all", aiStatus: "all", sortBy: "newest" })}
            style={{
              padding: "8px 12px", borderRadius: "8px", fontSize: "12px",
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              color: "#ef4444", cursor: "pointer", fontWeight: "600",
            }}
          >
            Clear Filters
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
            <div style={{
              height: "100%", borderRadius: "4px",
              background: "linear-gradient(135deg, #3b82f6, #a855f7)",
              width: `${uploadProgress}%`, transition: "width 0.2s ease",
            }}/>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        {[
          { label: "Total Files", value: documents.length, color: "#3b82f6" },
          { label: "Showing", value: filtered.length, color: "#a855f7" },
          { label: "PDFs", value: documents.filter(d => d.fileType === "pdf").length, color: "#ef4444" },
          { label: "Images", value: documents.filter(d => ["png","jpg","jpeg"].includes(d.fileType)).length, color: "#10b981" },
        ].map((stat) => (
          <div key={stat.label} style={{
            padding: "12px 20px", borderRadius: "10px",
            background: "rgba(255,255,255,0.02)", border: "1px solid var(--color-border)",
            display: "flex", alignItems: "center", gap: "10px",
          }}>
            <span style={{ fontSize: "20px", fontWeight: "700", color: stat.color }}>{stat.value}</span>
            <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Document grid */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px", opacity: 0.5 }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.1)",
            borderTop: "2px solid #3b82f6",
            animation: "spin 0.8s linear infinite",
          }}/>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "80px 20px", gap: "16px", opacity: 0.5,
        }}>
          <span style={{ fontSize: "48px" }}>📂</span>
          <p style={{ fontSize: "18px", fontWeight: "600" }}>
            {filters.search || activeFilterCount > 0 ? "No documents match your filters" : "No documents yet"}
          </p>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)" }}>
            {filters.search || activeFilterCount > 0 ? "Try adjusting your filters" : "Click 'Upload File' to add your first document"}
          </p>
          {activeFilterCount > 0 && (
            <button
              onClick={() => setFilters({ search: "", fileType: "all", dateRange: "all", visibility: "all", aiStatus: "all", sortBy: "newest" })}
              style={{
                padding: "8px 16px", borderRadius: "8px", fontSize: "13px",
                background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
                color: "#3b82f6", cursor: "pointer",
              }}
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
          {filtered.map((doc) => {
            const fileInfo = getFileIcon(doc.fileType);
            return (
              <div key={doc._id} style={{
                padding: "20px", borderRadius: "14px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid var(--color-border)",
                display: "flex", flexDirection: "column", gap: "12px",
                transition: "all 0.2s ease",
                opacity: deletingId === doc._id ? 0.5 : 1,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "44px", height: "44px", borderRadius: "10px",
                    background: fileInfo.bg, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: "22px", flexShrink: 0,
                  }}>
                    {fileInfo.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "13px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {doc.originalName}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                      {doc.fileType.toUpperCase()} · {formatSize(doc.size)}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{
                    fontSize: "11px", padding: "3px 8px", borderRadius: "6px",
                    background: doc.aiProcessingStatus === "COMPLETED" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                    color: doc.aiProcessingStatus === "COMPLETED" ? "#10b981" : "#f59e0b",
                    fontWeight: "600",
                  }}>
                    {doc.aiProcessingStatus === "COMPLETED" ? "✓ AI Ready" : "⏳ Pending AI"}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                    {formatDate(doc.createdAt)}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                    By {doc.uploadedBy?.name ?? "Unknown"}
                  </p>
                  <span style={{
                    fontSize: "10px", padding: "2px 7px", borderRadius: "5px", fontWeight: "600",
                    background: doc.visibility === "PUBLIC" ? "rgba(16,185,129,0.1)"
                      : doc.visibility === "PRIVATE" ? "rgba(239,68,68,0.1)" : "rgba(59,130,246,0.1)",
                    color: doc.visibility === "PUBLIC" ? "#10b981"
                      : doc.visibility === "PRIVATE" ? "#ef4444" : "#3b82f6",
                  }}>
                    {doc.visibility}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
                  <a href={doc.s3Url} target="_blank" rel="noopener noreferrer" style={{
                    flex: 1, padding: "8px", borderRadius: "8px", textAlign: "center",
                    background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
                    color: "#3b82f6", fontSize: "12px", fontWeight: "600",
                    textDecoration: "none", transition: "all 0.15s ease",
                  }}>
                    View
                  </a>
                  <button onClick={() => handleDelete(doc._id)} disabled={deletingId === doc._id} style={{
                    flex: 1, padding: "8px", borderRadius: "8px",
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                    color: "#ef4444", fontSize: "12px", fontWeight: "600",
                    cursor: "pointer", transition: "all 0.15s ease",
                  }}>
                    {deletingId === doc._id ? "..." : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        select option { background: #1a1a2e; }
      `}</style>
    </DashboardLayout>
  );
}