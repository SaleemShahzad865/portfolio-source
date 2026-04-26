import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Save, Trash2 } from "lucide-react";
import {
  getGetSkillsQueryKey,
  useGetSkills,
  useUpsertSkills,
  type SkillsConfig,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function uid(): string {
  return globalThis.crypto?.randomUUID?.() ?? `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

const ICON_OPTIONS = [
  "Cpu",
  "CircuitBoard",
  "Code2",
  "Radio",
  "Zap",
  "Database",
  "Server",
  "Wrench",
  "Wifi",
  "Bluetooth",
  "TerminalSquare",
  "Layers",
  "ShieldCheck",
  "Activity",
] as const;

type IconOption = (typeof ICON_OPTIONS)[number];

function normalizeConfig(config: SkillsConfig | undefined): SkillsConfig {
  if (!config) return { categories: [] };
  return config;
}

export default function SkillsEditor() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetSkills();
  const upsert = useUpsertSkills();

  const initial = useMemo(() => normalizeConfig(data), [data]);
  const [draft, setDraft] = useState<SkillsConfig>(initial);

  useEffect(() => {
    setDraft(initial);
  }, [initial]);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(initial);

  function addCategory() {
    setDraft((prev) => ({
      categories: [
        ...prev.categories,
        { id: uid(), title: "New Category", icon: "Cpu", skills: [] },
      ],
    }));
  }

  function removeCategory(categoryId: string) {
    setDraft((prev) => ({
      categories: prev.categories.filter((c) => c.id !== categoryId),
    }));
  }

  function updateCategory(categoryId: string, patch: Partial<SkillsConfig["categories"][number]>) {
    setDraft((prev) => ({
      categories: prev.categories.map((c) => (c.id === categoryId ? { ...c, ...patch } : c)),
    }));
  }

  function addSkill(categoryId: string) {
    setDraft((prev) => ({
      categories: prev.categories.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              skills: [...c.skills, { id: uid(), name: "New Skill", level: 70 }],
            }
          : c,
      ),
    }));
  }

  function removeSkill(categoryId: string, skillId: string) {
    setDraft((prev) => ({
      categories: prev.categories.map((c) =>
        c.id === categoryId
          ? { ...c, skills: c.skills.filter((s) => s.id !== skillId) }
          : c,
      ),
    }));
  }

  function updateSkill(
    categoryId: string,
    skillId: string,
    patch: Partial<SkillsConfig["categories"][number]["skills"][number]>,
  ) {
    setDraft((prev) => ({
      categories: prev.categories.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              skills: c.skills.map((s) => (s.id === skillId ? { ...s, ...patch } : s)),
            }
          : c,
      ),
    }));
  }

  function handleSave() {
    upsert.mutate(
      { data: draft },
      {
        onSuccess: () => {
          toast.success("Saved skills");
          queryClient.invalidateQueries({ queryKey: getGetSkillsQueryKey() });
        },
        onError: () => toast.error("Failed to save skills"),
      },
    );
  }

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground font-mono">Loading skills...</div>;
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="border-b border-border/50 pb-6">
        <h1 className="text-3xl font-display font-bold">Skills Matrix</h1>
        <p className="text-muted-foreground font-mono text-sm mt-1">
          Edit categories and skill levels for the public Skills page.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 max-w-5xl">
        <Button
          type="button"
          variant="outline"
          className="font-mono text-xs uppercase tracking-widest"
          onClick={addCategory}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Category
        </Button>

        <Button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || upsert.isPending}
          className="font-mono text-xs uppercase tracking-widest"
        >
          <Save className="w-4 h-4 mr-2" /> Save Skills
        </Button>
      </div>

      <div className="grid gap-6 max-w-5xl">
        {draft.categories.map((category) => (
          <Card
            key={category.id}
            className="bg-card/20 backdrop-blur-sm border-border/50"
          >
            <CardHeader className="pb-4 border-b border-border/20">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg font-display flex items-center gap-3">
                    <Input
                      value={category.title}
                      onChange={(e) => updateCategory(category.id, { title: e.target.value })}
                      className="bg-background/50 font-mono text-sm h-10"
                      placeholder="Category title"
                    />
                  </CardTitle>
                  <CardDescription className="font-mono text-xs text-muted-foreground mt-2">
                    Category id: <span className="text-primary/70">{category.id}</span>
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    value={(category.icon as IconOption) ?? "Cpu"}
                    onValueChange={(value) => updateCategory(category.id, { icon: value })}
                  >
                    <SelectTrigger className="w-[220px] bg-background/50 font-mono text-xs">
                      <SelectValue placeholder="Icon" />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((icon) => (
                        <SelectItem key={icon} value={icon} className="font-mono text-xs">
                          {icon}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeCategory(category.id)}
                    title="Remove category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-5">
              {category.skills.map((skill) => (
                <div key={skill.id} className="rounded-xl border border-border/30 bg-background/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-3">
                      <Input
                        value={skill.name}
                        onChange={(e) => updateSkill(category.id, skill.id, { name: e.target.value })}
                        className="bg-background/60 font-mono text-sm h-10"
                        placeholder="Skill name"
                      />

                      <div className="flex items-center gap-4">
                        <Slider
                          value={[skill.level]}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={(v) => updateSkill(category.id, skill.id, { level: v[0] ?? 0 })}
                        />
                        <div className="shrink-0 font-mono text-xs text-muted-foreground w-14 text-right">
                          {skill.level}%
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeSkill(category.id, skill.id)}
                      title="Remove skill"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                className="font-mono text-xs uppercase tracking-widest"
                onClick={() => addSkill(category.id)}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Skill
              </Button>
            </CardContent>
          </Card>
        ))}

        {!draft.categories.length ? (
          <div className="text-sm text-muted-foreground italic p-4 font-mono">
            No categories yet. Click “Add Category” to start.
          </div>
        ) : null}
      </div>
    </div>
  );
}

