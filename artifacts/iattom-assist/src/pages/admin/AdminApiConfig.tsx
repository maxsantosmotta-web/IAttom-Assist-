import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Settings2, ArrowLeft, Save, Trash2, CheckCircle2, XCircle,
  Loader2, Eye, EyeOff, ShoppingBag, ShoppingCart, Flame,
  Zap, Phone, Instagram, Video, Copy, ExternalLink, Info,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/* ─── Types ─────────────────────────────────────────────────── */
type IntegrationKey = "shopee" | "ml" | "hotmart" | "kiwify" | "meta" | "whatsapp" | "tiktok";

interface AllConfigs {
  shopee:   { configured: boolean; isActive: boolean; partnerId: string; partnerKey: string; redirectUrl: string; environment: string; updatedAt: string | null };
  ml:       { configured: boolean; isActive: boolean; appId: string; clientSecret: string; redirectUri: string; siteId: string; updatedAt: string | null };
  hotmart:  { configured: boolean; isActive: boolean; clientId: string; clientSecret: string; basicToken: string; webhookToken: string; environment: string; updatedAt: string | null };
  kiwify:   { configured: boolean; isActive: boolean; storeId: string; clientId: string; clientSecret: string; webhookSecret: string; updatedAt: string | null };
  meta:     { configured: boolean; isActive: boolean; appId: string; appSecret: string; verifyToken: string; userAccessToken: string; webhookUrl: string; updatedAt: string | null };
  whatsapp: { configured: boolean; isActive: boolean; businessAccountId: string; phoneNumberId: string; accessToken: string; verifyToken: string; webhookUrl: string; updatedAt: string | null };
  tiktok:   { configured: boolean; isActive: boolean; clientKey: string; clientSecret: string; redirectUri: string; environment: string; updatedAt: string | null };
}

/* ─── SecretInput ────────────────────────────────────────────── */
function SecretInput({ label, name, value, onChange, placeholder, hint }: {
  label: string; name: string; value: string; onChange: (v: string) => void;
  placeholder?: string; hint?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <Label className="text-xs text-muted-foreground mb-1.5 block">{label}</Label>
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? "••••••••"}
          className="bg-[#0a0a0a] border-white/10 text-white pr-8 font-mono text-sm"
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
        >
          {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
      {hint && <p className="text-[10px] text-muted-foreground/50 mt-1">{hint}</p>}
    </div>
  );
}

function PlainInput({ label, name, value, onChange, placeholder, hint, readOnly }: {
  label: string; name: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; hint?: string; readOnly?: boolean;
}) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground mb-1.5 block">{label}</Label>
      <Input
        name={name}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`bg-[#0a0a0a] border-white/10 text-white ${readOnly ? "opacity-60 cursor-default font-mono text-xs" : ""}`}
      />
      {hint && <p className="text-[10px] text-muted-foreground/50 mt-1">{hint}</p>}
    </div>
  );
}

function CallbackBox({ url, label }: { url: string; label: string }) {
  const { toast } = useToast();
  return (
    <div className="p-3 rounded-lg bg-primary/5 border border-primary/15">
      <p className="text-[10px] text-primary uppercase tracking-widest font-medium mb-1.5">{label}</p>
      <div className="flex items-center gap-2">
        <code className="text-xs text-primary/80 font-mono flex-1 break-all leading-relaxed">{url}</code>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-primary shrink-0"
          onClick={() => { void navigator.clipboard.writeText(url); toast({ description: "URL copiada." }); }}>
          <Copy className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

function EnvSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground mb-1.5 block">{label}</Label>
      <div className="flex gap-2">
        {options.map(opt => (
          <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
            className={`flex-1 h-9 rounded-lg border text-xs font-medium transition-all ${
              value === opt.value
                ? "bg-primary/15 text-primary border-primary/30"
                : "bg-white/3 text-muted-foreground border-white/10 hover:border-white/20"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── FormActions ────────────────────────────────────────────── */
function FormActions({ onSave, onTest, onClear, saving, testing }: {
  onSave: () => void; onTest: () => void; onClear: () => void;
  saving: boolean; testing: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-white/5">
      <Button onClick={onSave} disabled={saving || testing}
        className="bg-primary text-black hover:bg-primary/90 font-semibold gap-1.5 h-8 text-xs">
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        Salvar credenciais
      </Button>
      <Button onClick={onTest} disabled={saving || testing} variant="outline"
        className="border-white/10 text-muted-foreground hover:text-white gap-1.5 h-8 text-xs">
        {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
        Testar configuração
      </Button>
      <Button onClick={onClear} disabled={saving || testing} variant="ghost"
        className="text-red-400/70 hover:text-red-400 gap-1.5 h-8 text-xs ml-auto">
        <Trash2 className="w-3.5 h-3.5" /> Limpar
      </Button>
    </div>
  );
}

/* ─── Tab meta ───────────────────────────────────────────────── */
const TABS: { id: IntegrationKey; label: string; icon: typeof ShoppingBag; color: string }[] = [
  { id: "shopee",   label: "Shopee",          icon: ShoppingBag,  color: "text-orange-400" },
  { id: "ml",       label: "Mercado Livre",   icon: ShoppingCart, color: "text-amber-400"  },
  { id: "hotmart",  label: "Hotmart",         icon: Flame,        color: "text-red-400"    },
  { id: "kiwify",   label: "Kiwify",          icon: Zap,          color: "text-violet-400" },
  { id: "whatsapp", label: "WhatsApp",        icon: Phone,        color: "text-emerald-400"},
  { id: "meta",     label: "Meta (IG + FB)",  icon: Instagram,    color: "text-pink-400"   },
  { id: "tiktok",   label: "TikTok",          icon: Video,        color: "text-cyan-400"   },
];

/* ─── AdminApiConfig ─────────────────────────────────────────── */
export function AdminApiConfig() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const origin = window.location.origin;

  const [activeTab, setActiveTab] = useState<IntegrationKey>("shopee");
  const [configs, setConfigs] = useState<AllConfigs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [shopeeForm,   setShopeeForm]   = useState({ partnerId: "", partnerKey: "", redirectUrl: `${origin}${BASE}/api/shopee/oauth/callback`, environment: "production" });
  const [mlForm,       setMlForm]       = useState({ appId: "", clientSecret: "", redirectUri: `${origin}${BASE}/api/ml/oauth-callback`, siteId: "MLB" });
  const [hotmartForm,  setHotmartForm]  = useState({ clientId: "", clientSecret: "", basicToken: "", webhookToken: "", environment: "sandbox" });
  const [kiwifyForm,   setKiwifyForm]   = useState({ storeId: "", clientId: "", clientSecret: "", webhookSecret: "" });
  const [metaForm,     setMetaForm]     = useState({ appId: "", appSecret: "", verifyToken: "", userAccessToken: "", webhookUrl: `${origin}${BASE}/api/meta/webhook` });
  const [whatsappForm, setWhatsappForm] = useState({ businessAccountId: "", phoneNumberId: "", accessToken: "", verifyToken: "", webhookUrl: `${origin}${BASE}/api/whatsapp/webhook` });
  const [tiktokForm,   setTiktokForm]   = useState({ clientKey: "", clientSecret: "", redirectUri: `${origin}${BASE}/api/tiktok/oauth/callback`, environment: "sandbox" });

  const loadConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<AllConfigs>("/api/admin/integrations/config");
      setConfigs(data);
      setShopeeForm(f   => ({ ...f, partnerId: data.shopee.partnerId,   partnerKey: data.shopee.partnerKey,   redirectUrl: data.shopee.redirectUrl || f.redirectUrl }));
      setMlForm(f       => ({ ...f, appId: data.ml.appId,               clientSecret: data.ml.clientSecret,   redirectUri: data.ml.redirectUri || f.redirectUri, siteId: data.ml.siteId || "MLB" }));
      setHotmartForm(f  => ({ ...f, clientId: data.hotmart.clientId,    clientSecret: data.hotmart.clientSecret, basicToken: data.hotmart.basicToken, webhookToken: data.hotmart.webhookToken, environment: data.hotmart.environment || "sandbox" }));
      setKiwifyForm(f   => ({ ...f, storeId: data.kiwify.storeId,       clientId: data.kiwify.clientId,       clientSecret: data.kiwify.clientSecret, webhookSecret: data.kiwify.webhookSecret }));
      setMetaForm(f     => ({ ...f, appId: data.meta.appId,             appSecret: data.meta.appSecret,       verifyToken: data.meta.verifyToken, userAccessToken: data.meta.userAccessToken, webhookUrl: data.meta.webhookUrl || f.webhookUrl }));
      setWhatsappForm(f => ({ ...f, businessAccountId: data.whatsapp.businessAccountId, phoneNumberId: data.whatsapp.phoneNumberId, accessToken: data.whatsapp.accessToken, verifyToken: data.whatsapp.verifyToken, webhookUrl: data.whatsapp.webhookUrl || f.webhookUrl }));
      setTiktokForm(f   => ({ ...f, clientKey: data.tiktok.clientKey,   clientSecret: data.tiktok.clientSecret, redirectUri: data.tiktok.redirectUri || f.redirectUri, environment: data.tiktok.environment || "sandbox" }));
    } catch {
      toast({ variant: "destructive", description: "Falha ao carregar configurações." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void loadConfigs(); }, [loadConfigs]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const integration = params.get("integration") as IntegrationKey | null;
    if (integration && TABS.some(t => t.id === integration)) {
      setActiveTab(integration);
    }
  }, []);

  const save = async (integration: IntegrationKey, body: Record<string, string>) => {
    setSaving(true);
    try {
      await apiFetch(`/api/admin/integrations/config/${integration}`, { method: "POST", body: JSON.stringify(body) });
      toast({ description: `Credenciais ${TABS.find(t => t.id === integration)?.label} salvas com sucesso.` });
      void loadConfigs();
    } catch (err) {
      toast({ variant: "destructive", description: err instanceof Error ? err.message : "Falha ao salvar." });
    } finally {
      setSaving(false);
    }
  };

  const test = async (integration: IntegrationKey) => {
    setTesting(true);
    try {
      const data = await apiFetch<{ ok: boolean; message: string }>(`/api/admin/integrations/config/${integration}/test`, { method: "POST" });
      toast({ description: data.message, variant: data.ok ? "default" : "destructive" });
    } catch (err) {
      toast({ variant: "destructive", description: err instanceof Error ? err.message : "Falha no teste." });
    } finally {
      setTesting(false);
    }
  };

  const clear = async (integration: IntegrationKey) => {
    setSaving(true);
    try {
      await apiFetch(`/api/admin/integrations/config/${integration}`, { method: "DELETE" });
      toast({ description: `Credenciais ${TABS.find(t => t.id === integration)?.label} removidas.` });
      void loadConfigs();
    } catch (err) {
      toast({ variant: "destructive", description: err instanceof Error ? err.message : "Falha ao limpar." });
    } finally {
      setSaving(false);
    }
  };

  const configStatus = (id: IntegrationKey) => configs?.[id];

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

        {/* ── Header ────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
          <div className="flex items-start gap-3">
            <button onClick={() => navigate("/admin/integrations")}
              className="mt-0.5 text-muted-foreground hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Settings2 className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-bold text-white">Configuração de APIs</h1>
                <Badge className="bg-red-500/15 text-red-400 border-red-500/20 text-[10px]">ADMIN</Badge>
              </div>
              <p className="text-sm text-muted-foreground ml-7">
                Cadastre as credenciais oficiais das plataformas para ativar conexões reais no IAttom Assist.
              </p>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => void loadConfigs()} disabled={loading}
            className="h-7 px-2.5 text-muted-foreground hover:text-white gap-1.5 text-xs shrink-0">
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Settings2 className="w-3 h-3" />}
            Recarregar
          </Button>
        </div>

        {/* Security note */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-white/3 border border-white/6 ml-7">
          <Shield className="w-3.5 h-3.5 text-primary/60 shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
            Credenciais salvas no banco de dados com mascaramento. Secrets nunca são expostos no painel do usuário.
            Ao editar, deixe um campo inalterado para preservar o valor atual.
          </p>
        </div>

        {/* ── Tab bar ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-1.5 p-1.5 bg-[#111111] border border-white/[0.06] rounded-xl ml-7">
          {TABS.map(({ id, label, icon: Icon, color }) => {
            const cfg = configStatus(id);
            return (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === id ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white"
                }`}
              >
                <Icon className={`w-3 h-3 ${color}`} />
                {label}
                {cfg && (
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.configured ? "bg-emerald-400" : "bg-zinc-600"}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Tab content ──────────────────────────────────────── */}
        <div className="ml-7">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Carregando configurações...</span>
            </div>
          ) : (
            <>
              {/* ── SHOPEE ──────────────────────────────────────── */}
              {activeTab === "shopee" && (
                <Card className="bg-[#111111] border-white/[0.06]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-orange-400" />
                      Shopee Open Platform
                      {configs?.shopee.configured && <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[10px]">Configurado</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CallbackBox url={shopeeForm.redirectUrl || `${origin}${BASE}/api/shopee/oauth/callback`} label="Callback URL — cadastre em Shopee Open Platform" />
                    <div className="grid sm:grid-cols-2 gap-4">
                      <PlainInput label="Partner ID" name="partnerId" value={shopeeForm.partnerId}
                        onChange={v => setShopeeForm(f => ({ ...f, partnerId: v }))} placeholder="Ex: 1234567" />
                      <SecretInput label="Partner Key" name="partnerKey" value={shopeeForm.partnerKey}
                        onChange={v => setShopeeForm(f => ({ ...f, partnerKey: v }))} placeholder="Chave secreta do parceiro" />
                    </div>
                    <PlainInput label="Redirect URI / Callback URL" name="redirectUrl" value={shopeeForm.redirectUrl}
                      onChange={v => setShopeeForm(f => ({ ...f, redirectUrl: v }))}
                      hint="Deve ser cadastrada exatamente como está no Shopee Open Platform" />
                    <EnvSelect label="Ambiente" value={shopeeForm.environment} onChange={v => setShopeeForm(f => ({ ...f, environment: v }))}
                      options={[{ value: "sandbox", label: "Sandbox" }, { value: "production", label: "Produção" }]} />
                    <FormActions
                      onSave={() => void save("shopee", shopeeForm)}
                      onTest={() => void test("shopee")}
                      onClear={() => void clear("shopee")}
                      saving={saving} testing={testing}
                    />
                  </CardContent>
                </Card>
              )}

              {/* ── MERCADO LIVRE ────────────────────────────────── */}
              {activeTab === "ml" && (
                <Card className="bg-[#111111] border-white/[0.06]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-amber-400" />
                      Mercado Livre API
                      {configs?.ml.configured && <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[10px]">Configurado</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CallbackBox url={mlForm.redirectUri || `${origin}${BASE}/api/ml/oauth-callback`} label="Callback URL — cadastre no Mercado Livre Developers" />
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                      <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-emerald-300/80">Mercado Livre já aparece conectado. Altere credenciais apenas se necessário — isso não reinicia tokens existentes.</p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <PlainInput label="Client ID (App ID)" name="appId" value={mlForm.appId}
                        onChange={v => setMlForm(f => ({ ...f, appId: v }))} placeholder="Ex: 1234567890" />
                      <SecretInput label="Client Secret" name="clientSecret" value={mlForm.clientSecret}
                        onChange={v => setMlForm(f => ({ ...f, clientSecret: v }))} />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <PlainInput label="Redirect URI / Callback URL" name="redirectUri" value={mlForm.redirectUri}
                        onChange={v => setMlForm(f => ({ ...f, redirectUri: v }))} />
                      <PlainInput label="Site ID" name="siteId" value={mlForm.siteId}
                        onChange={v => setMlForm(f => ({ ...f, siteId: v }))} placeholder="MLB" hint="MLB para Brasil" />
                    </div>
                    <FormActions
                      onSave={() => void save("ml", mlForm)}
                      onTest={() => void test("ml")}
                      onClear={() => void clear("ml")}
                      saving={saving} testing={testing}
                    />
                  </CardContent>
                </Card>
              )}

              {/* ── HOTMART ──────────────────────────────────────── */}
              {activeTab === "hotmart" && (
                <Card className="bg-[#111111] border-white/[0.06]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                      <Flame className="w-4 h-4 text-red-400" />
                      Hotmart
                      {configs?.hotmart.configured && <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[10px]">Configurado</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CallbackBox url={`${origin}${BASE}/api/hotmart/webhook`} label="Webhook URL — cadastre no Hotmart Club" />
                    <div className="grid sm:grid-cols-2 gap-4">
                      <PlainInput label="Client ID" name="clientId" value={hotmartForm.clientId}
                        onChange={v => setHotmartForm(f => ({ ...f, clientId: v }))} />
                      <SecretInput label="Client Secret" name="clientSecret" value={hotmartForm.clientSecret}
                        onChange={v => setHotmartForm(f => ({ ...f, clientSecret: v }))} />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <SecretInput label="Basic Token" name="basicToken" value={hotmartForm.basicToken}
                        onChange={v => setHotmartForm(f => ({ ...f, basicToken: v }))}
                        hint="Base64 de client_id:client_secret" />
                      <SecretInput label="Webhook Secret (Hottok)" name="webhookToken" value={hotmartForm.webhookToken}
                        onChange={v => setHotmartForm(f => ({ ...f, webhookToken: v }))} />
                    </div>
                    <EnvSelect label="Ambiente" value={hotmartForm.environment} onChange={v => setHotmartForm(f => ({ ...f, environment: v }))}
                      options={[{ value: "sandbox", label: "Sandbox" }, { value: "production", label: "Produção" }]} />
                    <FormActions
                      onSave={() => void save("hotmart", hotmartForm)}
                      onTest={() => void test("hotmart")}
                      onClear={() => void clear("hotmart")}
                      saving={saving} testing={testing}
                    />
                  </CardContent>
                </Card>
              )}

              {/* ── KIWIFY ───────────────────────────────────────── */}
              {activeTab === "kiwify" && (
                <Card className="bg-[#111111] border-white/[0.06]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-violet-400" />
                      Kiwify
                      {configs?.kiwify.configured && <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[10px]">Configurado</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CallbackBox url={`${origin}${BASE}/api/kiwify/webhook`} label="Webhook URL — cadastre no painel Kiwify" />
                    <div className="grid sm:grid-cols-2 gap-4">
                      <PlainInput label="Store ID" name="storeId" value={kiwifyForm.storeId}
                        onChange={v => setKiwifyForm(f => ({ ...f, storeId: v }))} />
                      <PlainInput label="Client ID" name="clientId" value={kiwifyForm.clientId}
                        onChange={v => setKiwifyForm(f => ({ ...f, clientId: v }))} />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <SecretInput label="Client Secret" name="clientSecret" value={kiwifyForm.clientSecret}
                        onChange={v => setKiwifyForm(f => ({ ...f, clientSecret: v }))} />
                      <SecretInput label="Webhook Secret" name="webhookSecret" value={kiwifyForm.webhookSecret}
                        onChange={v => setKiwifyForm(f => ({ ...f, webhookSecret: v }))} />
                    </div>
                    <FormActions
                      onSave={() => void save("kiwify", kiwifyForm)}
                      onTest={() => void test("kiwify")}
                      onClear={() => void clear("kiwify")}
                      saving={saving} testing={testing}
                    />
                  </CardContent>
                </Card>
              )}

              {/* ── WHATSAPP ─────────────────────────────────────── */}
              {activeTab === "whatsapp" && (
                <Card className="bg-[#111111] border-white/[0.06]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-400" />
                      WhatsApp Cloud API
                      {configs?.whatsapp.configured && <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[10px]">Configurado</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CallbackBox url={whatsappForm.webhookUrl} label="Webhook URL — configure no Meta Developers" />
                    <div className="grid sm:grid-cols-2 gap-4">
                      <PlainInput label="Meta App ID" name="metaAppId" value={metaForm.appId}
                        onChange={v => setMetaForm(f => ({ ...f, appId: v }))}
                        hint="Compartilhado com Instagram e Facebook" />
                      <SecretInput label="Meta App Secret" name="metaAppSecret" value={metaForm.appSecret}
                        onChange={v => setMetaForm(f => ({ ...f, appSecret: v }))} />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <PlainInput label="WhatsApp Business Account ID" name="businessAccountId" value={whatsappForm.businessAccountId}
                        onChange={v => setWhatsappForm(f => ({ ...f, businessAccountId: v }))} />
                      <PlainInput label="Phone Number ID" name="phoneNumberId" value={whatsappForm.phoneNumberId}
                        onChange={v => setWhatsappForm(f => ({ ...f, phoneNumberId: v }))} />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <SecretInput label="Access Token (permanente)" name="accessToken" value={whatsappForm.accessToken}
                        onChange={v => setWhatsappForm(f => ({ ...f, accessToken: v }))} />
                      <SecretInput label="Verify Token (webhook)" name="verifyToken" value={whatsappForm.verifyToken}
                        onChange={v => setWhatsappForm(f => ({ ...f, verifyToken: v }))}
                        hint="Token criado por você para validação do webhook" />
                    </div>
                    <FormActions
                      onSave={async () => {
                        await Promise.all([
                          save("meta", { appId: metaForm.appId, appSecret: metaForm.appSecret, verifyToken: metaForm.verifyToken, userAccessToken: metaForm.userAccessToken, webhookUrl: metaForm.webhookUrl }),
                          save("whatsapp", whatsappForm),
                        ]);
                      }}
                      onTest={() => void test("whatsapp")}
                      onClear={() => void clear("whatsapp")}
                      saving={saving} testing={testing}
                    />
                  </CardContent>
                </Card>
              )}

              {/* ── META (IG + FB) ────────────────────────────────── */}
              {activeTab === "meta" && (
                <Card className="bg-[#111111] border-white/[0.06]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                      <Instagram className="w-4 h-4 text-pink-400" />
                      Meta — Instagram + Facebook
                      {configs?.meta.configured && <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[10px]">Configurado</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CallbackBox url={`${origin}${BASE}/api/meta/oauth/callback`} label="Callback OAuth — cadastre no Meta Developers" />
                    <CallbackBox url={metaForm.webhookUrl} label="Webhook URL — configure no Meta Developers" />
                    <div className="grid sm:grid-cols-2 gap-4">
                      <PlainInput label="Meta App ID" name="appId" value={metaForm.appId}
                        onChange={v => setMetaForm(f => ({ ...f, appId: v }))} />
                      <SecretInput label="Meta App Secret" name="appSecret" value={metaForm.appSecret}
                        onChange={v => setMetaForm(f => ({ ...f, appSecret: v }))} />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <SecretInput label="Verify Token (webhook)" name="verifyToken" value={metaForm.verifyToken}
                        onChange={v => setMetaForm(f => ({ ...f, verifyToken: v }))}
                        hint="Token criado por você para validação do webhook" />
                      <SecretInput label="User Access Token" name="userAccessToken" value={metaForm.userAccessToken}
                        onChange={v => setMetaForm(f => ({ ...f, userAccessToken: v }))}
                        hint="Token de longa duração da conta conectada" />
                    </div>
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/15">
                      <ExternalLink className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-blue-300/80">Um único App Meta cobre Instagram Business, Facebook Pages e WhatsApp. Estas credenciais são compartilhadas entre os três módulos.</p>
                    </div>
                    <FormActions
                      onSave={() => void save("meta", metaForm)}
                      onTest={() => void test("meta")}
                      onClear={() => void clear("meta")}
                      saving={saving} testing={testing}
                    />
                  </CardContent>
                </Card>
              )}

              {/* ── TIKTOK ───────────────────────────────────────── */}
              {activeTab === "tiktok" && (
                <Card className="bg-[#111111] border-white/[0.06]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                      <Video className="w-4 h-4 text-cyan-400" />
                      TikTok for Developers
                      {configs?.tiktok.configured && <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[10px]">Configurado</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CallbackBox url={tiktokForm.redirectUri || `${origin}${BASE}/api/tiktok/oauth/callback`} label="Callback URL — cadastre no TikTok for Developers" />
                    <div className="grid sm:grid-cols-2 gap-4">
                      <PlainInput label="Client Key" name="clientKey" value={tiktokForm.clientKey}
                        onChange={v => setTiktokForm(f => ({ ...f, clientKey: v }))} />
                      <SecretInput label="Client Secret" name="clientSecret" value={tiktokForm.clientSecret}
                        onChange={v => setTiktokForm(f => ({ ...f, clientSecret: v }))} />
                    </div>
                    <PlainInput label="Redirect URI / Callback URL" name="redirectUri" value={tiktokForm.redirectUri}
                      onChange={v => setTiktokForm(f => ({ ...f, redirectUri: v }))} />
                    <EnvSelect label="Ambiente" value={tiktokForm.environment} onChange={v => setTiktokForm(f => ({ ...f, environment: v }))}
                      options={[{ value: "sandbox", label: "Sandbox" }, { value: "production", label: "Produção" }]} />
                    <FormActions
                      onSave={() => void save("tiktok", tiktokForm)}
                      onTest={() => void test("tiktok")}
                      onClear={() => void clear("tiktok")}
                      saving={saving} testing={testing}
                    />
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
