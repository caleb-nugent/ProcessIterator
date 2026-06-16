"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Folder, FolderOpen, Plus, ChevronRight, ChevronDown,
  LayoutDashboard, Layers, Menu, X,
} from "lucide-react";
import { FolderWithCounts } from "@/types";
import { NewFolderModal } from "../modals/NewFolderModal";

interface SidebarProps {
  folders: FolderWithCounts[];
  onFolderCreated: (folder: FolderWithCounts) => void;
  selectedFolderId?: string | null;
  totalProcesses: number;
}

function FolderItem({
  folder, depth = 0, selectedFolderId, onNavigate,
}: {
  folder: FolderWithCounts;
  depth?: number;
  selectedFolderId?: string | null;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const hasChildren = folder.children?.length > 0;
  const isSelected = selectedFolderId === folder.id;

  return (
    <div>
      <div
        className="flex items-center gap-2 rounded text-sm transition-colors group"
        style={{
          paddingLeft: `${12 + depth * 16}px`,
          paddingRight: "12px",
          paddingTop: "8px",
          paddingBottom: "8px",
          background: isSelected ? "var(--cream-dark)" : "transparent",
          color: isSelected ? "var(--black)" : "var(--gray)",
        }}
      >
        {hasChildren ? (
          <button onClick={() => setOpen(!open)} className="shrink-0">
            {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : (
          <span className="w-3 shrink-0" />
        )}
        {open ? (
          <FolderOpen size={14} className="shrink-0" style={{ color: folder.color }} />
        ) : (
          <Folder size={14} className="shrink-0" style={{ color: folder.color }} />
        )}
        <Link
          href={`/dashboard?folder=${folder.id}`}
          className="flex-1 truncate"
          onClick={onNavigate}
        >
          {folder.name}
        </Link>
        <span className="text-xs opacity-50">{folder._count.processes}</span>
      </div>
      {open && hasChildren && (
        <div>
          {folder.children.map((child) => (
            <FolderItem key={child.id} folder={child} depth={depth + 1} selectedFolderId={selectedFolderId} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarContent({
  folders, onFolderCreated, selectedFolderId, totalProcesses, onNavigate, onShowNewFolder,
}: SidebarProps & { onNavigate?: () => void; onShowNewFolder: () => void }) {
  const pathname = usePathname();
  const rootFolders = folders.filter((f) => !f.parentId);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-sm flex items-center justify-center" style={{ background: "var(--orange)" }}>
            <span className="text-white font-bold text-xs">PI</span>
          </div>
          <span className="font-bold text-sm" style={{ color: "var(--black)" }}>ProcessIterator</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-colors mb-1"
          style={{
            background: pathname === "/dashboard" && !selectedFolderId ? "var(--cream-dark)" : "transparent",
            color: pathname === "/dashboard" && !selectedFolderId ? "var(--black)" : "var(--gray)",
          }}
        >
          <LayoutDashboard size={14} />
          <span className="flex-1">All Processes</span>
          <span className="text-xs opacity-50">{totalProcesses}</span>
        </Link>

        <Link
          href="/dashboard?folder=null"
          onClick={onNavigate}
          className="flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-colors mb-3"
          style={{
            background: selectedFolderId === "null" ? "var(--cream-dark)" : "transparent",
            color: selectedFolderId === "null" ? "var(--black)" : "var(--gray)",
          }}
        >
          <Layers size={14} />
          <span>Uncategorized</span>
        </Link>

        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--gray)" }}>Folders</span>
          <button onClick={onShowNewFolder} className="p-0.5 rounded hover:bg-[var(--cream-dark)] transition-colors" style={{ color: "var(--gray)" }}>
            <Plus size={14} />
          </button>
        </div>

        {rootFolders.map((folder) => (
          <FolderItem key={folder.id} folder={folder} selectedFolderId={selectedFolderId} onNavigate={onNavigate} />
        ))}

        {rootFolders.length === 0 && (
          <p className="px-3 text-xs" style={{ color: "var(--gray)" }}>No folders yet</p>
        )}
      </nav>

    </div>
  );
}

export function Sidebar(props: SidebarProps) {
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex w-60 shrink-0 flex-col h-full border-r"
        style={{ background: "var(--cream)", borderColor: "var(--border)" }}
      >
        <SidebarContent {...props} onShowNewFolder={() => setShowNewFolder(true)} />
      </aside>

      {/* Mobile top bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 border-b"
        style={{ background: "var(--cream)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-sm flex items-center justify-center" style={{ background: "var(--orange)" }}>
            <span className="text-white font-bold text-xs">PI</span>
          </div>
          <span className="font-bold text-sm" style={{ color: "var(--black)" }}>ProcessIterator</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded"
          style={{ color: "var(--black)" }}
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 flex flex-col transition-transform duration-300"
        style={{
          background: "var(--cream)",
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          borderRight: `1px solid var(--border)`,
        }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-sm flex items-center justify-center" style={{ background: "var(--orange)" }}>
              <span className="text-white font-bold text-xs">PI</span>
            </div>
            <span className="font-bold text-sm" style={{ color: "var(--black)" }}>ProcessIterator</span>
          </div>
          <button onClick={() => setMobileOpen(false)} style={{ color: "var(--gray)" }}>
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarContent
            {...props}
            onNavigate={() => setMobileOpen(false)}
            onShowNewFolder={() => { setShowNewFolder(true); setMobileOpen(false); }}
          />
        </div>
      </aside>

      {showNewFolder && (
        <NewFolderModal
          onClose={() => setShowNewFolder(false)}
          onCreated={(f) => { props.onFolderCreated(f); setShowNewFolder(false); }}
        />
      )}
    </>
  );
}
