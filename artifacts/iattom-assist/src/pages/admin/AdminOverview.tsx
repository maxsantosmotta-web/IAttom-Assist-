import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users, FolderOpen, Zap, DollarSign, TrendingUp, Layers,
  RefreshCw, Activity, ShieldAlert, Percent, CreditCard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  useGetAdminStats, useGetAdminAnalytics,
  getGetAdminStatsQueryKey, getGetAdminAnalyticsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@clerk/react";
import { Button } from "@/components/ui/button";

const GOLD       = "#C9A84C";
const GOLD_LIGHT = "#E8C96A";
const PURPLE     = "#a78bfa";
const EMERALD    = "#34d399";
const BLUE       = "#60a5fa";
const ORANGE     = "#fb923c";
const ROSE       = "#fb7185";
const AMBER      = "#fbbf24";

const FEATURE_COLORS = [GOLD, PURPLE, EMERALD, BLUE, ORANGE, ROSE, AMBER];

const FEATURE_NAME_MAP: Record<string, string> = {
  "Product Discovery":  "Descoberta",
  "Product Validation": "Validação",
  "Validate Products":  "Validação",
  "Campaign":           "Campanha",
  "Content":            "Conteúdo",
  "Creative":           "Criativo",
  "Video Script":       "Script de Vídeo",
  "Marketing":          "Marketing",
};

const BASE = (import.meta.env.BASE_URL as string).replace(/\/$/, "");

interface GrowthStats {
  mrr: number;
  activeSubscribers: number;
  totalUsers: number;
  conversionRate: number;
  activationRate: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  creditsSpentThisMonth: number;
  churnRisk: Array<{ clerkId: string; plan: string; credits: number; planLimit: number; pct: number }>;
  planBreakdown: { free: number; pro: number; business: number; agency: number };
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string; fill?: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
      {label && <p className="text-muted-foreground mb-1 font-medium">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color ?? p.fill ?? GOLD }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

const containerVariants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const PLAN_COLORS: Record<string, string> = {
  START:    "#60a5fa",
  COMPLETO: "#34d399",
  PREMIUM:  "#a78bfa",
  PRO:      GOLD,
};

function MetricTile({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: string | null; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <Card className="bg-[#111111] border-white/5 hover:border-white/10 transition-colors">
      <CardContent className="p-5">
        <div className={`w-9 h-9 rounded-lg border flex items-center justify-center mb-3 ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        {value === null
          ? <Skeleton className="h-8 w-20 bg-white/5 mb-1" />
          : <p className="text-2xl font-bold text-white mb-0.5">{value}</p>}
        <p className="text-xs font-semibold text-white mb-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export function AdminOverview() {
  const { getToken } = useAuth();

  const {
    data: stats, isLoading: statsLoading,
    isFetching: fetchingStats, refetch: refetchStats,
  } = useGetAdminStats({ query: { queryKey: getGetAdminStatsQueryKey(), staleTime: 0 } });

  const {
    data: analytics, isLoading: analyticsLoading,
    isFetching: fetchingAnalytics, refetch: refetchAnalytics,
  } = useGetAdminAnalytics({ query: { queryKey: getGetAdminAnalyticsQueryKey(), staleTime: 0 } });

  const [growthStats, setGrowthStats]     = useState<GrowthStats | null>(null);
  const [growthLoading, setGrowthLoading] = useState(true);
  const [growthTick, setGrowthTick]       = useState(0);

  useEffect(() => {
    setGrowthLoading(true);
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${BASE}/api/admin/growth-stats`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        if (res.ok) setGrowthStats(await res.json() as GrowthStats);
      } finally { setGrowthLoading(false); }
    })();
  }, [growthTick, getToken]);

  const isRefreshing = fetchingStats || fetchingAnalytics || growthLoading;

  const handleRefresh = () => {
    void refetchStats();
    void refetchAnalytics();
    setGrowthTick((t) => t + 1);
  };

  /* ── KPI cards ──────────────────────────────────────────────── */
  const kpiCards = [
    {
      label: "Usuários",
      value: statsLoading ? null : String(stats?.totalUsers ?? 0),
      sub:   `+${stats?.newUsersThisMonth ?? 0} este mês`,
      icon:  Users,
      color: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    },
    {
      label: "Planos Ativos",
      value: growthLoading ? null : String(growthStats?.activeSubscribers ?? 0),
      sub:   `${growthStats?.conversionRate ?? 0}% de conversão`,
      icon:  CreditCard,
      color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    },
    {
      label: "Execuções",
      value: statsLoading ? null : String(stats?.totalActions ?? 0),
      sub:   "Total entre todos os usuários",
      icon:  Zap,
      color: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    },
    {
      label: "Receita Mensal",
      value: growthLoading ? null : `$${(growthStats?.mrr ?? 0).toLocaleString()}`,
      sub:   `${growthStats?.activationRate ?? 0}% ativação`,
      icon:  DollarSign,
      color: "text-primary bg-primary/10 border-primary/20",
    },
  ];

  /* ── Planos distribuição (BarChart) ─────────────────────────── */
  const planBar = growthStats
    ? [
        { name: "START",    users: growthStats.planBreakdown.free,     fill: PLAN_COLORS.START },
        { name: "COMPLETO", users: growthStats.planBreakdown.pro,      fill: PLAN_COLORS.COMPLETO },
        { name: "PREMIUM",  users: growthStats.planBreakdown.business, fill: PLAN_COLORS.PREMIUM },
        { name: "PRO",      users: growthStats.planBreakdown.agency,   fill: PLAN_COLORS.PRO },
      ].filter((p) => p.users > 0)
    : (analytics
        ? [
            { name: "START",    users: analytics.planRevenue.find(p => p.plan === "free")?.users     ?? 0, fill: PLAN_COLORS.START },
            { name: "COMPLETO", users: analytics.planRevenue.find(p => p.plan === "pro")?.users      ?? 0, fill: PLAN_COLORS.COMPLETO },
            { name: "PREMIUM",  users: analytics.planRevenue.find(p => p.plan === "business")?.users ?? 0, fill: PLAN_COLORS.PREMIUM },
            { name: "PRO",      users: analytics.planRevenue.find(p => p.plan === "agency")?.users   ?? 0, fill: PLAN_COLORS.PRO },
          ].filter((p) => p.users > 0)
        : []);

  /* ── Uso por módulo (BarChart horizontal) ───────────────────── */
  const featureData = (analytics?.featureUsage ?? [])
    .slice(0, 7)
    .map((f, i) => ({
      name: FEATURE_NAME_MAP[f.name] ?? f.name,
      count: f.count,
      pct: f.percentage,
      fill: FEATURE_COLORS[i % FEATURE_COLORS.length],
    }));

  /* ── Churn risk ─────────────────────────────────────────────── */
  const churnCount = growthStats?.churnRisk?.length ?? 0;
  const churnByPlan = growthStats?.churnRisk?.reduce<Record<string, number>>((acc, u) => {
    acc[u.plan] = (acc[u.plan] ?? 0) + 1;
    return acc;
  }, {}) ?? {};

  const PLAN_LABEL: Record<string, string> = {
    free: "START", pro: "COMPLETO", business: "PREMIUM", agency: "PRO",
  };

  return (
    <div className="space-y-8">

      {/* ── Header ─────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1">Painel Administrativo</p>
            <h2 className="text-2xl font-bold text-white mb-1">Visão Geral da Plataforma</h2>
            <p className="text-muted-foreground text-sm">Centro de comando — métricas, crescimento e saúde da plataforma.</p>
          </div>
          <Button
            size="sm" variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-white/10 text-zinc-400 hover:text-white hover:border-white/20 gap-1.5 sm:shrink-0 sm:mt-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </motion.div>

      {/* ── Row 1: KPI Cards ───────────────────────────────────── */}
      <motion.div
        variants={containerVariants} initial="hidden" animate="show"
        className={`grid grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity duration-150 ${
          isRefreshing && !statsLoading && !growthLoading ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        {kpiCards.map((card) => (
          <motion.div key={card.label} variants={itemVariants}>
            <MetricTile
              label={card.label}
              value={card.value}
              sub={card.sub}
              icon={card.icon}
              color={card.color}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* ── Row 2: Crescimento + Distribuição de Planos ────────── */}
      <div className={`grid lg:grid-cols-3 gap-6 transition-opacity duration-150 ${
        isRefreshing && !analyticsLoading && !growthLoading ? "opacity-50 pointer-events-none" : ""
      }`}>

        {/* Area: Crescimento Usuários + Projetos */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="lg:col-span-2"
        >
          <Card className="bg-[#111111] border-white/5 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Crescimento de Usuários e Projetos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <Skeleton className="h-52 w-full bg-white/5 rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <AreaChart data={analytics?.userGrowth ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ovGradUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={GOLD}   stopOpacity={0.3} />
                        <stop offset="95%" stopColor={GOLD}   stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="ovGradProjects" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={PURPLE} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={PURPLE} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="users"    stroke={GOLD}   strokeWidth={2} fill="url(#ovGradUsers)"    name="Usuários" dot={false} />
                    <Area type="monotone" dataKey="projects" stroke={PURPLE} strokeWidth={2} fill="url(#ovGradProjects)" name="Projetos" dot={false} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#71717a" }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Bar: Distribuição de Planos */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="bg-[#111111] border-white/5 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Distribuição de Planos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {growthLoading && !analytics ? (
                <Skeleton className="h-52 w-full bg-white/5 rounded-lg" />
              ) : planBar.length === 0 ? (
                <div className="h-52 flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">Nenhum usuário com plano ativo.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={planBar} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="users" name="Usuários" radius={[4, 4, 0, 0]}>
                      {planBar.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Row 3: Uso por Módulo + Saúde / Churn ──────────────── */}
      <div className={`grid lg:grid-cols-2 gap-6 transition-opacity duration-150 ${
        isRefreshing && !analyticsLoading && !growthLoading ? "opacity-50 pointer-events-none" : ""
      }`}>

        {/* Bar Horizontal: Uso por Módulo */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <Card className="bg-[#111111] border-white/5 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Uso por Módulo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <Skeleton className="h-52 w-full bg-white/5 rounded-lg" />
              ) : featureData.length === 0 ? (
                <div className="h-52 flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">Nenhuma execução registrada.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(180, featureData.length * 36)}>
                  <BarChart
                    data={featureData}
                    layout="vertical"
                    margin={{ top: 0, right: 40, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 11, fill: "#a1a1aa" }}
                      axisLine={false}
                      tickLine={false}
                      width={80}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Execuções" radius={[0, 4, 4, 0]}>
                      {featureData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Saúde da Plataforma / Risco de Churn */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="bg-[#111111] border-white/5 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-primary" />
                Saúde da Plataforma
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* Métricas de conversão + ativação */}
              {growthLoading ? (
                <div className="grid grid-cols-3 gap-3">
                  {[0,1,2].map((i) => <Skeleton key={i} className="h-20 bg-white/5 rounded-xl" />)}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#0f0f0f] border border-white/[0.06] rounded-xl p-3 text-center">
                    <Percent className="w-4 h-4 text-primary mx-auto mb-1.5" />
                    <p className="text-xl font-bold text-white">{growthStats?.conversionRate ?? 0}%</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5 leading-tight">Conversão</p>
                  </div>
                  <div className="bg-[#0f0f0f] border border-white/[0.06] rounded-xl p-3 text-center">
                    <Users className="w-4 h-4 text-emerald-400 mx-auto mb-1.5" />
                    <p className="text-xl font-bold text-white">{growthStats?.activationRate ?? 0}%</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5 leading-tight">Ativação</p>
                  </div>
                  <div className="bg-[#0f0f0f] border border-white/[0.06] rounded-xl p-3 text-center">
                    <FolderOpen className="w-4 h-4 text-amber-400 mx-auto mb-1.5" />
                    <p className="text-xl font-bold text-white">{growthStats?.creditsSpentThisMonth ?? 0}</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5 leading-tight">Créditos / mês</p>
                  </div>
                </div>
              )}

              {/* Risco de Churn */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Risco de Churn</p>
                  {!growthLoading && (
                    <Badge
                      variant="outline"
                      className={churnCount === 0
                        ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20 text-[10px]"
                        : "text-rose-400 bg-rose-400/10 border-rose-400/20 text-[10px]"}
                    >
                      {churnCount === 0 ? "Nenhum" : `${churnCount} usuário${churnCount !== 1 ? "s" : ""}`}
                    </Badge>
                  )}
                </div>

                {growthLoading ? (
                  <Skeleton className="h-14 w-full bg-white/5 rounded-lg" />
                ) : churnCount === 0 ? (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-400/[0.04] border border-emerald-400/[0.12]">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <p className="text-xs text-emerald-400">Nenhum usuário pago com créditos críticos.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Por plano */}
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(churnByPlan).map(([plan, n]) => (
                        <div
                          key={plan}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-400/[0.06] border border-rose-400/[0.15]"
                        >
                          <span className="text-[10px] font-semibold text-zinc-500 uppercase">{PLAN_LABEL[plan] ?? plan}</span>
                          <span className="text-xs font-bold text-rose-400">{n}</span>
                        </div>
                      ))}
                    </div>
                    {/* Top 4 mais críticos */}
                    <div className="space-y-1.5 mt-1">
                      {growthStats!.churnRisk.slice(0, 4).map((u) => (
                        <div key={u.clerkId} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                          <span className="text-xs text-zinc-500 font-mono truncate max-w-[140px]">{u.clerkId.slice(-10)}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-zinc-600 uppercase">{PLAN_LABEL[u.plan] ?? u.plan}</span>
                            <div className="w-16 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-rose-400"
                                style={{ width: `${Math.min(100, u.pct)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-rose-400 font-semibold w-6 text-right">{u.pct}%</span>
                          </div>
                        </div>
                      ))}
                      {churnCount > 4 && (
                        <p className="text-[10px] text-zinc-700 text-center pt-1">
                          +{churnCount - 4} outros usuários em risco · acesse Análises para detalhes
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </CardContent>
          </Card>
        </motion.div>
      </div>

    </div>
  );
}
