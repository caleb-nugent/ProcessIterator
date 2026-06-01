export interface UserSession {
  id: string;
  email: string;
  name?: string | null;
}

export interface FolderWithCounts {
  id: string;
  name: string;
  color: string;
  parentId: string | null;
  _count: { processes: number };
  children: FolderWithCounts[];
}

export interface ProcessWithCounts {
  id: string;
  title: string;
  description: string | null;
  folderId: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { steps: number };
  folder?: { id: string; name: string; color: string } | null;
}

export interface StepImage {
  id: string;
  stepId: string;
  url: string;
  name: string;
  createdAt: string;
}

export interface StepWithRuns {
  id: string;
  processId: string;
  title: string;
  description: string | null;
  order: number;
  runs: StepRun[];
  images: StepImage[];
}

export interface StepRun {
  id: string;
  stepId: string;
  durationMs: number | null;
  notes: string | null;
  completedAt: string;
}

export interface ProcessDetail {
  id: string;
  title: string;
  description: string | null;
  folderId: string | null;
  userId: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  steps: StepWithRuns[];
  folder?: { id: string; name: string; color: string } | null;
  shares: {
    id: string;
    permission: string;
    user: { id: string; name: string | null; email: string };
  }[];
}
