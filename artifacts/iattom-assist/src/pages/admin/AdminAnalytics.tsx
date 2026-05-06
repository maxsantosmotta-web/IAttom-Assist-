import { motion } from "framer-motion";
import { TrendingUp, BarChart2, PieChart as PieIcon, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { useGetAdminAnalytics } from "@workspace/api-client-react";

const GOLD = "#C9A84C";
const PURPLE = "#a78bfa";
const EMERALD = "#34d399";
const BLUE = "#60a5fa";
const ORANGE = "#fb923c";
const ROSE = "#fb7185";
const AMBER = "#fbbf24";

const PIE_COLORS = [GOLD, PURPLE, EMERALD];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
      {label && <p className="text-muted-foreground mb-1 font-medium">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color || p.fill }} className="font-semibold">
          {p.name}: {typeof p.value === "number" && p.value >= 1000 ? `$${p.value.toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
};

const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const FEATURE_COLORS = [GOLD, PURPLE, EMERALD, BLUE, ORANGE, ROSE, AMBER];

export function AdminAnalytics() {
  const { data: analytics, isLoading } = useGetAdminAnalytics();

  const featureData = (analytics?.featureUsage ?? []).map((f, i) => ({
    ...f,
    fill: FEATURE_COLORS[i % FEATURE_COLORS.length],
  }));

  const revenueData = analytics?.planRevenue.filter((p) => p.users > 0) ?? [];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1">Insights</p>
        <h2 className="text-2xl font-bold text-white mb-1">Analytics</h2>
        <p className="text-muted-foreground text-sm">Deep-dive into platform growth, feature adoption, and revenue.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="bg-[#111111] border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> User & Project Growth (7 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full bg-white/5 rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={analytics?.userGrowth ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradUsers2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={GOLD} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradProjects2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={PURPLE} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={PURPLE} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="users" stroke={GOLD} strokeWidth={2.5} fill="url(#gradUsers2)" name="Users" dot={{ fill: GOLD, r: 3 }} />
                  <Area type="monotone" dataKey="projects" stroke={PURPLE} strokeWidth={2} fill="url(#gradProjects2)" name="Projects" dot={{ fill: PURPLE, r: 3 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#71717a", paddingTop: 8 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
          <Card className="bg-[#111111] border-white/5 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" /> Feature Usage Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-52 w-full bg-white/5 rounded-lg" />
              ) : !featureData.length ? (
                <p className="text-sm text-muted-foreground text-center py-10">No usage data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={featureData} layout="vertical" margin={{ top: 0, right: 30, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
                    <YAxis
                      type="category" dataKey="name"
                      tick={{ fontSize: 10, fill: "#a1a1aa" }} width={90}
                      axisLine={false} tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Actions" radius={[0, 4, 4, 0]}>
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

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <Card className="bg-[#111111] border-white/5 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-primary" /> Revenue by Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-52 w-full bg-white/5 rounded-lg" />
              ) : revenueData.length === 0 || revenueData.every((p) => p.mrr === 0) ? (
                <div className="flex flex-col items-center justify-center h-52">
                  <p className="text-sm text-muted-foreground">No paid subscribers yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Upgrade users to Pro or Business to see revenue.</p>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={analytics?.planRevenue ?? []}
                        dataKey="mrr"
                        nameKey="plan"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        labelLine={false}
                        label={<PieLabel />}
                      >
                        {(analytics?.planRevenue ?? []).map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#71717a" }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {analytics?.planRevenue.map((p, i) => (
                      <div key={p.plan} className="text-center">
                        <p className="text-sm font-bold text-white" style={{ color: PIE_COLORS[i] }}>
                          ${p.mrr.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{p.plan} MRR</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {!isLoading && analytics && analytics.featureUsage.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}>
          <Card className="bg-[#111111] border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-primary" /> Feature Adoption Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {featureData.map((feature) => (
                  <div key={feature.name} className="flex items-center gap-3">
                    <p className="text-xs text-muted-foreground w-36 shrink-0 truncate">{feature.name}</p>
                    <div className="flex-1 bg-white/5 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-700"
                        style={{ width: `${feature.percentage}%`, backgroundColor: feature.fill }}
                      />
                    </div>
                    <p className="text-xs font-semibold text-white w-10 text-right shrink-0">{feature.percentage}%</p>
                    <p className="text-xs text-muted-foreground w-14 text-right shrink-0">{feature.count} uses</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
