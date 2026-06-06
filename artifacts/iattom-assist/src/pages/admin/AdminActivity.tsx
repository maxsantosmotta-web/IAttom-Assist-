import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity, Search, Clock, User, RefreshCw, Trash2, Loader2,
  TrendingUp, Zap, CalendarDays, BarChart2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useListAdminActivity, getListAdminActivityQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { translateAction, translateModule, translateDemoName } from "@/lib/eventTranslations";
import { useToast } from "@/hooks/use-toast";

/* ─── constants ─────────────────────────────────────────────────── */
const MODULE_COLORS: Record<string, string> = {
  campaign:          "#fbbf24",
  content:           "#60a5fa",
  creative:          "#a78bfa",
  video_script:      "#fb7185",
  product_discovery: "#C9A84C",
  product_validation:"#34d399",
  marketing:         "#fb923c",
};
const MODULE_BADGE: Record<string, string> = {
  campaign:          "text-amber-400 bg-amber-400/10 border-amber-400/20",
  content:           "text-blue-400 bg-blue-400/10 border-blue-400/20",
  creative:          "text-purple-400 bg-purple-400/10 border-purple-400/20",
  video_script:      "text-rose-400 bg-rose-400/10 border-rose-400/20",
  product_discovery: "text-primary bg-primary/10 border-primary/20",
  product_validation:"text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  marketing:         "text-orange-400 bg-orange-400/10 border-orange-400/20",
};
const FALLBACK_COLORS = [
  "#C9A84C","#60a5fa","#a78bfa","#34d399","#fb7185","#fb923c","#fbbf24","#22d3ee",
];

/* ─── helpers ───────────────────────────────────────────────────── */
function timeAgo(date: string | Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "agora mesmo";
  if (seconds < 3600) return `há ${Math.floor(seconds / 60)}min`;
  if (seconds < 86400) return `há ${Math.floor(seconds / 3600)}h`;
  return new Date(date).toLocaleDateString("pt-BR");
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}
function shortDay(iso: string) {
  const [, , dd] = iso.split("-");
  const d = new Date(`${iso}T12:00:00`);
  const month = d.toLocaleString("pt-BR", { month: "short" }).replace(".", "");
  return `${dd}/${month}`;
}

const BASE = (import.meta.env.BASE_URL as string).replace(/\/$/, "");

async function adminFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    credentials: "include",
  });
}

/* ─── tooltip ───────────────────────────────────────────────────── */
const CustomTooltip = ({
  active, payload, label,
}: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string; fill?: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
      {label && <p className="text-muted-foreground mb-1 font-medium">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color ?? p.fill ?? "#C9A84C" }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

/* ─── AdminActivity ─────────────────────────────────────────────── */
export function AdminActivity() {
  const [search, setSearch] = useState("");
  const { data: activity, isLoading, isFetching, refetch } = useListAdminActivity(
    { limit: 100 },
    { query: { queryKey: getListAdminActivityQueryKey({ limit: 100 }), staleTime: 0 } },
  );
  const { toast } = useToast();

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId,      setDeletingId]      = useState<number | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [clearingAll,     setClearingAll]     = useState(false);

  /* ── derived data ────────────────────────────────────────────── */
  const items = activity ?? [];

  const { kpis, dailyChart, moduleChart, actionChart } = useMemo(() => {
    const now = new Date();
    const todayKey  = dayKey(now);
    const week7ago  = new Date(now.getTime() - 7  * 86400000);
    const month30ago = new Date(now.getTime() - 30 * 86400000);

    let today = 0, week = 0, month = 0;
    for (const it of items) {
      const d = new Date(it.createdAt);
      if (dayKey(d) === todayKey) today++;
      if (d >= week7ago)   week++;
      if (d >= month30ago) month++;
    }

    const avgDaily = week > 0
      ? (week / Math.min(7, Math.max(1,
          Math.ceil((now.getTime() - (items.length ? new Date(items[items.length - 1].createdAt).getTime() : now.getTime())) / 86400000)
        ))).toFixed(1)
      : "0";

    /* ── timeline: last 14 days ── */
    const dailyMap: Record<string, number> = {};
    const days14: string[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const k = dayKey(d);
      days14.push(k);
      dailyMap[k] = 0;
    }
    for (const it of items) {
      const k = dayKey(new Date(it.createdAt));
      if (k in dailyMap) dailyMap[k]++;
    }
    const dailyChart = days14.map((k) => ({ date: shortDay(k), count: dailyMap[k] }));

    /* ── by module ── */
    const modMap: Record<string, number> = {};
    for (const it of items) {
      modMap[it.module] = (modMap[it.module] ?? 0) + 1;
    }
    const moduleChart = Object.entries(modMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([mod, count], i) => ({
        name: translateModule(mod),
        count,
        fill: MODULE_COLORS[mod] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
      }));

    /* ── by action type ── */
    const actionMap: Record<string, number> = {};
    for (const it of items) {
      const label = translateAction(it.action);
      actionMap[label] = (actionMap[label] ?? 0) + 1;
    }
    const actionChart = Object.entries(actionMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count], i) => ({
        name: name.length > 18 ? name.slice(0, 16) + "…" : name,
        count,
        fill: FALLBACK_COLORS[i % FALLBACK_COLORS.length],
      }));

    return { kpis: { today, week, month, avgDaily }, dailyChart, moduleChart, actionChart };
  }, [items]);

  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.action.toLowerCase().includes(q) ||
      item.module.toLowerCase().includes(q) ||
      (item.userEmail ?? "").toLowerCase().includes(q) ||
      (item.projectName ?? "").toLowerCase().includes(q)
    );
  });

  /* ── handlers ────────────────────────────────────────────────── */
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

  const hasItems = items.length > 0;

  return (
    <div className="space-y-8">

      {/* ── Header ───────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1">Monitoramento</p>
            <h2 className="text-2xl font-bold text-white mb-1">Atividade da Plataforma</h2>
            <p className="text-muted-foreground text-sm">Monitoramento visual das ações, execuções e movimentações da plataforma.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:mt-1 sm:shrink-0">
            <Button size="sm" variant="outline" onClick={() => void refetch()} disabled={isFetching}
              className="border-white/10 text-zinc-400 hover:text-white hover:border-white/20 gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            {hasItems && (
              <Button size="sm" variant="outline" onClick={() => setConfirmClearAll(true)}
                disabled={clearingAll || isFetching}
                className="border-white/10 text-zinc-600 hover:text-red-400 hover:border-red-400/30 gap-1.5">
                {clearingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Limpar Tudo
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── KPI Cards ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { label: "Hoje",          value: isLoading ? null : kpis.today,    sub: "ações registradas",    icon: Zap,         color: "text-primary  bg-primary/10  border-primary/20" },
          { label: "Últimos 7 dias", value: isLoading ? null : kpis.week,    sub: "no período",           icon: CalendarDays,color: "text-blue-400  bg-blue-400/10  border-blue-400/20" },
          { label: "Últimos 30 dias",value: isLoading ? null : kpis.month,   sub: "no período",           icon: TrendingUp,  color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
          { label: "Média Diária",   value: isLoading ? null : kpis.avgDaily, sub: "ações/dia (7 dias)",  icon: BarChart2,   color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <Card key={label} className="bg-[#111111] border-white/5 hover:border-white/10 transition-colors">
            <CardContent className="p-5">
              <div className={`w-9 h-9 rounded-lg border flex items-center justify-center mb-3 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              {value === null
                ? <Skeleton className="h-8 w-16 bg-white/5 mb-1" />
                : <p className="text-2xl font-bold text-white mb-0.5">{value}</p>}
              <p className="text-xs font-semibold text-white mb-0.5">{label}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* ── Charts row 1: Timeline + Módulos ─────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Area: Movimento da Plataforma */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.12 }}>
          <Card className="bg-[#111111] border-white/5 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Movimento da Plataforma
                <span className="text-[10px] text-zinc-600 font-normal ml-auto">últimos 14 dias</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-48 w-full bg-white/5 rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={dailyChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis
                      dataKey="date" tick={{ fontSize: 9, fill: "#52525b" }}
                      axisLine={false} tickLine={false}
                      interval={1}
                    />
                    <YAxis tick={{ fontSize: 10, fill: "#52525b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone" dataKey="count" stroke="#a78bfa" strokeWidth={2.5}
                      fill="url(#actGrad)" name="Ações" dot={{ fill: "#a78bfa", r: 3, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: "#a78bfa" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Bar horizontal: Atividade por Módulo */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.17 }}>
          <Card className="bg-[#111111] border-white/5 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-primary" />
                Atividade por Módulo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-48 w-full bg-white/5 rounded-lg" />
              ) : moduleChart.length === 0 ? (
                <div className="h-48 flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">Sem dados suficientes.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(180, moduleChart.length * 36)}>
                  <BarChart data={moduleChart} layout="vertical" margin={{ top: 0, right: 40, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#52525b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} width={90} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Ações" radius={[0, 4, 4, 0]}>
                      {moduleChart.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Chart row 2: Atividade por Tipo ──────────────────────── */}
      {actionChart.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.22 }}>
          <Card className="bg-[#111111] border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Atividade por Tipo de Ação
                <span className="text-[10px] text-zinc-600 font-normal ml-auto">top 8 ações · últimos 100 eventos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={actionChart} margin={{ top: 4, right: 16, left: -10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#71717a" }}
                    axisLine={false} tickLine={false}
                    angle={-35} textAnchor="end" interval={0}
                  />
                  <YAxis tick={{ fontSize: 10, fill: "#52525b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Ocorrências" radius={[4, 4, 0, 0]}>
                    {actionChart.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10, color: "#71717a", paddingTop: 8 }} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Search ───────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.26 }}>
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

      {/* ── Table ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
        className={`transition-opacity duration-150 ${isFetching && !isLoading ? "opacity-50 pointer-events-none" : ""}`}
      >
        <div className="mb-3 flex items-center gap-2">
          <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Log de Auditoria</p>
          <div className="flex-1 h-px bg-white/[0.04]" />
        </div>
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
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Ações</th>
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
                      <p className="text-muted-foreground text-sm">
                        {search ? "Nenhum resultado para a busca." : "Nenhuma atividade encontrada."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, i) => {
                    const colorClass = MODULE_BADGE[item.module] ?? "text-muted-foreground bg-white/5 border-white/10";
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
                              className="text-zinc-600 hover:text-red-400 transition-colors p-1 rounded hover:bg-red-400/10 disabled:opacity-50"
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

      {/* ── Confirm Clear All ─────────────────────────────────────── */}
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
