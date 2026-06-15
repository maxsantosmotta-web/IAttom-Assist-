import { useState, useEffect, useRef } from "react";
import { useUser, useAuth } from "@clerk/react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { LogoMark } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, Mail, X } from "lucide-react";

export function VerifyEmail() {
  const { user, isLoaded: clerkLoaded } = useUser();
  const { getToken, signOut } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: me, isLoading: meLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), staleTime: 0 },
  });

  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sending, setSending] = useState(false);
  const initialized = useRef(false);

  const isGoogleUser = (user?.externalAccounts ?? []).some(
    (a) => a.provider === "google"
  );

  const handleExit = async () => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.includes("onboarding") ||
          key.includes("registration") ||
          key.includes("verification") ||
          key.includes("auth_flow") ||
          key.includes("clerk"))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    sessionStorage.removeItem("onboarding");
    sessionStorage.removeItem("registration");
    sessionStorage.removeItem("verification");
    sessionStorage.removeItem("auth_flow");

    try {
      await signOut();
    } catch {
      // ignore
    }

    navigate("/sign-up", { replace: true });
  };

  const confirmRegistration = async () => {
    const token = await getToken();
    const base = import.meta.env.BASE_URL ?? "/";
    await fetch(`${base}api/user/confirm-registration`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    navigate("/dashboard/billing", { replace: true });
  };

  const sendCode = async () => {
    if (!user?.primaryEmailAddress) return;
    setSending(true);
    try {
      await user.primaryEmailAddress.prepareVerification({ strategy: "email_code" });
      setCodeSent(true);
    } catch {
      toast({
        title: "Erro ao enviar código",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!clerkLoaded || meLoading || !user || !me) return;
    if (initialized.current) return;
    initialized.current = true;

    if (me.registrationConfirmed) {
      navigate(me.planSelected ? "/dashboard" : "/dashboard/billing", { replace: true });
      return;
    }

    if (!isGoogleUser) {
      confirmRegistration().catch(() => {
        toast({ title: "Erro", description: "Tente novamente.", variant: "destructive" });
      });
    } else {
      sendCode();
    }
  }, [clerkLoaded, meLoading, user, me]);

  const handleVerify = async () => {
    if (code.length !== 6 || verifying || !user?.primaryEmailAddress) return;
    setVerifying(true);
    try {
      const result = await user.primaryEmailAddress.attemptVerification({ code });
      if (result.verification.status === "verified") {
        await confirmRegistration();
      } else {
        toast({
          title: "Código inválido",
          description: "Verifique o código e tente novamente.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Código incorreto",
        description: "Verifique o código recebido e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  if (!clerkLoaded || meLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
      </div>
    );
  }

  if (!isGoogleUser) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
      </div>
    );
  }

  const email = user?.primaryEmailAddress?.emailAddress ?? me?.email ?? "";

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
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <h1 className="text-xl font-bold text-white">Verificação de e-mail</h1>
              </div>
              <button
                onClick={handleExit}
                title="Cancelar e voltar ao início"
                className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors -mr-1 -mt-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!codeSent ? (
              <>
                <p className="text-sm text-zinc-500 mb-7 mt-2 ml-[29px]">
                  Vamos enviar um código para confirmar seu cadastro.
                  <br />
                  <span className="text-zinc-300">{email}</span>
                </p>
                <Button
                  onClick={sendCode}
                  disabled={sending}
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-black font-bold text-sm disabled:opacity-40"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Enviar código
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-zinc-500 mb-6 mt-2 ml-[29px]">
                  Código enviado para
                  <br />
                  <span className="text-zinc-300">{email}</span>
                </p>

                <div className="space-y-4">
                  <Input
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="000000"
                    maxLength={6}
                    autoFocus
                    className="bg-[#0a0a0a] border-white/10 text-white text-center text-2xl tracking-[0.5em] placeholder:text-zinc-700 focus:border-primary/40 h-14 font-mono"
                    onKeyDown={(e) =>
                      e.key === "Enter" && code.length === 6 && handleVerify()
                    }
                  />

                  <Button
                    onClick={handleVerify}
                    disabled={code.length !== 6 || verifying}
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-black font-bold text-sm disabled:opacity-40"
                  >
                    {verifying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Confirmar código"
                    )}
                  </Button>

                  <button
                    onClick={sendCode}
                    disabled={sending}
                    className="w-full text-xs text-zinc-600 hover:text-zinc-400 transition-colors disabled:opacity-40 pt-1"
                  >
                    {sending ? "Reenviando..." : "Reenviar código"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-zinc-700 mt-6">
          IAttom Assist &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
