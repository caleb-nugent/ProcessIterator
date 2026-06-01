"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Folder, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { NewProcessModal } from "@/components/modals/NewProcessModal";
import { FolderWithCounts, ProcessWithCounts } from "@/types";

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "var(--cream)" }}><div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--orange)", borderTopColor: "transparent" }} /></div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedFolderId = searchParams.get("folder");

  const [folders, setFolders] = useState<FolderWithCounts[]>([]);
  const [processes, setProcesses] = useState<ProcessWithCounts[]>([]);
  const [sharedProcesses, setSharedProcesses] = useState<ProcessWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProcess, setShowNewProcess] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/folders").then((r) => r.json()).then(setFolders);
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    setLoading(true);
    const url = selectedFolderId
      ? `/api/processes?folderId=${selectedFolderId}`
      : "/api/processes";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setProcesses(data.own ?? []);
        setSharedProcesses(data.shared ?? []);
        setLoading(false);
      });
  }, [status, selectedFolderId]);

  const filtered = processes.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const filteredShared = sharedProcesses.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const currentFolder = folders.find((f) => f.id === selectedFolderId);
  const totalProcesses = processes.length + sharedProcesses.length;

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--cream)" }}>
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--orange)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: "var(--cream)" }}>
      <Sidebar
        folders={folders}
        onFolderCreated={(f) => setFolders((prev) => [...prev, f])}
        selectedFolderId={selectedFolderId}
        totalProcesses={totalProcesses}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--black)" }}>
                {currentFolder ? currentFolder.name : selectedFolderId === "null" ? "Uncategorized" : "All Processes"}
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--gray)" }}>
                {session?.user?.name ? `Welcome back, ${session.user.name}` : "Build and iterate your SOPs"}
              </p>
            </div>
            <button
              onClick={() => setShowNewProcess(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded font-semibold text-sm transition-colors"
              style={{ background: "var(--black)", color: "white" }}
            >
              <Plus size={16} />
              New Process
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--gray)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm outline-none"
              style={{ background: "white", borderColor: "var(--border)", color: "var(--black)" }}
              placeholder="Search processes…"
            />
          </div>

          {loading ? (
            <div className="text-center py-16" style={{ color: "var(--gray)" }}>Loading…</div>
          ) : (
            <>
              {/* Own processes */}
              {filtered.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {filtered.map((p) => (
                    <ProcessCard key={p.id} process={p} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-xl mb-8"
                  style={{ borderColor: "var(--border)" }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: "var(--cream-dark)" }}>
                    <Plus size={24} style={{ color: "var(--orange)" }} />
                  </div>
                  <p className="font-semibold mb-1" style={{ color: "var(--black)" }}>No processes yet</p>
                  <p className="text-sm mb-4" style={{ color: "var(--gray)" }}>Create your first SOP to get started</p>
                  <button
                    onClick={() => setShowNewProcess(true)}
                    className="px-4 py-2 rounded text-sm font-semibold"
                    style={{ background: "var(--orange)", color: "white" }}
                  >
                    Create process
                  </button>
                </div>
              )}

              {/* Shared processes */}
              {filteredShared.length > 0 && !selectedFolderId && (
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--gray)" }}>
                    Shared with me
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredShared.map((p) => (
                      <ProcessCard key={p.id} process={p} shared />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {showNewProcess && (
        <NewProcessModal
          folders={folders}
          defaultFolderId={selectedFolderId !== "null" ? selectedFolderId : null}
          onClose={() => setShowNewProcess(false)}
          onCreated={(p) => {
            setProcesses((prev) => [p, ...prev]);
            setShowNewProcess(false);
            router.push(`/processes/${p.id}`);
          }}
        />
      )}
    </div>
  );
}

function ProcessCard({ process, shared }: { process: ProcessWithCounts; shared?: boolean }) {
  return (
    <Link
      href={`/processes/${process.id}`}
      className="group block p-5 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5"
      style={{ background: "white", borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          {process.folder && (
            <div className="flex items-center gap-1 mb-1">
              <Folder size={11} style={{ color: process.folder.color }} />
              <span className="text-xs" style={{ color: "var(--gray)" }}>{process.folder.name}</span>
            </div>
          )}
          <h3 className="font-semibold text-sm leading-snug truncate" style={{ color: "var(--black)" }}>
            {process.title}
          </h3>
        </div>
        <ArrowRight size={14} className="shrink-0 ml-2 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: "var(--orange)" }} />
      </div>

      {process.description && (
        <p className="text-xs mb-3 line-clamp-2" style={{ color: "var(--gray)" }}>{process.description}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--gray)" }}>
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "var(--orange)", color: "white" }}>
              {process._count.steps}
            </span>
            step{process._count.steps !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {shared && (
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--cream)", color: "var(--gray)" }}>
              shared
            </span>
          )}
          <span className="text-xs" style={{ color: "var(--gray)" }}>
            {new Date(process.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Link>
  );
}
