import { useUser } from "@clerk/react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

interface BetaGateProps {
  children: React.ReactNode;
}

const BETA_MODE = import.meta.env.VITE_BETA_MODE === "true";

export function BetaGate({ children }: BetaGateProps) {
  const { isLoaded: clerkLoaded } = useUser();
  const { data: me, isLoading: meLoading } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      staleTime: 0,
      enabled: BETA_MODE && clerkLoaded,
    },
  });

  if (!clerkLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-[#0a0a0a]">
        <div className="w-7 h-7 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (BETA_MODE) {
    if (meLoading || me === undefined) {
      return (
        <div className="flex items-center justify-center min-h-[100dvh] bg-[#0a0a0a]">
          <div className="w-7 h-7 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      );
    }

    if (!me.betaAccess) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-[#0a0a0a] gap-3">
          <p className="text-white/60 text-sm tracking-wide">
            Acesso aguardando aprovação.
          </p>
        </div>
      );
    }
  }

  return <>{children}</>;
}
