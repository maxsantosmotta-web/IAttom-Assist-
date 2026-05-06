import { motion } from "framer-motion";
import { Clock, Search, Megaphone, FileText, Sparkles, Video, CheckCircle, FolderOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useListHistory, getListHistoryQueryKey } from "@workspace/api-client-react";

const moduleIcons: Record<string, React.ElementType> = {
  campaign: Megaphone,
  content: FileText,
  creative: Sparkles,
  video_script: Video,
  product_discovery: Search,
  product_validation: CheckCircle,
  marketing: FolderOpen,
};

const moduleColors: Record<string, string> = {
  campaign: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  content: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  creative: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  video_script: "text-rose-400 bg-rose-400/10 border-rose-400/20",
  product_discovery: "text-primary bg-primary/10 border-primary/20",
  product_validation: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  marketing: "text-orange-400 bg-orange-400/10 border-orange-400/20",
};

function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

export function History() {
  const { data: history, isLoading } = useListHistory(
    { limit: 50 },
    { query: { queryKey: getListHistoryQueryKey({ limit: 50 }) } }
  );
  const [search, setSearch] = useState("");

  const filtered = (history ?? []).filter((h) =>
    h.action.toLowerCase().includes(search.toLowerCase()) ||
    h.module.toLowerCase().includes(search.toLowerCase()) ||
    (h.projectName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1">Activity Log</p>
        <h2 className="text-2xl font-bold text-white mb-1">History</h2>
        <p className="text-muted-foreground text-sm">A complete record of all actions taken across your workspace.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-testid="input-history-search"
            placeholder="Search history..."
            className="pl-10 bg-[#111111] border-white/5 focus-visible:ring-primary/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full bg-white/5 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Clock className="w-12 h-12 text-white/10 mb-4" />
          <p className="text-muted-foreground text-sm">No activity found.</p>
        </div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-2">
          {filtered.map((item) => {
            const Icon = moduleIcons[item.module] ?? Clock;
            const colorClass = moduleColors[item.module] ?? "text-muted-foreground bg-white/5 border-white/10";
            return (
              <motion.div key={item.id} variants={itemVariants}>
                <div
                  data-testid={`history-item-${item.id}`}
                  className="flex items-center gap-4 p-4 rounded-lg bg-[#111111] border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{item.action}</p>
                    {item.projectName && (
                      <p className="text-xs text-muted-foreground truncate">{item.projectName}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{timeAgo(item.createdAt)}</p>
                    <p className="text-xs text-muted-foreground/60 capitalize mt-0.5">{item.module.replace("_", " ")}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
