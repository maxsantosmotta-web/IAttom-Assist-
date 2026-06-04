import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Zap, RefreshCw, Loader2, CheckCircle2, AlertCircle,
  Activity, Clock, BarChart2, Copy, Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface KiwifyConfigResponse {
  configured:        boolean;
  connectionStatus:  "not_configured" | "configured" | "validated";
  webhookConfigured: boolean;
  webhookUrl?:       string;
  tokenExpiry?:      string | null;
  isActive?:         boolean;
  updatedAt?:        string | null;
}

// ─── Status map ───────────────────────────────────────────────────────────────

const STATUS_MAP = {
  not_configured: { label: "Não configurado",  color: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"     },
  configured:     { label: "Credenciais salvas", color: "bg-amber-500/15  text-amber-400  border-amber-500/30"  },
  validated:      { label: "Conexão validada",  color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminKiwify() {
  const [config, setConfig]       = useState<KiwifyConfigResponse | null>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadConfig = async () => {
    try {
      const res = await fetch("/api/kiwify/config", { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as KiwifyConfigResponse;
      setConfig(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadConfig(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConfig();
    setRefreshing(false);
  };

  const status     = config?.connectionStatus ?? "not_configured";
  const statusInfo = STATUS_MAP[status];

  return (
    <div className="p-6 space-y-6 max-w-4xl">

      {/* ─── Header ──────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Kiwify</h1>
              <p className="text-xs text-zinc-500">Monitoramento global da integração Kiwify.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${statusInfo.color} text-[10px]`}>{statusInfo.label}</Badge>
            <Button size="sm" variant="outline"
              onClick={() => void handleRefresh()}
              disabled={refreshing}
              className="border-white/10 text-zinc-400 hover:text-white h-8 gap-1.5 text-xs">
              {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Atualizar
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ─── KPIs ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Status API",       value: statusInfo.label, icon: Activity,   color: "text-violet-400" },
          { label: "Webhook",          value: config?.webhookConfigured ? "Configurado" : "Pendente", icon: Zap, color: config?.webhookConfigured ? "text-emerald-400" : "text-amber-400" },
          { label: "Token expira em",  value: config?.tokenExpiry ? new Date(config.tokenExpiry).toLocaleDateString("pt-BR") : "—", icon: Clock, color: "text-zinc-400" },
          { label: "Última alteração", value: config?.updatedAt  ? new Date(config.updatedAt).toLocaleDateString("pt-BR")  : "—", icon: BarChart2, color: "text-zinc-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-white/3 border-white/8">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider leading-tight">{label}</p>
                <Icon className={`w-3.5 h-3.5 ${color} shrink-0`} />
              </div>
              <p className="text-sm font-semibold text-white leading-tight">
                {loading ? <span className="text-zinc-600">—</span> : value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Status / Webhook URL ─────────────────────────────────── */}
      <Card className="bg-white/3 border-white/8">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
            {status === "validated"
              ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              : <AlertCircle  className="w-4 h-4 text-zinc-600" />}
            Status da integração
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="h-12 skeleton-shimmer rounded-lg" />
          ) : (
            <>
              {status === "not_configured" && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-zinc-800/40 border border-white/6">
                  <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Credenciais não configuradas. Acesse <span className="text-zinc-300">ADM → Integrações → Kiwify</span> para inserir Client ID, Client Secret e Account ID.
                  </p>
                </div>
              )}
              {status === "configured" && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-300/80 leading-relaxed">
                    Credenciais salvas mas conexão não testada. Acesse <span className="text-amber-200">ADM → Integrações → Kiwify</span> e clique em "Testar configuração".
                  </p>
                </div>
              )}
              {status === "validated" && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-emerald-300/80 leading-relaxed">
                    Conexão validada com a API da Kiwify. Token ativo até {config?.tokenExpiry ? new Date(config.tokenExpiry).toLocaleString("pt-BR") : "—"}.
                  </p>
                </div>
              )}
              {config?.webhookUrl && (
                <div>
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1.5">URL do Webhook (configure no painel Kiwify)</p>
                  <div className="flex items-center gap-2">
                    <code className="text-[11px] text-zinc-400 font-mono bg-white/4 rounded px-2 py-1.5 flex-1 truncate">
                      {config.webhookUrl}
                    </code>
                    <button
                      onClick={() => { void navigator.clipboard.writeText(config.webhookUrl ?? ""); toast.success("URL copiada."); }}
                      className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0 p-1">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
