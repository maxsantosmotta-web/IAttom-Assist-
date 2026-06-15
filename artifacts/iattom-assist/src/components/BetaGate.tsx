import { useEffect } from "react";
import { useUser } from "@clerk/react";
import { useLocation } from "wouter";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

interface BetaGateProps {
  children: React.ReactNode;
}

const Spinner = () => (
  <div className="flex items-center justify-center min-h-[100dvh] bg-[#0a0a0a]">
    <div className="w-7 h-7 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
  </div>
);

export function BetaGate({ children }: BetaGateProps) {
  const { isLoaded } = useUser();
  const [location, navigate] = useLocation();

  const { data: me, isLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), staleTime: 0, enabled: isLoaded },
  });

  const isAdmin     = me?.role === "admin";
  const isOnBilling = location === "/dashboard/billing";

  const needsPlanSelection =
    !isAdmin &&
    me !== undefined &&
    !me.planSelected &&
    !isOnBilling;

  useEffect(() => {
    if (!isLoaded || isLoading || me === undefined) return;
    if (needsPlanSelection) navigate("/dashboard/billing", { replace: true });
  }, [isLoaded, isLoading, me, needsPlanSelection, navigate]);

  if (!isLoaded || isLoading || me === undefined) return <Spinner />;
  if (needsPlanSelection) return <Spinner />;

  return <>{children}</>;
}
