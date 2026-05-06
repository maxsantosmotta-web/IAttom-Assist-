import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { SidebarLayout } from "@/components/layout/SidebarLayout";

// To be created
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { DashboardHome } from "@/pages/dashboard/DashboardHome";
import { FindProducts } from "@/pages/dashboard/FindProducts";
import { ValidateProducts } from "@/pages/dashboard/ValidateProducts";
import { CreateCampaign } from "@/pages/dashboard/CreateCampaign";
import { CreateContent } from "@/pages/dashboard/CreateContent";
import { CreativeGenerator } from "@/pages/dashboard/CreativeGenerator";
import { VideoScripts } from "@/pages/dashboard/VideoScripts";
import { Projects } from "@/pages/dashboard/Projects";
import { History } from "@/pages/dashboard/History";
import { Settings } from "@/pages/dashboard/Settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function DashboardRoutes() {
  return (
    <SidebarLayout>
      <Switch>
        <Route path="/dashboard" component={DashboardHome} />
        <Route path="/dashboard/find-products" component={FindProducts} />
        <Route path="/dashboard/validate-products" component={ValidateProducts} />
        <Route path="/dashboard/create-campaign" component={CreateCampaign} />
        <Route path="/dashboard/create-content" component={CreateContent} />
        <Route path="/dashboard/creative-generator" component={CreativeGenerator} />
        <Route path="/dashboard/video-scripts" component={VideoScripts} />
        <Route path="/dashboard/projects" component={Projects} />
        <Route path="/dashboard/history" component={History} />
        <Route path="/dashboard/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </SidebarLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/dashboard/*" component={DashboardRoutes} />
      <Route path="/dashboard" component={DashboardRoutes} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
