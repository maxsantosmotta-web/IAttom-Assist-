import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Search, Clock, User, RefreshCw, Trash2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useListAdminActivity, getListAdminActivityQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { translateAction, translateModule, translateDemoName } from "@/lib/eventTranslations";
import { useToast } from "@/hooks/use-toast";

const moduleColors: Record<string, string> = {
  campaign: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  content: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  creative: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  video_script: "text-rose-400 bg-rose-400/10 border-rose-400/20",
  product_discovery: "text-primary bg-primary/10 border-primary/20",
  product_validation: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  marketing: "text-orange-400 bg-orange-400/10 border-orange-400/20",
};

function timeAgo(date: string | Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "agora mesmo";
  if (seconds < 3600) return `há ${Math.floor(seconds / 60)}min`;
  if (seconds < 86400) return `há ${Math.floor(seconds / 3600)}h`;
  return new Date(date).toLocaleDateString("pt-BR");
}

const BASE = (import.meta.env.BASE_URL as string).replace(/\/$/, "");

async function adminFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    credentials: "include",
  });
}

export function AdminActivity() {
  const [search, setSearch] = useState("");
  const { data: activity, isLoading, isFetching, refetch } = useListAdminActivity(
    { limit: 100 },
    { query: { queryKey: getListAdminActivityQueryKey({ limit: 100 }), staleTime: 0 } },
  );
  const { toast } = useToast();

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId]           = useState<number | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [clearingAll, setClearingAll]         = useState(false);

  const filtered = (activity ?? []).filter((item) => {
    const q = search.toLowerCase();
    return (
      item.action.toLowerCase().includes(q) ||
      item.module.toLowerCase().includes(q) ||
      (item.userEmail ?? "").toLowerCase().includes(q) ||
      (item.projectName ?? "").toLowerCase().includes(q)
    );
  });

  const hasItems = (activity ?? []).length > 0;

  const handleDeleteItem = async (id: number) => {
    setDeletingId(id);
    setConfirmDeleteId(null);
    try {
      await adminFetch(`/api/admin/activity/${id}`, { method: "DELETE" });
      await refetch();
      toast({ description: "Atividade removida." });
    } catch {
      toast({ description: "Erro ao remover atividade.", variant: "destructive" });
    } finally { setDeletingId(null); }
  };

  const handleClearAll = async () => {
    setClearingAll(true);
    setConfirmClearAll(false);
    try {
      await adminFetch("/api/admin/activity/clear", { method: "POST" });
      await refetch();
      toast({ description: "Todas as atividades foram removidas." });
    } catch {
      toast({ description: "Erro ao limpar atividades.", variant: "destructive" });
    } finally { setClearingAll(false); }
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1">Monitoramento</p>
            <h2 className="text-2xl font-bold text-white mb-1">Atividade da Plataforma</h2>
            <p className="text-muted-foreground text-sm">Todas as ações dos usuários em todos os espaços de trabalho — feed em tempo real.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:mt-1 sm:shrink-0">
            <Button size="sm" variant="outline" onClick={() => void refetch()} disabled={isFetching} className="border-white/10 text-zinc-400 hover:text-white hover:border-white/20 gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            {hasItems && (
              <Button
                size="sm" variant="outline"
                onClick={() => setConfirmClearAll(true)}
                disabled={clearingAll || isFetching}
                className="border-white/10 text-zinc-600 hover:text-red-400 hover:border-red-400/30 gap-1.5"
              >
                {clearingAll
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Trash2 className="w-3.5 h-3.5" />}
                Limpar Tudo
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por ação, módulo, usuário ou projeto..."
              className="pl-10 bg-[#111111] border-white/5 focus-visible:ring-primary/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-1.5 shrink-0">
            <Activity className="w-4 h-4" />
            <span>{isLoading ? "..." : filtered.length} eventos</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
        className={`transition-opacity duration-150 ${isFetching && !isLoading ? "opacity-50 pointer-events-none" : ""}`}
      >
        <Card className="bg-[#111111] border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium">Ação</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Módulo</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Usuário</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Projeto</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Horário</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="px-5 py-3"><Skeleton className="h-4 w-40 bg-white/5" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-24 bg-white/5" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-32 bg-white/5" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-28 bg-white/5" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-16 bg-white/5" /></td>
                      <td className="px-4 py-3" />
                    </tr>
                  ))
                ) : !filtered.length ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16">
                      <Activity className="w-8 h-8 text-white/10 mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">Nenhuma atividade encontrada.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, i) => {
                    const colorClass = moduleColors[item.module] ?? "text-muted-foreground bg-white/5 border-white/10";
                    const isDeleting   = deletingId === item.id;
                    const isConfirming = confirmDeleteId === item.id;
                    return (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.4) }}
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                      >
                        <td className="px-5 py-3">
                          <p className="text-white text-sm font-medium">{translateAction(item.action)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-[10px] ${colorClass}`}>
                            {translateModule(item.module)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="text-xs text-muted-foreground truncate max-w-40">
                              {item.userName ?? item.userEmail ?? "Desconhecido"}
                            </span>
                          </div>
                          {item.userName && item.userEmail && (
                            <p className="text-[10px] text-muted-foreground/60 ml-4.5 truncate max-w-40">{item.userEmail}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-muted-foreground truncate max-w-36">
                            {item.projectName ? translateDemoName(item.projectName) : "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                            <Clock className="w-3 h-3 shrink-0" />
                            {timeAgo(item.createdAt)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {isConfirming ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => void handleDeleteItem(item.id)}
                                className="text-[10px] text-red-400 hover:text-red-300 px-2 py-1 rounded bg-red-400/10 border border-red-400/20 whitespace-nowrap transition-colors"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-[10px] text-zinc-600 hover:text-zinc-400 px-2 py-1 rounded bg-white/[0.03] border border-white/[0.07] transition-colors"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(item.id)}
                              disabled={isDeleting}
                              className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-red-400 transition-all duration-150 p-1 rounded hover:bg-red-400/10 disabled:opacity-50"
                              title="Remover atividade"
                            >
                              {isDeleting
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {confirmClearAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-2">Limpar todas as atividades?</h3>
            <p className="text-sm text-zinc-400 mb-5">
              Todas as atividades visíveis da plataforma serão removidas. Esta ação afeta todos os usuários.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmClearAll(false)}
                className="px-4 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleClearAll()}
                className="px-4 py-2 text-sm rounded-lg bg-red-500/15 border border-red-500/25 text-red-400 hover:bg-red-500/25 hover:text-red-300 transition-colors"
              >
                Limpar Tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
