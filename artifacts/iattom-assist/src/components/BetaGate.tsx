import { useEffect } from "react";
import { useUser } from "@clerk/react";
import { useLocation } from "wouter";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { EmailVerificationModal } from "@/components/EmailVerificationModal";

interface BetaGateProps {
  children: React.ReactNode;
}

const PLAN_GATE_BYPASS = "/dashboard/billing";

const Spinner = () => (
  <div className="flex items-center justify-center min-h-[100dvh] bg-[#0a0a0a]">
    <div className="w-7 h-7 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
  </div>
);

export function BetaGate({ children }: BetaGateProps) {
  const { isLoaded, user } = useUser();
  const [location, navigate] = useLocation();

  const { data: me, isLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), staleTime: 0, enabled: isLoaded },
  });

  const isBillingPage = location === PLAN_GATE_BYPASS;

  const needsVerification =
    me !== undefined &&
    me.role !== "admin" &&
    !me.registrationConfirmed;

  const needsOnboarding =
    !isBillingPage &&
    me !== undefined &&
    me.role !== "admin" &&
    me.plan === "free" &&
    !me.planSelected;

  useEffect(() => {
    if (!isLoaded || isLoading || me === undefined) return;
    if (needsOnboarding && !needsVerification) navigate(PLAN_GATE_BYPASS, { replace: true });
  }, [isLoaded, isLoading, me, needsOnboarding, needsVerification, navigate]);

  if (!isLoaded || isLoading || me === undefined) return <Spinner />;

  if (needsVerification) {
    return (
      <>
        <Spinner />
        <EmailVerificationModal
          open={true}
          email={user?.primaryEmailAddress?.emailAddress}
          onClose={() => {}}
          onSuccess={() => navigate(PLAN_GATE_BYPASS, { replace: true })}
        />
      </>
    );
  }

  if (needsOnboarding) return <Spinner />;

  return <>{children}</>;
}
