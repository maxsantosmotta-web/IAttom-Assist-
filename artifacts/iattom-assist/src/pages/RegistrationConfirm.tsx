import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { LogoMark } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2 } from "lucide-react";

export function RegistrationConfirm() {
  const { user, isLoaded: clerkLoaded } = useUser();
  const { getToken } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: me, isLoading: meLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), staleTime: 0 },
  });

  const defaultName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`.trim()
      : user?.firstName ?? user?.fullName ?? "";

  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (defaultName && !name) setName(defaultName);
  }, [defaultName]);

  useEffect(() => {
    if (!meLoading && me?.registrationConfirmed) {
      navigate(me.planSelected ? "/dashboard" : "/dashboard/billing", { replace: true });
    }
  }, [me, meLoading, navigate]);

  const email = user?.primaryEmailAddress?.emailAddress ?? me?.email ?? "";

  const canSubmit =
    name.trim().length > 0 &&
    email.length > 0 &&
    termsAccepted &&
    privacyAccepted;

  const handleSubmit = async () => {
    if (!canSubmit || pending) return;
    setPending(true);
    try {
      const token = await getToken();
      const base = import.meta.env.BASE_URL ?? "/";
      const res = await fetch(`${base}api/user/confirm-registration`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error("Falha ao confirmar cadastro");
      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      navigate("/dashboard/billing", { replace: true });
    } catch {
      toast({
        title: "Erro ao confirmar cadastro",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setPending(false);
    }
  };

  if (!clerkLoaded || meLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <LogoMark size={48} />
        </div>

        <div className="relative rounded-2xl border border-white/[0.08] bg-[#111111] overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-primary/[0.04] to-transparent pointer-events-none" />

          <div className="p-8">
            <div className="flex items-center gap-2.5 mb-1">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <h1 className="text-xl font-bold text-white">Confirme seu cadastro</h1>
            </div>
            <p className="text-sm text-zinc-500 mb-7 ml-[29px]">
              Revise seus dados antes de continuar.
            </p>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400 font-medium uppercase tracking-wide">
                  Nome <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="bg-[#0a0a0a] border-white/10 text-white placeholder:text-zinc-600 focus:border-primary/40 focus:ring-primary/20 h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400 font-medium uppercase tracking-wide">
                  E-mail <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={email}
                  readOnly
                  className="bg-[#0a0a0a] border-white/[0.06] text-zinc-400 cursor-not-allowed h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400 font-medium uppercase tracking-wide">
                  Telefone <span className="text-zinc-600">(opcional)</span>
                </Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+55 (11) 99999-9999"
                  type="tel"
                  className="bg-[#0a0a0a] border-white/10 text-white placeholder:text-zinc-600 focus:border-primary/40 focus:ring-primary/20 h-10"
                />
              </div>

              <div className="pt-2 space-y-4 border-t border-white/[0.06]">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(v) => setTermsAccepted(!!v)}
                    className="mt-0.5 border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <label htmlFor="terms" className="text-sm text-zinc-400 leading-snug cursor-pointer select-none">
                    Li e aceito os{" "}
                    <a
                      href="/termos"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Termos de Uso
                    </a>
                  </label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="privacy"
                    checked={privacyAccepted}
                    onCheckedChange={(v) => setPrivacyAccepted(!!v)}
                    className="mt-0.5 border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <label htmlFor="privacy" className="text-sm text-zinc-400 leading-snug cursor-pointer select-none">
                    Li e aceito a{" "}
                    <a
                      href="/privacidade"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Política de Privacidade
                    </a>
                  </label>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || pending}
                className="w-full h-11 mt-2 bg-primary hover:bg-primary/90 text-black font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {pending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Continuar"
                )}
              </Button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-700 mt-6">
          IAttom Assist &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
