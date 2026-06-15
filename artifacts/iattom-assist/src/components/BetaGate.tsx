import { useEffect } from "react";
import { useUser } from "@clerk/react";
import { useLocation } from "wouter";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

interface BetaGateProps {
  children: React.ReactNode;
}

const REGISTRATION_PATH = "/registration-confirm";
const BILLING_PATH      = "/dashboard/billing";

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

  const isAdmin        = me?.role === "admin";
  const isOnBilling    = location === BILLING_PATH;

  const needsRegistration =
    !isAdmin &&
    me !== undefined &&
    !me.registrationConfirmed;

  const needsPlanSelection =
    !isAdmin &&
    me !== undefined &&
    me.registrationConfirmed &&
    !me.planSelected &&
    !isOnBilling;

  const redirectTarget = needsRegistration
    ? REGISTRATION_PATH
    : needsPlanSelection
    ? BILLING_PATH
    : null;

  useEffect(() => {
    if (!isLoaded || isLoading || me === undefined) return;
    if (redirectTarget) navigate(redirectTarget, { replace: true });
  }, [isLoaded, isLoading, me, redirectTarget, navigate]);

  if (!isLoaded || isLoading || me === undefined) return <Spinner />;
  if (redirectTarget) return <Spinner />;

  return <>{children}</>;
}
