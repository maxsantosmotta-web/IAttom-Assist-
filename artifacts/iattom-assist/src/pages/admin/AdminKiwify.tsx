import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Zap, RefreshCw, Loader2, CheckCircle2, XCircle, AlertCircle,
  ShoppingBag, Activity, Clock, BarChart2, Eye, EyeOff, Copy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface KiwifyConfigResponse {
  configured:        boolean;
  connectionStatus:  "not_configured" | "configured" | "validated";
  webhookConfigured: boolean;
  webhookUrl?:       string;
  clientId?:         string;
  clientSecret?:     string;
  accountId?:        string;
  webhookSecret?:    string;
  tokenExpiry?:      string | null;
  isActive?:         boolean;
  updatedAt?:        string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_MAP = {
  not_configured: { label: "Não configurado", color: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
  configured:     { label: "Credenciais salvas",  color: "bg-amber-500/15  text-amber-400  border-amber-500/30"  },
  validated:      { label: "Conexão validada",    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
} as const;

function MaskedField({ label, value }: { label: string; value?: string }) {
  const [show, setShow] = useState(false);
  const display = value && value.length > 0 ? value : "—";
  return (
    <div>
      <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-0.5">{label}</p>
      <div className="flex items-center gap-1.5">
        <p className="text-xs text-zinc-300 font-mono">{show ? display : display.replace(/[^•]/g, "•")}</p>
        {value && value.length > 0 && (
          <button onClick={() => setShow(v => !v)} className="text-zinc-600 hover:text-zinc-400 transition-colors">
            {show ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminKiwify() {
  const [config, setConfig]     = useState<KiwifyConfigResponse | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [testing, setTesting]   = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Form fields
  const [clientId,     setClientId]     = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [accountId,    setAccountId]    = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");

  // ── Load existing config ───────────────────────────────────────────────────
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

  // ── Save credentials ───────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!clientId.trim() || !clientSecret.trim() || !accountId.trim()) {
      toast.error("Preencha Client ID, Client Secret e Account ID.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/kiwify/config", {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId:     clientId.trim(),
          clientSecret: clientSecret.trim(),
          accountId:    accountId.trim(),
          webhookSecret: webhookSecret.trim(),
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast.error(err.error ?? "Erro ao salvar credenciais.");
        return;
      }
      toast.success("Credenciais salvas. Clique em Testar Conexão para validar.");
      setClientId("");
      setClientSecret("");
      setAccountId("");
      setWebhookSecret("");
      await loadConfig();
    } catch {
      toast.error("Falha de rede ao salvar credenciais.");
    } finally {
      setSaving(false);
    }
  };

  // ── Test connection ────────────────────────────────────────────────────────
  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await fetch("/api/kiwify/test-connection", {
        method: "POST", credentials: "include",
      });
      const data = (await res.json()) as { ok: boolean; status: string; accountName?: string; accountId?: string; error?: string };
      if (data.ok) {
        toast.success(`Conexão validada${data.accountName ? ` — ${data.accountName}` : ""}.`);
        await loadConfig();
      } else {
        toast.error(data.error ?? "Falha ao testar conexão.");
      }
    } catch {
      toast.error("Falha de rede ao testar conexão.");
    } finally {
      setTesting(false);
    }
  };

  // ── Refresh ────────────────────────────────────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConfig();
    setRefreshing(false);
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const status = config?.connectionStatus ?? "not_configured";
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
              <p className="text-xs text-zinc-500">Integração via API Key — monitoramento e configuração global.</p>
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
          { label: "Status",            value: statusInfo.label,          icon: Activity,    color: "text-violet-400" },
          { label: "Webhook",           value: config?.webhookConfigured ? "Configurado" : "Pendente", icon: Zap, color: config?.webhookConfigured ? "text-emerald-400" : "text-amber-400" },
          { label: "Token expira em",   value: config?.tokenExpiry ? new Date(config.tokenExpiry).toLocaleDateString("pt-BR") : "—", icon: Clock, color: "text-zinc-400" },
          { label: "Última alteração",  value: config?.updatedAt  ? new Date(config.updatedAt).toLocaleDateString("pt-BR")  : "—", icon: BarChart2, color: "text-zinc-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-white/3 border-white/8">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider leading-tight">{label}</p>
                <Icon className={`w-3.5 h-3.5 ${color} shrink-0`} />
              </div>
              <p className="text-sm font-semibold text-white leading-tight">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Credenciais salvas ───────────────────────────────────── */}
      {config?.configured && (
        <Card className="bg-white/3 border-white/8">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              {status === "validated"
                ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                : <AlertCircle  className="w-4 h-4 text-amber-400" />}
              Credenciais configuradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <MaskedField label="Client ID"     value={config.clientId}     />
              <MaskedField label="Client Secret" value={config.clientSecret} />
              <MaskedField label="Account ID"    value={config.accountId}    />
              <MaskedField label="Webhook Secret" value={config.webhookSecret} />
            </div>
            {config.webhookUrl && (
              <div className="mt-4 pt-4 border-t border-white/6">
                <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1.5">URL do Webhook (configure na Kiwify)</p>
                <div className="flex items-center gap-2">
                  <code className="text-[11px] text-zinc-400 font-mono bg-white/4 rounded px-2 py-1 flex-1 truncate">
                    {config.webhookUrl}
                  </code>
                  <button
                    onClick={() => { void navigator.clipboard.writeText(config.webhookUrl ?? ""); toast.success("URL copiada."); }}
                    className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline"
                onClick={() => void handleTest()}
                disabled={testing}
                className="border-white/10 text-zinc-400 hover:text-white gap-1.5 text-xs h-8">
                {testing
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : status === "validated"
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    : <XCircle className="w-3.5 h-3.5" />}
                {testing ? "Testando..." : "Testar Conexão"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Formulário de credenciais ────────────────────────────── */}
      <Card className="bg-white/3 border-white/8">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-zinc-500" />
            {config?.configured ? "Atualizar credenciais" : "Configurar credenciais"}
          </CardTitle>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Encontre as credenciais em: Dashboard Kiwify → Apps → API → Criar API Key
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="h-32 skeleton-shimmer rounded-lg" />
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Client ID</Label>
                  <Input
                    value={clientId}
                    onChange={e => setClientId(e.target.value)}
                    placeholder="Cole o client_id da Kiwify"
                    className="bg-white/4 border-white/10 text-white placeholder:text-zinc-600 h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Client Secret</Label>
                  <Input
                    type="password"
                    value={clientSecret}
                    onChange={e => setClientSecret(e.target.value)}
                    placeholder="Cole o client_secret da Kiwify"
                    className="bg-white/4 border-white/10 text-white placeholder:text-zinc-600 h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Account ID</Label>
                  <Input
                    value={accountId}
                    onChange={e => setAccountId(e.target.value)}
                    placeholder="Cole o account_id da Kiwify"
                    className="bg-white/4 border-white/10 text-white placeholder:text-zinc-600 h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Webhook Secret <span className="text-zinc-600">(opcional)</span></Label>
                  <Input
                    type="password"
                    value={webhookSecret}
                    onChange={e => setWebhookSecret(e.target.value)}
                    placeholder="Token do webhook Kiwify"
                    className="bg-white/4 border-white/10 text-white placeholder:text-zinc-600 h-9 text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button size="sm"
                  onClick={() => void handleSave()}
                  disabled={saving || !clientId.trim() || !clientSecret.trim() || !accountId.trim()}
                  className="bg-primary/90 hover:bg-primary text-black font-semibold gap-1.5 text-xs h-8">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
                {config?.configured && (
                  <Button size="sm" variant="outline"
                    onClick={() => void handleTest()}
                    disabled={testing}
                    className="border-white/10 text-zinc-400 hover:text-white gap-1.5 text-xs h-8">
                    {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                    {testing ? "Testando..." : "Testar Conexão"}
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-zinc-600 leading-relaxed">
                Campos obrigatórios: Client ID, Client Secret, Account ID. Webhook Secret é necessário apenas para verificar assinatura dos eventos recebidos.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
