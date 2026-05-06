import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface MilestoneStats {
  totalActions: number;
  totalProjects: number;
}

const MILESTONES = [
  {
    key: "first_run",
    actionsThreshold: 1,
    title: "First AI run complete",
    description: "You're off to a strong start. Keep building.",
  },
  {
    key: "run_5",
    actionsThreshold: 5,
    title: "5 AI runs — great momentum",
    description: "You're making real progress with IAttom Assist.",
  },
  {
    key: "run_10",
    actionsThreshold: 10,
    title: "Power user: 10 AI runs",
    description: "You're in the top tier. Consider upgrading for more credits.",
  },
  {
    key: "run_25",
    actionsThreshold: 25,
    title: "25 AI runs — incredible output",
    description: "You've generated a remarkable amount. Pro plan gives 10x the credits.",
  },
  {
    key: "run_50",
    actionsThreshold: 50,
    title: "50 AI runs — elite builder",
    description: "Exceptional usage. You're getting the most out of this platform.",
  },
  {
    key: "first_project",
    projectsThreshold: 1,
    title: "First project created",
    description: "Your workspace is growing. Projects keep your work organized.",
  },
  {
    key: "project_5",
    projectsThreshold: 5,
    title: "5 projects — prolific creator",
    description: "You have a serious portfolio in the making.",
  },
] as const;

const STORAGE_KEY = "iattom_milestones_v1";

function loadSeen(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveSeen(seen: Record<string, boolean>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
  } catch {}
}

export function useMilestones(stats: MilestoneStats | undefined) {
  const { toast } = useToast();
  const seenRef = useRef<Record<string, boolean>>(loadSeen());
  const prevActionsRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!stats) return;
    const { totalActions, totalProjects } = stats;

    if (prevActionsRef.current === undefined) {
      prevActionsRef.current = totalActions;
      return;
    }

    const seen = seenRef.current;
    let changed = false;

    for (const milestone of MILESTONES) {
      if (seen[milestone.key]) continue;

      const actionsThreshold = "actionsThreshold" in milestone ? milestone.actionsThreshold : undefined;
      const projectsThreshold = "projectsThreshold" in milestone ? milestone.projectsThreshold : undefined;

      const reached =
        (actionsThreshold !== undefined && totalActions >= actionsThreshold) ||
        (projectsThreshold !== undefined && totalProjects >= projectsThreshold);

      if (reached) {
        seen[milestone.key] = true;
        changed = true;
        toast({
          title: milestone.title,
          description: milestone.description,
        });
        break;
      }
    }

    if (changed) {
      seenRef.current = seen;
      saveSeen(seen);
    }

    prevActionsRef.current = totalActions;
  }, [stats?.totalActions, stats?.totalProjects]);
}
