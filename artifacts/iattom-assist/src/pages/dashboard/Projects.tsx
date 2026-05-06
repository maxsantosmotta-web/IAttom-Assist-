import { useState } from "react";
import { motion } from "framer-motion";
import { FolderOpen, Plus, Trash2, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListProjects,
  useCreateProject,
  useDeleteProject,
  getListProjectsQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

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

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["product_discovery", "product_validation", "campaign", "content", "creative", "video_script", "marketing"]),
  status: z.enum(["draft", "in_progress", "completed"]).optional(),
  description: z.string().optional(),
});

type CreateForm = z.infer<typeof createSchema>;

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function Projects() {
  const queryClient = useQueryClient();
  const { data: projects, isLoading } = useListProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", description: "" },
  });

  const onSubmit = (data: CreateForm) => {
    createProject.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          setIsDialogOpen(false);
          form.reset();
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
    deleteProject.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          setDeletingId(null);
        },
        onError: () => setDeletingId(null),
      }
    );
  };

  const filtered = (projects ?? []).filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1">Workspace</p>
        <h2 className="text-2xl font-bold text-white mb-1">Projects</h2>
        <p className="text-muted-foreground text-sm">Manage all your AI-powered projects in one place.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex items-center gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-testid="input-project-search"
            placeholder="Search projects..."
            className="pl-10 bg-[#111111] border-white/5 focus-visible:ring-primary/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          data-testid="button-create-project"
          onClick={() => setIsDialogOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" /> New Project
        </Button>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full bg-white/5 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderOpen className="w-12 h-12 text-white/10 mb-4" />
          <p className="text-muted-foreground text-sm">No projects found.</p>
          <Button onClick={() => setIsDialogOpen(true)} variant="ghost" className="mt-3 text-primary hover:text-primary/80">
            Create your first project
          </Button>
        </div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
          {filtered.map((project) => (
            <motion.div key={project.id} variants={itemVariants}>
              <Card
                data-testid={`card-project-${project.id}`}
                className="bg-[#111111] border-white/5 hover:border-white/10 transition-colors"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                        <h4 className="font-semibold text-white text-sm">{project.name}</h4>
                        <Badge variant="outline" className="text-xs border-white/10 text-muted-foreground shrink-0">
                          {typeLabels[project.type] ?? project.type}
                        </Badge>
                        <Badge variant="outline" className={`text-xs capitalize shrink-0 ${statusColors[project.status] ?? ""}`}>
                          {project.status.replace("_", " ")}
                        </Badge>
                      </div>
                      {project.description && (
                        <p className="text-xs text-muted-foreground truncate">{project.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Updated {new Date(project.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      data-testid={`button-delete-project-${project.id}`}
                      onClick={() => handleDelete(project.id)}
                      disabled={deletingId === project.id}
                      className="text-muted-foreground hover:text-red-400 transition-colors shrink-0 p-1"
                    >
                      {deletingId === project.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#111111] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">New Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Project Name</Label>
              <Input
                data-testid="input-new-project-name"
                placeholder="e.g. Summer Sale Campaign"
                className="bg-[#0a0a0a] border-white/10 focus-visible:ring-primary/50"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Project Type</Label>
              <Select onValueChange={(v) => form.setValue("type", v as CreateForm["type"])}>
                <SelectTrigger data-testid="select-new-project-type" className="bg-[#0a0a0a] border-white/10">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-[#111111] border-white/10">
                  {Object.entries(typeLabels).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.type && (
                <p className="text-xs text-destructive">{form.formState.errors.type.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Description (optional)</Label>
              <Textarea
                data-testid="input-new-project-description"
                placeholder="Brief description of this project..."
                className="bg-[#0a0a0a] border-white/10 focus-visible:ring-primary/50 resize-none"
                rows={2}
                {...form.register("description")}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createProject.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {createProject.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
