import { motion } from "framer-motion";
import { Zap, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetCreditsBalance,
  getGetCreditsBalanceQueryKey,
  useListCreditTransactions,
  getListCreditTransactionsQueryKey,
} from "@workspace/api-client-react";
import { FEATURE_COSTS, PLAN_CREDITS, PLAN_PRICES, getCreditColor, getCreditBarColor } from "@/lib/credits";

const featureLabels: Record<string, string> = {
  product_discovery: "Product Discovery",
  product_validation: "Product Validation",
  campaign: "Campaign Builder",
  content: "Content Studio",
  creative: "Creative Generator",
  video_script: "Video Scripts",
};

const txTypeStyles: Record<string, string> = {
  initial: "text-primary bg-primary/10 border-primary/20",
  credit: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  debit: "text-red-400 bg-red-400/10 border-red-400/20",
  adjustment: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  refund: "text-blue-400 bg-blue-400/10 border-blue-400/20",
};

const planColors: Record<string, string> = {
  free: "text-zinc-400",
  pro: "text-primary",
  business: "text-emerald-400",
  agency: "text-purple-400",
};

export function Credits() {
  const [, navigate] = useLocation();
  const { data: balance, isLoading: balanceLoading } = useGetCreditsBalance({
    query: { queryKey: getGetCreditsBalanceQueryKey() },
  });

  const { data: txData, isLoading: txLoading } = useListCreditTransactions(
    {},
    { query: { queryKey: getListCreditTransactionsQueryKey() } },
  );

  const percentage = balance?.percentage ?? 0;
  const barColor = getCreditBarColor(percentage);
  const textColor = getCreditColor(percentage);

  const upgradePlans = balance
    ? (Object.keys(PLAN_CREDITS) as Array<keyof typeof PLAN_CREDITS>).filter(
        (p) => PLAN_CREDITS[p] > (PLAN_CREDITS[balance.plan as keyof typeof PLAN_CREDITS] ?? 0),
      )
    : [];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1">Credits & Usage</p>
        <h2 className="text-2xl font-bold text-white mb-1">Credits</h2>
        <p className="text-muted-foreground text-sm">
          Track your credit balance and usage history across all AI features.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-4">
        <motion.div
          className="md:col-span-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="bg-[#111111] border-white/5 h-full">
            <CardContent className="p-6">
              {balanceLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-36 bg-white/5" />
                  <Skeleton className="h-2 w-full bg-white/5" />
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Balance</p>
                      <p className={`text-5xl font-bold tabular-nums ${textColor}`}>
                        {(balance?.balance ?? 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1.5">
                        of {(balance?.planLimit ?? 0).toLocaleString()} credits &middot;{" "}
                        <span className={`capitalize font-medium ${planColors[balance?.plan ?? "free"]}`}>
                          {balance?.plan ?? "free"} plan
                        </span>
                      </p>
                    </div>
                    {balance?.lowCredit && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-medium shrink-0">
                        Low Credits
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Credits remaining</span>
                      <span>{percentage}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <Card className="bg-[#111111] border-white/5 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Feature Costs
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0 space-y-2.5">
              {(Object.entries(FEATURE_COSTS) as [string, number][]).map(([key, cost]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{featureLabels[key] ?? key}</span>
                  <div className="flex items-center gap-1 text-xs font-semibold text-white">
                    <Zap className="w-2.5 h-2.5 text-primary fill-primary" />
                    {cost}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {balance?.lowCredit && upgradePlans.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="bg-amber-950/20 border-amber-500/20">
            <CardContent className="p-4 flex items-center gap-4">
              <TrendingUp className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-400">Running low on credits</p>
                <p className="text-xs text-muted-foreground">
                  Upgrade to{" "}
                  <span className="text-white capitalize">{upgradePlans[0]}</span> for{" "}
                  {PLAN_CREDITS[upgradePlans[0]].toLocaleString()} credits/month.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {upgradePlans.slice(0, 2).map((plan) => (
                  <button
                    key={plan}
                    onClick={() => navigate("/dashboard/billing")}
                    className="text-xs px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors capitalize font-medium"
                  >
                    {plan} — ${PLAN_PRICES[plan].monthly}/mo
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Transaction History
          </h3>
          {txData && (
            <span className="text-xs text-muted-foreground">{txData.total} total</span>
          )}
        </div>
        <Card className="bg-[#111111] border-white/5 overflow-hidden">
          {txLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full bg-white/5" />
              ))}
            </div>
          ) : !txData?.transactions.length ? (
            <div className="py-16 text-center">
              <Zap className="w-8 h-8 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No transactions yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Use an AI feature to see your credit history here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium">Date</th>
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Description</th>
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Type</th>
                    <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium">Amount</th>
                    <th className="text-right px-5 py-3 text-xs text-muted-foreground font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {txData.transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString()}{" "}
                        <span className="text-white/30">
                          {new Date(tx.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white max-w-xs">
                        <span className="truncate block">{tx.description}</span>
                        {tx.feature && (
                          <span className="text-xs text-muted-foreground">
                            {featureLabels[tx.feature] ?? tx.feature}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize ${txTypeStyles[tx.type] ?? "text-muted-foreground bg-white/5 border-white/10"}`}
                        >
                          {tx.type}
                        </Badge>
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono font-semibold text-sm ${
                          tx.amount >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {tx.amount >= 0 ? "+" : ""}
                        {tx.amount}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-sm text-white tabular-nums">
                        {tx.balanceAfter}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
