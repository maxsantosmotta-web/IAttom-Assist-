import { SignUp as ClerkSignUp } from "@clerk/react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

const basePath = (import.meta.env.BASE_URL as string).replace(/\/$/, "");

export function SignUpPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-8">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_45%_35%_at_50%_30%,rgba(180,128,18,0.055)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="rounded-2xl overflow-hidden border border-white/[0.07]" style={{ background: "#0d0d0d", boxShadow: "0 24px 80px -16px rgba(0,0,0,0.7)" }}>
          <div className="h-[2px] w-full" style={{ background: "linear-gradient(90deg, transparent, #B8902A 25%, #E8C84A 50%, #B8902A 75%, transparent)" }} />

          <div className="px-7 pt-8 pb-9 sm:px-9">
            <div className="flex justify-center mb-6">
              <img
                src="/iattom-logo-transparent.png"
                alt="IAttom Assist"
                width={68} height={68}
                draggable={false}
                className="w-[68px] h-[68px] object-contain select-none"
              />
            </div>

            <ClerkSignUp
              routing="path"
              path={`${basePath}/sign-up`}
              signInUrl={`${basePath}/sign-in`}
              fallbackRedirectUrl={`${basePath}/dashboard/billing`}
              appearance={{
                elements: {
                  rootBox: "w-full",
                  cardBox: "w-full shadow-none",
                  card: "bg-transparent shadow-none border-0 p-0 w-full",
                  headerTitle: "text-white text-[21px] font-bold tracking-tight text-center",
                  headerSubtitle: "text-white/38 text-[12.5px] text-center",
                  socialButtonsBlockButton: "bg-white/[0.025] border-white/[0.10] text-white/80 hover:bg-white/[0.05] hover:text-white",
                  formButtonPrimary: "bg-[#C9A030] hover:bg-[#E8C84A] text-black font-bold uppercase tracking-[0.14em]",
                  formFieldInput: "bg-[#080808] border-white/[0.09] text-white placeholder:text-white/22",
                  formFieldLabel: "text-white/45",
                  footerActionText: "text-white/25",
                  footerActionLink: "text-[#C9A84C] hover:text-[#E8C96A]",
                  dividerLine: "bg-white/[0.07]",
                  dividerText: "text-white/25",
                  formFieldErrorText: "text-red-300",
                  formResendCodeLink: "text-[#C9A84C] hover:text-[#E8C96A]",
                  identityPreviewText: "text-white/65",
                  identityPreviewEditButton: "text-[#C9A84C] hover:text-[#E8C96A]",
                },
              }}
            />

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setLocation("/")}
                className="flex items-center gap-1.5 text-[12px] text-white/25 hover:text-white/55 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar ao início
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
