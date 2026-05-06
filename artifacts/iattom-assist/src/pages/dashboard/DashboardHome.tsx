import { motion } from "framer-motion";
import { Link } from "wouter";
import { Search, CheckCircle, Megaphone, FileText, Sparkles, Video, ArrowRight, TrendingUp, Layers, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetDashboardSummary, useListProjects } from "@workspace/api-client-react";

const quickActions = [
  { href: "/dashboard/find-products", label: "Find Products", icon: Search, desc: "Discover winning products" },
  { href: "/dashboard/validate-products", label: "Validate Products", icon: CheckCircle, desc: "Test market demand" },
  { href: "/dashboard/create-campaign", label: "Create Campaign", icon: Megaphone, desc: "Launch targeted campaigns" },
  { href: "/dashboard/create-content", label: "Create Content", icon: FileText, desc: "Generate compelling copy" },
  { href: "/dashboard/creative-generator", label: "Creative Generator", icon: Sparkles, desc: "Design visual creatives" },
  { href: "/dashboard/video-scripts", label: "Video Scripts", icon: Video, desc: "Write viral video scripts" },
];

const statusColors: Record<string, string> = {
  draft: "bg-white/5 text-muted-foreground border-white/10",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const typeLabels: Record<string, string> = {
  product_discovery: "Product Discovery",
  product_validation: "Product Validation",
  campaign: "Campaign",
  content: "Content",
  creative: "Creative",
  video_script: "Video Script",
  marketing: "Marketing",
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function DashboardHome() {
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary();
  const { data: projects, isLoading: projectsLoading } = useListProjects();

  const stats = [
    { label: "Total Projects", value: summary?.totalProjects ?? 0, icon: Layers, color: "text-primary" },
    { label: "Active Projects", value: summary?.activeProjects ?? 0, icon: TrendingUp, color: "text-amber-400" },
    { label: "Completed", value: summary?.completedProjects ?? 0, icon: CheckCircle, color: "text-emerald-400" },
    { label: "Total Actions", value: summary?.totalActions ?? 0, icon: Zap, color: "text-blue-400" },
  ];

  return (
    <div className="space-y-10">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-1"
      >
        <p className="text-sm text-primary font-medium tracking-widest uppercase">Good morning</p>
        <h2 className="text-3xl font-bold tracking-tight text-white">Welcome back, John.</h2>
        <p className="text-muted-foreground">Your intelligence platform is ready. What are we building today?</p>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} variants={itemVariants}>
              <Card className="bg-[#111111] border-white/5 hover:border-primary/20 transition-colors duration-200">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  {summaryLoading ? (
                    <Skeleton className="h-8 w-12 bg-white/5 mb-1" />
                  ) : (
                    <p className="text-3xl font-bold text-white tabular-nums">{stat.value}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Quick Actions</h3>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <motion.div key={action.href} variants={itemVariants}>
                <Link href={action.href} data-testid={`quick-action-${action.label.toLowerCase().replace(/\s+/g, "-")}`}>
                  <div className="group flex items-center gap-4 p-4 rounded-lg bg-[#111111] border border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 cursor-pointer">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{action.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{action.desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Recent Projects</h3>
          <Link href="/dashboard/projects" className="text-xs text-primary hover:underline font-medium">View all</Link>
        </div>
        <div className="space-y-2">
          {projectsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full bg-white/5 rounded-lg" />
            ))
          ) : projects && projects.length > 0 ? (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-2">
              {(projects ?? []).slice(0, 5).map((project) => (
                <motion.div key={project.id} variants={itemVariants}>
                  <div
                    data-testid={`project-row-${project.id}`}
                    className="flex items-center justify-between p-4 rounded-lg bg-[#111111] border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{project.name}</p>
                        <p className="text-xs text-muted-foreground">{typeLabels[project.type] ?? project.type}</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs capitalize shrink-0 ml-4 ${statusColors[project.status] ?? ""}`}
                    >
                      {project.status.replace("_", " ")}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No projects yet. Start by creating one above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
