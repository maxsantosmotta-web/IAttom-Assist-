import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Instagram as InstagramIcon, Loader2, X, Info, Users,
  RefreshCw, BarChart2, TrendingUp, Link2,
  CheckCircle2, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw Object.assign(new Error(body.error ?? `HTTP ${res.status}`), { status: res.status });
  }
  return res.json() as Promise<T>;
}

function InformativeModal({
  title,
  description,
  onClose,
}: {
  title: string;
  description: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#111111] border border-white/10 rounded-xl w-full max-w-md p-6 space-y-4"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Info className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm font-semibold text-white">{title}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        <Button onClick={onClose} className="w-full bg-primary text-black hover:bg-primary/90 font-semibold">
          Entendido
        </Button>
      </motion.div>
    </div>
  );
}

interface MetaIgAccount {
  id: number;
  igId: string;
  name?: string | null;
  username?: string | null;
  followersCount?: string | null;
}

interface MetaEvent {
  id: number;
  platform?: string | null;
  eventType?: string | null;
  objectId?: string | null;
  receivedAt?: string | null;
}

export function Instagram() {
  const { toast } = useToast();

  const [igAccounts, setIgAccounts] = useState<MetaIgAccount[]>([]);
  const [events, setEvents] = useState<MetaEvent[]>([]);
  const [loadingIg, setLoadingIg] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [modal, setModal] = useState<{ title: string; description: string } | null>(null);

  const showInfo = (title: string, description: string) => setModal({ title, description });

  const loadData = useCallback(async () => {
    setLoadingIg(true);
    setLoadingEvents(true);
    try {
      const [igs, evs] = await Promise.allSettled([
        apiFetch<MetaIgAccount[]>("/api/meta/instagram-accounts"),
        apiFetch<MetaEvent[]>("/api/meta/events"),
      ]);
      if (igs.status === "fulfilled") setIgAccounts(igs.value);
      if (evs.status === "fulfilled") setEvents(evs.value.filter(e => e.platform === "instagram"));
    } finally {
      setLoadingIg(false);
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const handleConnect = () => {
    showInfo(
      "Conectar Instagram",
      "A integração com Instagram requer configuração do Meta App (App ID + App Secret) pelo administrador da plataforma. Conecte um perfil Instagram Business vinculado a uma Página Facebook. Esta função está preparada para próxima etapa.",
    );
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await apiFetch<{ ok: boolean }>("/api/meta/sync-pages", { method: "POST" });
      toast({ description: "Sincronização de contas Instagram concluída." });
      void loadData();
    } catch (err) {
      const e = err as { status?: number };
      if (e.status === 403 || e.status === 401) {
        showInfo(
          "Sincronizar Instagram",
          "A sincronização de contas é uma operação administrativa. Configure o Meta App no painel ADM e realize a sincronização por lá.",
        );
      } else {
        toast({ description: "Sincronização disponível após configuração do Meta App." });
      }
    } finally {
      setSyncing(false);
    }
  };

  const isConnected = igAccounts.length > 0;
  const igEvents = events;
  const totalFollowers = igAccounts.reduce((sum, a) => sum + (parseInt(a.followersCount ?? "0") || 0), 0);

  return (
    <div className="space-y-6">
      {modal && (
        <InformativeModal
          title={modal.title}
          description={modal.description}
          onClose={() => setModal(null)}
        />
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/15 to-pink-500/15 border border-pink-500/20 flex items-center justify-center">
              <InstagramIcon className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Instagram</h1>
              <p className="text-xs text-muted-foreground">Contas Business, sincronização e monitoramento</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline"
              onClick={() => void handleSync()}
              disabled={syncing}
              className="border-white/10 text-muted-foreground hover:text-white">
              {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <RefreshCw className="w-3.5 h-3.5 mr-2" />}
              Sincronizar
            </Button>
            <Button size="sm"
              onClick={handleConnect}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold">
              <Link2 className="w-3.5 h-3.5 mr-2" />
              Conectar Instagram
            </Button>
          </div>
        </div>

        {/* Status */}
        <Card className="bg-[#111111] border-white/[0.06] mb-5">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                {isConnected
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  : <InstagramIcon className="w-4 h-4 text-muted-foreground" />}
                <span className="text-sm font-semibold text-white">
                  {isConnected ? `${igAccounts.length} conta(s) conectada(s)` : "Nenhuma conta Instagram conectada"}
                </span>
              </div>
              {isConnected
                ? <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs">Conectado</Badge>
                : <Badge className="bg-zinc-500/15 text-zinc-400 border-zinc-500/30 text-xs">Não conectado</Badge>}
              {!isConnected && (
                <Button size="sm" variant="outline"
                  onClick={handleConnect}
                  className="ml-auto border-pink-500/30 text-pink-400 hover:bg-pink-500/10 text-xs h-7">
                  <Link2 className="w-3 h-3 mr-1.5" />
                  Conectar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { icon: InstagramIcon, label: "Contas IG", value: String(igAccounts.length), color: "text-pink-400" },
            { icon: Users, label: "Seguidores", value: totalFollowers > 0 ? totalFollowers.toLocaleString("pt-BR") : "—", color: "text-primary" },
            { icon: MessageSquare, label: "Eventos IG", value: String(igEvents.length), color: "text-blue-400" },
            { icon: BarChart2, label: "Engajamento", value: "—", color: "text-muted-foreground" },
          ].map(({ icon: Icon, label, value, color }) => (
            <Card key={label} className="bg-[#111111] border-white/[0.06]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                </div>
                <p className="text-xl font-bold text-white">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contas IG */}
        <Card className="bg-[#111111] border-white/[0.06] mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <InstagramIcon className="w-4 h-4 text-muted-foreground" />
                Contas Instagram Business
                {igAccounts.length > 0 && (
                  <Badge className="bg-pink-500/15 text-pink-400 border-pink-500/30 text-xs">{igAccounts.length}</Badge>
                )}
              </CardTitle>
              <Button size="sm" variant="ghost"
                onClick={() => void handleSync()}
                disabled={syncing || loadingIg}
                className="text-muted-foreground hover:text-white h-7 px-2">
                {loadingIg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingIg ? (
              <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Carregando contas...</span>
              </div>
            ) : igAccounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <InstagramIcon className="w-10 h-10 text-white/10 mb-3" />
                <p className="text-sm font-semibold text-muted-foreground">Nenhuma conta Instagram conectada</p>
                <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
                  Conecte um perfil Instagram Business vinculado a uma Página Facebook.
                </p>
                <Button size="sm" onClick={handleConnect}
                  className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold">
                  <Link2 className="w-3.5 h-3.5 mr-2" />
                  Conectar Instagram
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {igAccounts.map((acc) => (
                  <div key={acc.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#0d0d0d] border border-white/5 hover:border-white/10 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center shrink-0">
                      <InstagramIcon className="w-4 h-4 text-pink-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {acc.username ? `@${acc.username}` : acc.name ?? "—"}
                      </p>
                      {acc.followersCount && (
                        <p className="text-xs text-muted-foreground">{acc.followersCount} seguidores</p>
                      )}
                    </div>
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs">Ativa</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monitoramento */}
        <Card className="bg-[#111111] border-white/[0.06] mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-muted-foreground" />
              Monitoramento
              <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/30 text-[10px]">Em breve</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Alcance", value: "—" },
                { label: "Visualizações", value: "—" },
                { label: "Cliques", value: "—" },
                { label: "Engajamento", value: "—" },
                { label: "Conteúdos", value: "—" },
                { label: "Avisos", value: "—" },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 rounded-lg bg-white/5 border border-white/5 text-center">
                  <p className="text-lg font-bold text-white">{value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground/60 mt-3 text-center">
              Métricas detalhadas disponíveis após integração com a API Meta Graph.
            </p>
          </CardContent>
        </Card>

        {/* Eventos */}
        <Card className="bg-[#111111] border-white/[0.06]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                Eventos Recentes
                {igEvents.length > 0 && (
                  <Badge className="bg-primary/15 text-primary border-primary/20 text-xs">{igEvents.length}</Badge>
                )}
              </CardTitle>
              <Button size="sm" variant="ghost"
                onClick={() => void loadData()}
                disabled={loadingEvents}
                className="text-muted-foreground hover:text-white h-7 px-2">
                {loadingEvents ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {igEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-pink-500/5 border border-pink-500/10 flex items-center justify-center mb-3">
                  <TrendingUp className="w-5 h-5 text-pink-400/30" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground">Nenhum evento registrado</p>
                <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
                  Configure o webhook Meta para receber notificações do Instagram.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {igEvents.slice(0, 10).map((ev) => (
                  <div key={ev.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#0d0d0d] border border-white/5">
                    <Badge className="bg-pink-500/15 text-pink-400 border-pink-500/30 text-xs border shrink-0">IG</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{ev.eventType ?? "—"}</p>
                      {ev.objectId && (
                        <p className="text-[10px] text-muted-foreground font-mono">{ev.objectId}</p>
                      )}
                    </div>
                    {ev.receivedAt && (
                      <span className="text-xs text-muted-foreground/60 shrink-0 tabular-nums">
                        {new Date(ev.receivedAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </motion.div>
    </div>
  );
}
