import { motion } from "framer-motion";
import { Settings as SettingsIcon, User, Bell, Shield, CreditCard, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function Settings() {
  const { toast } = useToast();

  const handleSave = () => {
    toast({ description: "Settings saved successfully" });
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1">Configuration</p>
        <h2 className="text-2xl font-bold text-white mb-1">Settings</h2>
        <p className="text-muted-foreground text-sm">Manage your account, notifications, and workspace preferences.</p>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
        {/* Profile */}
        <motion.div variants={itemVariants}>
          <Card className="bg-[#111111] border-white/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">First Name</Label>
                  <Input
                    data-testid="input-first-name"
                    defaultValue="John"
                    className="bg-[#0a0a0a] border-white/10 focus-visible:ring-primary/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Last Name</Label>
                  <Input
                    data-testid="input-last-name"
                    defaultValue="Doe"
                    className="bg-[#0a0a0a] border-white/10 focus-visible:ring-primary/50"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Email Address</Label>
                <Input
                  data-testid="input-email"
                  defaultValue="john@example.com"
                  type="email"
                  className="bg-[#0a0a0a] border-white/10 focus-visible:ring-primary/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Company</Label>
                <Input
                  data-testid="input-company"
                  defaultValue="Acme Inc."
                  className="bg-[#0a0a0a] border-white/10 focus-visible:ring-primary/50"
                />
              </div>
              <Button
                data-testid="button-save-profile"
                onClick={handleSave}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Save Profile
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div variants={itemVariants}>
          <Card className="bg-[#111111] border-white/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" /> Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { id: "email-notif", label: "Email Notifications", desc: "Receive updates and results via email", defaultChecked: true },
                { id: "project-notif", label: "Project Completions", desc: "Notify when AI tasks are completed", defaultChecked: true },
                { id: "weekly-report", label: "Weekly Report", desc: "Summary of activity and insights", defaultChecked: false },
                { id: "marketing-notif", label: "Product Updates", desc: "New features and platform updates", defaultChecked: false },
              ].map((item, i, arr) => (
                <div key={item.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                    <Switch
                      data-testid={`switch-${item.id}`}
                      defaultChecked={item.defaultChecked}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                  {i < arr.length - 1 && <Separator className="mt-4 bg-white/5" />}
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Security */}
        <motion.div variants={itemVariants}>
          <Card className="bg-[#111111] border-white/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Current Password</Label>
                <Input
                  data-testid="input-current-password"
                  type="password"
                  placeholder="Enter current password"
                  className="bg-[#0a0a0a] border-white/10 focus-visible:ring-primary/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">New Password</Label>
                  <Input
                    data-testid="input-new-password"
                    type="password"
                    placeholder="New password"
                    className="bg-[#0a0a0a] border-white/10 focus-visible:ring-primary/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Confirm Password</Label>
                  <Input
                    data-testid="input-confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    className="bg-[#0a0a0a] border-white/10 focus-visible:ring-primary/50"
                  />
                </div>
              </div>
              <Button
                data-testid="button-change-password"
                variant="outline"
                className="border-white/10 text-white hover:bg-white/5"
              >
                Change Password
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Plan */}
        <motion.div variants={itemVariants}>
          <Card className="bg-[#111111] border-primary/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" /> Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-lg font-bold text-white">Pro Plan</p>
                    <Badge className="bg-primary/20 text-primary border-primary/30">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">$79 / month — billed monthly</p>
                </div>
                <Zap className="w-8 h-8 text-primary/40" />
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "AI Actions", value: "1,250 / 2,000" },
                  { label: "Projects", value: "12 / Unlimited" },
                  { label: "Seats", value: "1 / 3" },
                ].map((item) => (
                  <div key={item.label} className="bg-white/5 border border-white/5 rounded-lg p-3 text-center">
                    <p className="text-sm font-semibold text-white">{item.value}</p>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Button
                  data-testid="button-upgrade-plan"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1"
                >
                  Upgrade to Business
                </Button>
                <Button
                  data-testid="button-manage-billing"
                  variant="outline"
                  className="border-white/10 text-muted-foreground hover:bg-white/5"
                >
                  Manage Billing
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
