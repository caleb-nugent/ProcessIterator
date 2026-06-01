"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Folder,
  FolderOpen,
  Plus,
  ChevronRight,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Layers,
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
  folder,
  depth = 0,
  selectedFolderId,
}: {
  folder: FolderWithCounts;
  depth?: number;
  selectedFolderId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const hasChildren = folder.children?.length > 0;
  const isSelected = selectedFolderId === folder.id;

  return (
    <div>
      <Link
        href={`/dashboard?folder=${folder.id}`}
        className="flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors group"
        style={{
          paddingLeft: `${12 + depth * 16}px`,
          background: isSelected ? "var(--cream-dark)" : "transparent",
          color: isSelected ? "var(--black)" : "var(--gray)",
        }}
        onClick={(e) => { if (hasChildren) { e.preventDefault(); setOpen(!open); } }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
            className="shrink-0"
          >
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
        <Link href={`/dashboard?folder=${folder.id}`} className="flex-1 truncate hover:text-[var(--black)] transition-colors">
          {folder.name}
        </Link>
        <span className="text-xs opacity-50">{folder._count.processes}</span>
      </Link>
      {open && hasChildren && (
        <div>
          {folder.children.map((child) => (
            <FolderItem key={child.id} folder={child} depth={depth + 1} selectedFolderId={selectedFolderId} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ folders, onFolderCreated, selectedFolderId, totalProcesses }: SidebarProps) {
  const [showNewFolder, setShowNewFolder] = useState(false);
  const pathname = usePathname();

  const rootFolders = folders.filter((f) => !f.parentId);

  return (
    <>
      <aside
        className="w-60 shrink-0 flex flex-col h-full border-r"
        style={{ background: "var(--cream)", borderColor: "var(--border)" }}
      >
        {/* Logo */}
        <div className="px-4 py-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-sm flex items-center justify-center" style={{ background: "var(--orange)" }}>
              <span className="text-white font-bold text-xs">PI</span>
            </div>
            <span className="font-bold text-sm" style={{ color: "var(--black)" }}>ProcessIterator</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <Link
            href="/dashboard"
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
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--gray)" }}>
              Folders
            </span>
            <button
              onClick={() => setShowNewFolder(true)}
              className="p-0.5 rounded hover:bg-[var(--cream-dark)] transition-colors"
              style={{ color: "var(--gray)" }}
            >
              <Plus size={14} />
            </button>
          </div>

          {rootFolders.map((folder) => (
            <FolderItem key={folder.id} folder={folder} selectedFolderId={selectedFolderId} />
          ))}

          {rootFolders.length === 0 && (
            <p className="px-3 text-xs" style={{ color: "var(--gray)" }}>
              No folders yet
            </p>
          )}
        </nav>

        {/* Sign out */}
        <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 w-full px-3 py-2 rounded text-sm transition-colors"
            style={{ color: "var(--gray)" }}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {showNewFolder && (
        <NewFolderModal
          onClose={() => setShowNewFolder(false)}
          onCreated={(f) => { onFolderCreated(f); setShowNewFolder(false); }}
        />
      )}
    </>
  );
}
