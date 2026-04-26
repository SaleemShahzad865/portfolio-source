import { useGetSkills, useListPosts, useListProjects, useListSections, useUpsertSection, getListSectionsQueryKey } from "@workspace/api-client-react";
import type { Post, Project } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Save, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { normalizeList } from "@/lib/normalize-list";
import { uploadImage } from "@/lib/upload-image";

const SECTION_SCHEMA = [
  { key: "home_name", label: "Home — Name", desc: "Main hero name (supports multiline)", multiLine: true },
  { key: "home_role", label: "Home — Role/Headline", desc: "The shorter role under the name", multiLine: false },
  { key: "home_tagline", label: "Home — Hero Tagline", desc: "The longer introductory paragraph", multiLine: true },
  { key: "about_intro", label: "About — Intro", desc: "Lead paragraph under About Me", multiLine: true },
  { key: "about_philosophy", label: "About — Philosophy", desc: "Prose block. Paragraphs are split on blank lines.", multiLine: true, large: true },
  { key: "contact_email", label: "Contact — Email", desc: "Email address displayed (and contact-form recipient)", multiLine: false },
  { key: "contact_location", label: "Contact — Location", desc: "Physical location", multiLine: false },
  { key: "contact_github", label: "Contact — GitHub URL", desc: "Link to GitHub profile", multiLine: false },
  { key: "contact_linkedin", label: "Contact — LinkedIn URL", desc: "Link to LinkedIn profile", multiLine: false },
];

function SectionCard({ 
  schema, 
  initialValue 
}: { 
  schema: typeof SECTION_SCHEMA[0]; 
  initialValue: string; 
}) {
  const [value, setValue] = useState(initialValue);
  const upsert = useUpsertSection();
  const queryClient = useQueryClient();

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleSave = () => {
    upsert.mutate({ key: schema.key, data: { value } }, {
      onSuccess: () => {
        toast.success(`Saved ${schema.label}`);
        queryClient.invalidateQueries({ queryKey: getListSectionsQueryKey() });
      },
      onError: () => toast.error(`Failed to save ${schema.label}`)
    });
  };

  const isDirty = value !== initialValue;

  return (
    <Card className="bg-card/20 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3 border-b border-border/20">
        <CardTitle className="text-lg font-display flex items-center justify-between">
          {schema.label}
          {isDirty && <span className="text-[10px] font-mono text-primary uppercase px-2 py-1 bg-primary/10 rounded">Unsaved Changes</span>}
        </CardTitle>
        <CardDescription className="font-mono text-xs text-muted-foreground">{schema.desc}</CardDescription>
        <div className="text-[10px] font-mono text-muted-foreground/60">Key: <span className="text-primary/70">{schema.key}</span></div>
      </CardHeader>
      <CardContent className="pt-4 flex flex-col gap-4">
        <Textarea 
          value={value} 
          onChange={(e) => setValue(e.target.value)} 
          className={`bg-background/50 font-mono text-sm focus-visible:ring-1 focus-visible:ring-primary ${schema.large ? 'min-h-[300px]' : schema.multiLine ? 'min-h-[100px]' : 'min-h-[60px] resize-none'}`}
        />
        <Button 
          onClick={handleSave} 
          disabled={!isDirty || upsert.isPending} 
          className="self-end font-mono text-xs uppercase tracking-widest w-full sm:w-auto"
        >
          <Save className="w-4 h-4 mr-2" /> Save Config
        </Button>
      </CardContent>
    </Card>
  );
}

type TimelineItem = { role: string; period: string; desc: string; active?: boolean };
type ConnectAccount = { name: string; url: string; logo?: string };
type SkillCategory = { id: number; title: string; icon: string; skills: { id: number; name: string; level: number }[] };
type SkillCategoryImageConfig = { categoryId: number; image: string };
type Testimonial = {
  image?: string;
  name: string;
  designation: string;
  company: string;
  message: string;
};

type ClientLogo = {
  name: string;
  logo: string;
  url: string;
};

function safeJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function uniqueList<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function normalizeSkillCategoryImages(raw: SkillCategoryImageConfig[]): SkillCategoryImageConfig[] {
  const filtered = raw
    .filter((v) => v && typeof v.categoryId === "number" && Number.isFinite(v.categoryId))
    .map((v) => ({ categoryId: v.categoryId, image: typeof v.image === "string" ? v.image : "" }))
    .filter((v) => v.categoryId > 0);

  const byId = new Map<number, SkillCategoryImageConfig>();
  for (const item of filtered) {
    byId.set(item.categoryId, item);
  }

  return Array.from(byId.values()).sort((a, b) => a.categoryId - b.categoryId);
}

function moveItem<T>(items: T[], index: number, delta: number): T[] {
  const next = [...items];
  const target = index + delta;
  if (target < 0 || target >= next.length) return next;
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

function HeroImageCard({ initialValue }: { initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  const [isUploading, setIsUploading] = useState(false);
  const upsert = useUpsertSection();
  const queryClient = useQueryClient();

  useEffect(() => setValue(initialValue), [initialValue]);

  const isDirty = value !== initialValue;

  async function handleUpload(file: File | null) {
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadImage(file, "generic");
      setValue(url);
      toast.success("Hero image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  const handleSave = () => {
    upsert.mutate(
      { key: "home_hero_image", data: { value } },
      {
        onSuccess: () => {
          toast.success("Saved Home — Hero Image");
          queryClient.invalidateQueries({ queryKey: getListSectionsQueryKey() });
        },
        onError: () => toast.error("Failed to save Home — Hero Image"),
      },
    );
  };

  return (
    <Card className="bg-card/20 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3 border-b border-border/20">
        <CardTitle className="text-lg font-display flex items-center justify-between">
          Home — Hero Image
          {isDirty && (
            <span className="text-[10px] font-mono text-primary uppercase px-2 py-1 bg-primary/10 rounded">
              Unsaved Changes
            </span>
          )}
        </CardTitle>
        <CardDescription className="font-mono text-xs text-muted-foreground">
          Upload or set a URL/path for the hero picture.
        </CardDescription>
        <div className="text-[10px] font-mono text-muted-foreground/60">
          Key: <span className="text-primary/70">home_hero_image</span>
        </div>
      </CardHeader>
      <CardContent className="pt-4 flex flex-col gap-4">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="bg-background/50 font-mono text-sm"
          placeholder="/uploads/... or https://..."
        />

        {value ? (
          <div className="aspect-[4/5] max-w-[280px] rounded-xl overflow-hidden border border-border/50 bg-background/50">
            <img src={value} alt="Hero preview" className="w-full h-full object-cover" />
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:border-primary/40 hover:text-primary w-fit">
            <Upload className="h-3.5 w-3.5" />
            {isUploading ? "Uploading..." : "Upload From Device"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                void handleUpload(event.target.files?.[0] ?? null);
                event.currentTarget.value = "";
              }}
            />
          </label>

          <Button
            onClick={handleSave}
            disabled={!isDirty || upsert.isPending}
            className="font-mono text-xs uppercase tracking-widest w-full sm:w-auto"
          >
            <Save className="w-4 h-4 mr-2" /> Save Config
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ResumeCard({ initialValue }: { initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  const [isUploading, setIsUploading] = useState(false);
  const upsert = useUpsertSection();
  const queryClient = useQueryClient();

  useEffect(() => setValue(initialValue), [initialValue]);

  const isDirty = value !== initialValue;

  async function handleUpload(file: File | null) {
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadImage(file, "generic");
      setValue(url);
      toast.success("Resume uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  const handleSave = () => {
    upsert.mutate(
      { key: "resume_url", data: { value } },
      {
        onSuccess: () => {
          toast.success("Saved Resume URL");
          queryClient.invalidateQueries({ queryKey: getListSectionsQueryKey() });
        },
        onError: () => toast.error("Failed to save Resume URL"),
      },
    );
  };

  return (
    <Card className="bg-card/20 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3 border-b border-border/20">
        <CardTitle className="text-lg font-display flex items-center justify-between">
          Resume — Download File
          {isDirty && (
            <span className="text-[10px] font-mono text-primary uppercase px-2 py-1 bg-primary/10 rounded">
              Unsaved Changes
            </span>
          )}
        </CardTitle>
        <CardDescription className="font-mono text-xs text-muted-foreground">
          Upload a PDF resume (or paste an external URL).
        </CardDescription>
        <div className="text-[10px] font-mono text-muted-foreground/60">
          Key: <span className="text-primary/70">resume_url</span>
        </div>
      </CardHeader>
      <CardContent className="pt-4 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="bg-background/50 font-mono text-sm"
            placeholder="/uploads/resume.pdf or https://..."
          />
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border/50 bg-background/60 px-4 py-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:border-primary/40 hover:text-primary w-full sm:w-fit">
            <Upload className="h-3.5 w-3.5" />
            {isUploading ? "Uploading..." : "Upload PDF"}
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(event) => {
                void handleUpload(event.target.files?.[0] ?? null);
                event.currentTarget.value = "";
              }}
            />
          </label>
        </div>

        {value ? (
          <div className="text-xs font-mono text-muted-foreground truncate">
            Current:{" "}
            <a className="text-primary hover:underline" href={value} target="_blank" rel="noreferrer">
              {value}
            </a>
          </div>
        ) : null}

        <Button onClick={handleSave} disabled={!isDirty || upsert.isPending} className="self-end font-mono text-xs uppercase tracking-widest w-full sm:w-auto">
          <Save className="w-4 h-4 mr-2" /> Save Config
        </Button>
      </CardContent>
    </Card>
  );
}

function TickerCard({ initialValue }: { initialValue: string }) {
  const upsert = useUpsertSection();
  const queryClient = useQueryClient();

  const initialItems = safeJson<string[]>(initialValue || "[]", []);
  const [items, setItems] = useState<string[]>(initialItems);
  const [draft, setDraft] = useState("");

  useEffect(() => setItems(safeJson<string[]>(initialValue || "[]", [])), [initialValue]);

  const serialized = JSON.stringify(items.filter(Boolean), null, 2);
  const isDirty = (initialValue || "") !== serialized;

  const handleSave = () => {
    upsert.mutate(
      { key: "home_ticker", data: { value: serialized } },
      {
        onSuccess: () => {
          toast.success("Saved Home — Ticker");
          queryClient.invalidateQueries({ queryKey: getListSectionsQueryKey() });
        },
        onError: () => toast.error("Failed to save Home — Ticker"),
      },
    );
  };

  return (
    <Card className="bg-card/20 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3 border-b border-border/20">
        <CardTitle className="text-lg font-display flex items-center justify-between">
          Home — Ticker
          {isDirty && (
            <span className="text-[10px] font-mono text-primary uppercase px-2 py-1 bg-primary/10 rounded">
              Unsaved Changes
            </span>
          )}
        </CardTitle>
        <CardDescription className="font-mono text-xs text-muted-foreground">
          Controls the scrolling marquee on the home page.
        </CardDescription>
        <div className="text-[10px] font-mono text-muted-foreground/60">
          Key: <span className="text-primary/70">home_ticker</span>
        </div>
      </CardHeader>
      <CardContent className="pt-4 flex flex-col gap-4">
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="bg-background/50 font-mono text-sm"
            placeholder="Add ticker item..."
          />
          <Button
            type="button"
            className="font-mono text-xs uppercase tracking-widest"
            onClick={() => {
              const next = draft.trim();
              if (!next) return;
              setItems((prev) => [...prev, next]);
              setDraft("");
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Add
          </Button>
        </div>

        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/40 px-3 py-2"
            >
              <div className="font-mono text-sm text-foreground/90 truncate">{item}</div>
              <div className="flex items-center gap-1 shrink-0">
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setItems((prev) => moveItem(prev, index, -1))}>
                  <ArrowUp className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setItems((prev) => moveItem(prev, index, 1))}>
                  <ArrowDown className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={handleSave}
          disabled={!isDirty || upsert.isPending}
          className="self-end font-mono text-xs uppercase tracking-widest w-full sm:w-auto"
        >
          <Save className="w-4 h-4 mr-2" /> Save Config
        </Button>
      </CardContent>
    </Card>
  );
}

function ClientsTickerCard({ initialValue }: { initialValue: string }) {
  const upsert = useUpsertSection();
  const queryClient = useQueryClient();

  const makeId = () => {
    try {
      return crypto.randomUUID();
    } catch {
      return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
  };

  const rawInitialItems = safeJson<unknown[]>(initialValue || "[]", []);
  const initialItems = rawInitialItems
    .map((item) => {
      if (typeof item === "string") return { name: item, logo: "", url: "" } satisfies ClientLogo;
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      return {
        name: typeof record.name === "string" ? record.name : "",
        logo: typeof record.logo === "string" ? record.logo : "",
        url: typeof record.url === "string" ? record.url : "",
      } satisfies ClientLogo;
    })
    .filter((c): c is ClientLogo => c != null);

  type ClientLogoItem = ClientLogo & { id: string };

  const [items, setItems] = useState<ClientLogoItem[]>(() => initialItems.map((c) => ({ ...c, id: makeId() })));
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const raw = safeJson<unknown[]>(initialValue || "[]", []);
    const normalized = raw
      .map((item) => {
        if (typeof item === "string") return { name: item, logo: "", url: "" } satisfies ClientLogo;
        if (!item || typeof item !== "object") return null;
        const record = item as Record<string, unknown>;
        return {
          name: typeof record.name === "string" ? record.name : "",
          logo: typeof record.logo === "string" ? record.logo : "",
          url: typeof record.url === "string" ? record.url : "",
        } satisfies ClientLogo;
      })
      .filter((c): c is ClientLogo => c != null);

    setItems(normalized.map((c) => ({ ...c, id: makeId() })));
  }, [initialValue]);

  const normalized = items
    .map((c) => ({
      name: typeof c.name === "string" ? c.name : "",
      logo: typeof c.logo === "string" ? c.logo : "",
      url: typeof c.url === "string" ? c.url : "",
    }))
    .map((c) => ({ name: c.name.trim(), logo: c.logo.trim(), url: c.url.trim() }))
    .filter((c) => c.name || c.logo || c.url);

  const serialized = JSON.stringify(normalized, null, 2);
  const isDirty = (initialValue || "") !== serialized;

  const handleLogoUpload = async (index: number, file: File | null) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      setItems((prev) => prev.map((c, i) => (i === index ? { ...c, logo: url } : c)));
      toast.success("Uploaded client logo");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    upsert.mutate(
      { key: "home_clients_ticker", data: { value: serialized } },
      {
        onSuccess: () => {
          toast.success("Saved Home — Clients Ticker");
          queryClient.invalidateQueries({ queryKey: getListSectionsQueryKey() });
        },
        onError: () => toast.error("Failed to save Home — Clients Ticker"),
      },
    );
  };

  return (
    <Card className="bg-card/20 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3 border-b border-border/20">
        <CardTitle className="text-lg font-display flex items-center justify-between">
          Home — Clients Ticker
          {isDirty && (
            <span className="text-[10px] font-mono text-primary uppercase px-2 py-1 bg-primary/10 rounded">
              Unsaved Changes
            </span>
          )}
        </CardTitle>
        <CardDescription className="font-mono text-xs text-muted-foreground">
          Upload client company logos to show in the home-page ticker.
        </CardDescription>
        <div className="text-[10px] font-mono text-muted-foreground/60">
          Key: <span className="text-primary/70">home_clients_ticker</span>
        </div>
      </CardHeader>
      <CardContent className="pt-4 flex flex-col gap-4">
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="rounded-xl border border-border/50 bg-background/40 p-3 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-mono text-[10px] uppercase text-muted-foreground">Client {index + 1}</div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setItems((prev) => moveItem(prev, index, -1))}>
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setItems((prev) => moveItem(prev, index, 1))}>
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Company Name</div>
                  <Input
                    value={item.name ?? ""}
                    onChange={(e) => setItems((prev) => prev.map((c, i) => (i === index ? { ...c, name: e.target.value } : c)))}
                    className="bg-background/50 font-mono text-sm"
                    placeholder="Company"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Website (optional)</div>
                  <Input
                    value={item.url ?? ""}
                    onChange={(e) => setItems((prev) => prev.map((c, i) => (i === index ? { ...c, url: e.target.value } : c)))}
                    className="bg-background/50 font-mono text-sm"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Logo URL</div>
                  <Input
                    value={item.logo ?? ""}
                    onChange={(e) => setItems((prev) => prev.map((c, i) => (i === index ? { ...c, logo: e.target.value } : c)))}
                    className="bg-background/50 font-mono text-sm"
                    placeholder="/uploads/... or https://..."
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Upload Logo</div>
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border/50 bg-background/60 px-4 py-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:border-primary/40 hover:text-primary w-full">
                    <Upload className="h-3.5 w-3.5" />
                    {isUploading ? "Uploading..." : "Upload"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        void handleLogoUpload(index, event.target.files?.[0] ?? null);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          className="font-mono text-xs uppercase tracking-widest"
          onClick={() => setItems((prev) => [...prev, { id: makeId(), name: "", url: "", logo: "" }])}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Client
        </Button>

        <Button
          onClick={handleSave}
          disabled={!isDirty || upsert.isPending}
          className="self-end font-mono text-xs uppercase tracking-widest w-full sm:w-auto"
        >
          <Save className="w-4 h-4 mr-2" /> Save Config
        </Button>
      </CardContent>
    </Card>
  );
}

function TestimonialsCard({ initialValue }: { initialValue: string }) {
  const upsert = useUpsertSection();
  const queryClient = useQueryClient();

  const initialItems = safeJson<Testimonial[]>(initialValue || "[]", []);
  const [items, setItems] = useState<Testimonial[]>(initialItems);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => setItems(safeJson<Testimonial[]>(initialValue || "[]", [])), [initialValue]);

  const normalized = items
    .map((t) => ({
      image: typeof t.image === "string" ? t.image : "",
      name: typeof t.name === "string" ? t.name : "",
      designation: typeof t.designation === "string" ? t.designation : "",
      company: typeof t.company === "string" ? t.company : "",
      message: typeof t.message === "string" ? t.message : "",
    }))
    .map((t) => ({
      ...t,
      image: t.image.trim(),
      name: t.name.trim(),
      designation: t.designation.trim(),
      company: t.company.trim(),
      message: t.message.trim(),
    }))
    .filter((t) => t.name || t.message || t.company || t.designation || t.image);

  const serialized = JSON.stringify(normalized, null, 2);
  const isDirty = (initialValue || "") !== serialized;

  const handleSave = () => {
    upsert.mutate(
      { key: "home_testimonials", data: { value: serialized } },
      {
        onSuccess: () => {
          toast.success("Saved Home — Testimonials");
          queryClient.invalidateQueries({ queryKey: getListSectionsQueryKey() });
        },
        onError: () => toast.error("Failed to save Home — Testimonials"),
      },
    );
  };

  const handleImageUpload = async (index: number, file: File | null) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      setItems((prev) => prev.map((t, i) => (i === index ? { ...t, image: url } : t)));
      toast.success("Uploaded testimonial image");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="bg-card/20 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3 border-b border-border/20">
        <CardTitle className="text-lg font-display flex items-center justify-between">
          Home — Testimonials
          {isDirty && (
            <span className="text-[10px] font-mono text-primary uppercase px-2 py-1 bg-primary/10 rounded">
              Unsaved Changes
            </span>
          )}
        </CardTitle>
        <CardDescription className="font-mono text-xs text-muted-foreground">
          Controls the testimonials grid on the home page.
        </CardDescription>
        <div className="text-[10px] font-mono text-muted-foreground/60">
          Key: <span className="text-primary/70">home_testimonials</span>
        </div>
      </CardHeader>
      <CardContent className="pt-4 flex flex-col gap-4">
        <div className="space-y-4">
          {items.map((t, index) => (
            <div key={index} className="rounded-xl border border-border/50 bg-background/40 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="font-mono text-[10px] uppercase text-muted-foreground">Testimonial {index + 1}</div>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setItems((prev) => moveItem(prev, index, -1))}>
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setItems((prev) => moveItem(prev, index, 1))}>
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Name</div>
                  <Input
                    value={t.name ?? ""}
                    onChange={(e) => setItems((prev) => prev.map((p, i) => (i === index ? { ...p, name: e.target.value } : p)))}
                    className="bg-background/50 font-mono text-sm"
                    placeholder="Client name"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Company</div>
                  <Input
                    value={t.company ?? ""}
                    onChange={(e) => setItems((prev) => prev.map((p, i) => (i === index ? { ...p, company: e.target.value } : p)))}
                    className="bg-background/50 font-mono text-sm"
                    placeholder="Company"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Designation</div>
                  <Input
                    value={t.designation ?? ""}
                    onChange={(e) => setItems((prev) => prev.map((p, i) => (i === index ? { ...p, designation: e.target.value } : p)))}
                    className="bg-background/50 font-mono text-sm"
                    placeholder="e.g. Founder, CTO"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Picture URL</div>
                  <Input
                    value={t.image ?? ""}
                    onChange={(e) => setItems((prev) => prev.map((p, i) => (i === index ? { ...p, image: e.target.value } : p)))}
                    className="bg-background/50 font-mono text-sm"
                    placeholder="/uploads/... or https://..."
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border/50 bg-background/60 px-4 py-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:border-primary/40 hover:text-primary w-full sm:w-fit">
                  <Upload className="h-3.5 w-3.5" />
                  {isUploading ? "Uploading..." : "Upload Picture"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      void handleImageUpload(index, event.target.files?.[0] ?? null);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Message</div>
                <Textarea
                  value={t.message ?? ""}
                  onChange={(e) => setItems((prev) => prev.map((p, i) => (i === index ? { ...p, message: e.target.value } : p)))}
                  className="bg-background/50 font-mono text-sm min-h-[120px]"
                  placeholder="What did the client say?"
                />
              </div>
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" className="font-mono text-xs uppercase tracking-widest" onClick={() => setItems((prev) => [...prev, { image: "", name: "", designation: "", company: "", message: "" }])}>
          <Plus className="w-4 h-4 mr-2" /> Add Testimonial
        </Button>

        <Button onClick={handleSave} disabled={!isDirty || upsert.isPending} className="self-end font-mono text-xs uppercase tracking-widest w-full sm:w-auto">
          <Save className="w-4 h-4 mr-2" /> Save Config
        </Button>
      </CardContent>
    </Card>
  );
}

function TimelineCard({ initialValue }: { initialValue: string }) {
  const upsert = useUpsertSection();
  const queryClient = useQueryClient();

  const initialItems = safeJson<TimelineItem[]>(initialValue || "[]", []);
  const [items, setItems] = useState<TimelineItem[]>(initialItems);

  useEffect(() => setItems(safeJson<TimelineItem[]>(initialValue || "[]", [])), [initialValue]);

  const serialized = JSON.stringify(items, null, 2);
  const isDirty = (initialValue || "") !== serialized;

  const handleSave = () => {
    upsert.mutate(
      { key: "about_timeline", data: { value: serialized } },
      {
        onSuccess: () => {
          toast.success("Saved About — Career Timeline");
          queryClient.invalidateQueries({ queryKey: getListSectionsQueryKey() });
        },
        onError: () => toast.error("Failed to save About — Career Timeline"),
      },
    );
  };

  return (
    <Card className="bg-card/20 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3 border-b border-border/20">
        <CardTitle className="text-lg font-display flex items-center justify-between">
          About — Career Timeline
          {isDirty && (
            <span className="text-[10px] font-mono text-primary uppercase px-2 py-1 bg-primary/10 rounded">
              Unsaved Changes
            </span>
          )}
        </CardTitle>
        <CardDescription className="font-mono text-xs text-muted-foreground">
          Controls the timeline cards on the About page.
        </CardDescription>
        <div className="text-[10px] font-mono text-muted-foreground/60">
          Key: <span className="text-primary/70">about_timeline</span>
        </div>
      </CardHeader>
      <CardContent className="pt-4 flex flex-col gap-4">
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="rounded-xl border border-border/50 bg-background/40 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="font-mono text-[10px] uppercase text-muted-foreground">Item {index + 1}</div>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setItems((prev) => moveItem(prev, index, -1))}>
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setItems((prev) => moveItem(prev, index, 1))}>
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Input value={item.role} onChange={(e) => setItems((prev) => prev.map((v, i) => i === index ? { ...v, role: e.target.value } : v))} className="bg-background/50 font-mono text-sm" placeholder="Role / Title" />
              <Input value={item.period} onChange={(e) => setItems((prev) => prev.map((v, i) => i === index ? { ...v, period: e.target.value } : v))} className="bg-background/50 font-mono text-sm" placeholder="Period (e.g. 2022 - Present)" />
              <Textarea value={item.desc} onChange={(e) => setItems((prev) => prev.map((v, i) => i === index ? { ...v, desc: e.target.value } : v))} className="bg-background/50 font-mono text-sm min-h-[90px]" placeholder="Description" />
              <label className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                <input type="checkbox" checked={Boolean(item.active)} onChange={(e) => setItems((prev) => prev.map((v, i) => i === index ? { ...v, active: e.target.checked } : v))} />
                Active highlight
              </label>
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" className="font-mono text-xs uppercase tracking-widest" onClick={() => setItems((prev) => [...prev, { role: "", period: "", desc: "", active: false }])}>
          <Plus className="w-4 h-4 mr-2" /> Add Timeline Item
        </Button>

        <Button onClick={handleSave} disabled={!isDirty || upsert.isPending} className="self-end font-mono text-xs uppercase tracking-widest w-full sm:w-auto">
          <Save className="w-4 h-4 mr-2" /> Save Config
        </Button>
      </CardContent>
    </Card>
  );
}

function FeaturedProjectsCard({ initialValue }: { initialValue: string }) {
  const upsert = useUpsertSection();
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useListProjects();
  const projectList = normalizeList<Project>(projects).sort((a, b) => a.sortOrder - b.sortOrder);

  const initialIds = uniqueList(safeJson<number[]>(initialValue || "[]", []).filter((n) => Number.isFinite(n)));
  const [ids, setIds] = useState<number[]>(initialIds);

  useEffect(() => setIds(uniqueList(safeJson<number[]>(initialValue || "[]", []).filter((n) => Number.isFinite(n)))), [initialValue]);

  const serialized = JSON.stringify(ids, null, 2);
  const isDirty = (initialValue || "") !== serialized;

  const selected = ids
    .map((id) => projectList.find((p) => p.id === id))
    .filter((project): project is (typeof projectList)[number] => project != null);

  const handleSave = () => {
    upsert.mutate(
      { key: "home_featured_projects", data: { value: serialized } },
      {
        onSuccess: () => {
          toast.success("Saved Home — Featured Projects");
          queryClient.invalidateQueries({ queryKey: getListSectionsQueryKey() });
        },
        onError: () => toast.error("Failed to save Home — Featured Projects"),
      },
    );
  };

  return (
    <Card className="bg-card/20 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3 border-b border-border/20">
        <CardTitle className="text-lg font-display flex items-center justify-between">
          Home — Featured Projects
          {isDirty && (
            <span className="text-[10px] font-mono text-primary uppercase px-2 py-1 bg-primary/10 rounded">
              Unsaved Changes
            </span>
          )}
        </CardTitle>
        <CardDescription className="font-mono text-xs text-muted-foreground">
          Controls which projects appear on the landing page (order matters — top 3 are shown).
        </CardDescription>
        <div className="text-[10px] font-mono text-muted-foreground/60">
          Key: <span className="text-primary/70">home_featured_projects</span>
        </div>
      </CardHeader>
      <CardContent className="pt-4 flex flex-col gap-4">
        {isLoading ? <div className="text-sm text-muted-foreground font-mono">Loading projects…</div> : null}

        <div className="space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Selected</div>
          {selected.length === 0 ? (
            <div className="text-sm text-muted-foreground font-mono">None selected (landing page will fallback to latest).</div>
          ) : (
            selected.map((project, index) => (
              <div
                key={project.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/40 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="font-mono text-sm text-foreground/90 truncate">{project.title}</div>
                  <div className="text-[10px] font-mono text-muted-foreground/70 truncate">#{project.id} / {project.category}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIds((prev) => moveItem(prev, index, -1))}>
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIds((prev) => moveItem(prev, index, 1))}>
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setIds((prev) => prev.filter((v) => v !== project.id))}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Available</div>
          <div className="max-h-[260px] overflow-y-auto rounded-xl border border-border/50 bg-background/30">
            <div className="divide-y divide-border/20">
              {projectList.map((p) => {
                const active = ids.includes(p.id);
                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="min-w-0">
                      <div className="font-mono text-sm text-foreground/90 truncate">{p.title}</div>
                      <div className="text-[10px] font-mono text-muted-foreground/70 truncate">#{p.id} / {p.category}</div>
                    </div>
                    <Button
                      type="button"
                      variant={active ? "secondary" : "outline"}
                      className="font-mono text-[10px] uppercase tracking-widest h-9"
                      onClick={() => {
                        if (active) setIds((prev) => prev.filter((v) => v !== p.id));
                        else setIds((prev) => uniqueList([...prev, p.id]));
                      }}
                    >
                      {active ? "Selected" : "Add"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={!isDirty || upsert.isPending} className="self-end font-mono text-xs uppercase tracking-widest w-full sm:w-auto">
          <Save className="w-4 h-4 mr-2" /> Save Config
        </Button>
      </CardContent>
    </Card>
  );
}

function FeaturedPostsCard({ initialValue }: { initialValue: string }) {
  const upsert = useUpsertSection();
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useListPosts({ includeUnpublished: true });
  const postList = normalizeList<Post>(posts);

  const initialSlugs = uniqueList(safeJson<string[]>(initialValue || "[]", []).filter((v) => typeof v === "string" && v.trim() !== ""));
  const [slugs, setSlugs] = useState<string[]>(initialSlugs);

  useEffect(() => setSlugs(uniqueList(safeJson<string[]>(initialValue || "[]", []).filter((v) => typeof v === "string" && v.trim() !== ""))), [initialValue]);

  const serialized = JSON.stringify(slugs, null, 2);
  const isDirty = (initialValue || "") !== serialized;

  const selected = slugs
    .map((slug) => postList.find((p) => p.slug === slug))
    .filter((post): post is (typeof postList)[number] => post != null);

  const handleSave = () => {
    upsert.mutate(
      { key: "home_featured_posts", data: { value: serialized } },
      {
        onSuccess: () => {
          toast.success("Saved Home — Featured Posts");
          queryClient.invalidateQueries({ queryKey: getListSectionsQueryKey() });
        },
        onError: () => toast.error("Failed to save Home — Featured Posts"),
      },
    );
  };

  return (
    <Card className="bg-card/20 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3 border-b border-border/20">
        <CardTitle className="text-lg font-display flex items-center justify-between">
          Home — Featured Blog Posts
          {isDirty && (
            <span className="text-[10px] font-mono text-primary uppercase px-2 py-1 bg-primary/10 rounded">
              Unsaved Changes
            </span>
          )}
        </CardTitle>
        <CardDescription className="font-mono text-xs text-muted-foreground">
          Controls which blog posts appear on the landing page (order matters — top 3 are shown).
        </CardDescription>
        <div className="text-[10px] font-mono text-muted-foreground/60">
          Key: <span className="text-primary/70">home_featured_posts</span>
        </div>
      </CardHeader>
      <CardContent className="pt-4 flex flex-col gap-4">
        {isLoading ? <div className="text-sm text-muted-foreground font-mono">Loading posts…</div> : null}

        <div className="space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Selected</div>
          {selected.length === 0 ? (
            <div className="text-sm text-muted-foreground font-mono">None selected (landing page will fallback to latest).</div>
          ) : (
            selected.map((post, index) => (
              <div
                key={post.slug}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/40 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="font-mono text-sm text-foreground/90 truncate">{post.title}</div>
                  <div className="text-[10px] font-mono text-muted-foreground/70 truncate">{post.slug}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSlugs((prev) => moveItem(prev, index, -1))}>
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSlugs((prev) => moveItem(prev, index, 1))}>
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setSlugs((prev) => prev.filter((v) => v !== post.slug))}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Available</div>
          <div className="max-h-[260px] overflow-y-auto rounded-xl border border-border/50 bg-background/30">
            <div className="divide-y divide-border/20">
              {postList.map((p) => {
                const active = slugs.includes(p.slug);
                return (
                  <div key={p.slug} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="min-w-0">
                      <div className="font-mono text-sm text-foreground/90 truncate">{p.title}</div>
                      <div className="text-[10px] font-mono text-muted-foreground/70 truncate">{p.slug}{p.isPublished ? "" : " (draft)"}</div>
                    </div>
                    <Button
                      type="button"
                      variant={active ? "secondary" : "outline"}
                      className="font-mono text-[10px] uppercase tracking-widest h-9"
                      onClick={() => {
                        if (active) setSlugs((prev) => prev.filter((v) => v !== p.slug));
                        else setSlugs((prev) => uniqueList([...prev, p.slug]));
                      }}
                    >
                      {active ? "Selected" : "Add"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={!isDirty || upsert.isPending} className="self-end font-mono text-xs uppercase tracking-widest w-full sm:w-auto">
          <Save className="w-4 h-4 mr-2" /> Save Config
        </Button>
      </CardContent>
    </Card>
  );
}

function FeaturedSkillsCard({ initialValue }: { initialValue: string }) {
  const upsert = useUpsertSection();
  const queryClient = useQueryClient();

  const { data: skills, isLoading } = useGetSkills();
  const categories = normalizeList<{ id: number; title: string; icon: string; skills: { id: number; name: string; level: number }[] }>(skills?.categories);

  const initialIds = uniqueList(safeJson<number[]>(initialValue || "[]", []).filter((n) => Number.isFinite(n)));
  const [ids, setIds] = useState<number[]>(initialIds);

  useEffect(() => setIds(uniqueList(safeJson<number[]>(initialValue || "[]", []).filter((n) => Number.isFinite(n)))), [initialValue]);

  const serialized = JSON.stringify(ids, null, 2);
  const isDirty = (initialValue || "") !== serialized;

  const selected = ids
    .map((id) => categories.find((c) => c.id === id))
    .filter((cat): cat is (typeof categories)[number] => cat != null);

  const handleSave = () => {
    upsert.mutate(
      { key: "home_featured_skill_categories", data: { value: serialized } },
      {
        onSuccess: () => {
          toast.success("Saved Home — Featured Skills");
          queryClient.invalidateQueries({ queryKey: getListSectionsQueryKey() });
        },
        onError: () => toast.error("Failed to save Home — Featured Skills"),
      },
    );
  };

  return (
    <Card className="bg-card/20 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3 border-b border-border/20">
        <CardTitle className="text-lg font-display flex items-center justify-between">
          Home — Featured Skills
          {isDirty && (
            <span className="text-[10px] font-mono text-primary uppercase px-2 py-1 bg-primary/10 rounded">
              Unsaved Changes
            </span>
          )}
        </CardTitle>
        <CardDescription className="font-mono text-xs text-muted-foreground">
          Controls which skill categories appear on the landing page (order matters — top 3 are shown).
        </CardDescription>
        <div className="text-[10px] font-mono text-muted-foreground/60">
          Key: <span className="text-primary/70">home_featured_skill_categories</span>
        </div>
      </CardHeader>
      <CardContent className="pt-4 flex flex-col gap-4">
        {isLoading ? <div className="text-sm text-muted-foreground font-mono">Loading skills…</div> : null}

        <div className="space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Selected</div>
          {selected.length === 0 ? (
            <div className="text-sm text-muted-foreground font-mono">None selected (landing page will fallback to top categories).</div>
          ) : (
            selected.map((cat, index) => (
              <div
                key={cat.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/40 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="font-mono text-sm text-foreground/90 truncate">{cat.title}</div>
                  <div className="text-[10px] font-mono text-muted-foreground/70 truncate">#{cat.id} / {cat.icon}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIds((prev) => moveItem(prev, index, -1))}>
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIds((prev) => moveItem(prev, index, 1))}>
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setIds((prev) => prev.filter((v) => v !== cat.id))}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Available</div>
          <div className="max-h-[260px] overflow-y-auto rounded-xl border border-border/50 bg-background/30">
            <div className="divide-y divide-border/20">
              {categories.map((c) => {
                const active = ids.includes(c.id);
                return (
                  <div key={c.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="min-w-0">
                      <div className="font-mono text-sm text-foreground/90 truncate">{c.title}</div>
                      <div className="text-[10px] font-mono text-muted-foreground/70 truncate">#{c.id} / {c.icon}</div>
                    </div>
                    <Button
                      type="button"
                      variant={active ? "secondary" : "outline"}
                      className="font-mono text-[10px] uppercase tracking-widest h-9"
                      onClick={() => {
                        if (active) setIds((prev) => prev.filter((v) => v !== c.id));
                        else setIds((prev) => uniqueList([...prev, c.id]));
                      }}
                    >
                      {active ? "Selected" : "Add"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={!isDirty || upsert.isPending} className="self-end font-mono text-xs uppercase tracking-widest w-full sm:w-auto">
          <Save className="w-4 h-4 mr-2" /> Save Config
        </Button>
      </CardContent>
    </Card>
  );
}

function SkillCategoryImagesCard({ initialValue }: { initialValue: string }) {
  const upsert = useUpsertSection();
  const queryClient = useQueryClient();

  const { data: skills, isLoading } = useGetSkills();
  const categories = normalizeList<SkillCategory>(skills?.categories);

  const initialItems = normalizeSkillCategoryImages(safeJson<SkillCategoryImageConfig[]>(initialValue || "[]", []));
  const [items, setItems] = useState<SkillCategoryImageConfig[]>(initialItems);
  const [isUploadingId, setIsUploadingId] = useState<number | null>(null);

  useEffect(() => setItems(normalizeSkillCategoryImages(safeJson<SkillCategoryImageConfig[]>(initialValue || "[]", []))), [initialValue]);

  const serialized = JSON.stringify(items, null, 2);
  const isDirty = (initialValue || "") !== serialized;

  const handleSave = () => {
    upsert.mutate(
      { key: "home_skill_category_images", data: { value: serialized } },
      {
        onSuccess: () => {
          toast.success("Saved Home — Skill Category Images");
          queryClient.invalidateQueries({ queryKey: getListSectionsQueryKey() });
        },
        onError: () => toast.error("Failed to save Home — Skill Category Images"),
      },
    );
  };

  async function handleUpload(categoryId: number, file: File | null) {
    if (!file) return;
    setIsUploadingId(categoryId);
    try {
      const url = await uploadImage(file, "generic");
      setItems((prev) => {
        const next = normalizeSkillCategoryImages(prev);
        const idx = next.findIndex((v) => v.categoryId === categoryId);
        if (idx >= 0) next[idx] = { ...next[idx], image: url };
        else next.push({ categoryId, image: url });
        return normalizeSkillCategoryImages(next);
      });
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploadingId(null);
    }
  }

  function getImageValue(categoryId: number): string {
    return items.find((v) => v.categoryId === categoryId)?.image ?? "";
  }

  return (
    <Card className="bg-card/20 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3 border-b border-border/20">
        <CardTitle className="text-lg font-display flex items-center justify-between">
          Home — Skill Category Images
          {isDirty && (
            <span className="text-[10px] font-mono text-primary uppercase px-2 py-1 bg-primary/10 rounded">
              Unsaved Changes
            </span>
          )}
        </CardTitle>
        <CardDescription className="font-mono text-xs text-muted-foreground">
          Optional: set custom images for landing-page skill cards (falls back to built-in defaults when empty).
        </CardDescription>
        <div className="text-[10px] font-mono text-muted-foreground/60">
          Key: <span className="text-primary/70">home_skill_category_images</span>
        </div>
      </CardHeader>
      <CardContent className="pt-4 flex flex-col gap-4">
        {isLoading ? <div className="text-sm text-muted-foreground font-mono">Loading skills…</div> : null}

        <div className="space-y-3">
          {categories.map((cat) => {
            const value = getImageValue(cat.id);
            return (
              <div key={cat.id} className="rounded-xl border border-border/50 bg-background/40 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-sm text-foreground/90 truncate">{cat.title}</div>
                    <div className="text-[10px] font-mono text-muted-foreground/70 truncate">#{cat.id} / {cat.icon}</div>
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:border-primary/40 hover:text-primary w-fit">
                    <Upload className="h-3.5 w-3.5" />
                    {isUploadingId === cat.id ? "Uploading..." : "Upload"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        void handleUpload(cat.id, event.target.files?.[0] ?? null);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                </div>

                <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-center">
                  <Input
                    value={value}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      setItems((prev) => {
                        const next = normalizeSkillCategoryImages(prev);
                        const idx = next.findIndex((v) => v.categoryId === cat.id);
                        if (idx >= 0) next[idx] = { ...next[idx], image: nextValue };
                        else next.push({ categoryId: cat.id, image: nextValue });
                        return normalizeSkillCategoryImages(next);
                      });
                    }}
                    className="bg-background/50 font-mono text-sm"
                    placeholder="/images/your-skill.png or /uploads/your-image.png or https://..."
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="font-mono text-xs uppercase tracking-widest"
                    onClick={() => setItems((prev) => prev.filter((v) => v.categoryId !== cat.id))}
                    disabled={!value}
                  >
                    Clear
                  </Button>
                </div>

                {value ? (
                  <div className="rounded-lg overflow-hidden border border-border/50 bg-background/30">
                    <img src={value} alt={`${cat.title} preview`} className="w-full h-36 object-cover" />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <Button onClick={handleSave} disabled={!isDirty || upsert.isPending} className="self-end font-mono text-xs uppercase tracking-widest w-full sm:w-auto">
          <Save className="w-4 h-4 mr-2" /> Save Config
        </Button>
      </CardContent>
    </Card>
  );
}

function ConnectAccountsCard({ initialValue }: { initialValue: string }) {
  const upsert = useUpsertSection();
  const queryClient = useQueryClient();

  const initialItems = safeJson<ConnectAccount[]>(initialValue || "[]", []);
  const [items, setItems] = useState<ConnectAccount[]>(initialItems);
  const [isUploadingIndex, setIsUploadingIndex] = useState<number | null>(null);

  useEffect(() => setItems(safeJson<ConnectAccount[]>(initialValue || "[]", [])), [initialValue]);

  const serialized = JSON.stringify(items, null, 2);
  const isDirty = (initialValue || "") !== serialized;

  const handleSave = () => {
    upsert.mutate(
      { key: "connect_accounts", data: { value: serialized } },
      {
        onSuccess: () => {
          toast.success("Saved Footer — Connect Accounts");
          queryClient.invalidateQueries({ queryKey: getListSectionsQueryKey() });
        },
        onError: () => toast.error("Failed to save Footer — Connect Accounts"),
      },
    );
  };

  async function handleLogoUpload(index: number, file: File | null) {
    if (!file) return;
    setIsUploadingIndex(index);
    try {
      const url = await uploadImage(file, "generic");
      setItems((prev) => prev.map((v, i) => (i === index ? { ...v, logo: url } : v)));
      toast.success("Logo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploadingIndex(null);
    }
  }

  return (
    <Card className="bg-card/20 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3 border-b border-border/20">
        <CardTitle className="text-lg font-display flex items-center justify-between">
          Footer — Connect Accounts
          {isDirty && (
            <span className="text-[10px] font-mono text-primary uppercase px-2 py-1 bg-primary/10 rounded">
              Unsaved Changes
            </span>
          )}
        </CardTitle>
        <CardDescription className="font-mono text-xs text-muted-foreground">
          Add custom connect buttons with a logo and URL.
        </CardDescription>
        <div className="text-[10px] font-mono text-muted-foreground/60">
          Key: <span className="text-primary/70">connect_accounts</span>
        </div>
      </CardHeader>
      <CardContent className="pt-4 flex flex-col gap-4">
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={`${item.name}-${index}`} className="rounded-xl border border-border/50 bg-background/40 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="font-mono text-[10px] uppercase text-muted-foreground">Account {index + 1}</div>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setItems((prev) => moveItem(prev, index, -1))}>
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setItems((prev) => moveItem(prev, index, 1))}>
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <Input value={item.name} onChange={(e) => setItems((prev) => prev.map((v, i) => i === index ? { ...v, name: e.target.value } : v))} className="bg-background/50 font-mono text-sm" placeholder="Name (e.g. GitHub)" />
                <Input value={item.url} onChange={(e) => setItems((prev) => prev.map((v, i) => i === index ? { ...v, url: e.target.value } : v))} className="bg-background/50 font-mono text-sm" placeholder="URL (https://... or mailto:...)" />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-border/50 bg-background/50 shrink-0">
                    {item.logo ? (
                      <img src={item.logo} alt={item.name} className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <Input value={item.logo ?? ""} onChange={(e) => setItems((prev) => prev.map((v, i) => i === index ? { ...v, logo: e.target.value } : v))} className="bg-background/50 font-mono text-sm" placeholder="/uploads/logo.png (optional)" />
                </div>

                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:border-primary/40 hover:text-primary w-fit">
                  <Upload className="h-3.5 w-3.5" />
                  {isUploadingIndex === index ? "Uploading..." : "Upload Logo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      void handleLogoUpload(index, event.target.files?.[0] ?? null);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" className="font-mono text-xs uppercase tracking-widest" onClick={() => setItems((prev) => [...prev, { name: "", url: "", logo: "" }])}>
          <Plus className="w-4 h-4 mr-2" /> Add Account
        </Button>

        <Button onClick={handleSave} disabled={!isDirty || upsert.isPending} className="self-end font-mono text-xs uppercase tracking-widest w-full sm:w-auto">
          <Save className="w-4 h-4 mr-2" /> Save Config
        </Button>
      </CardContent>
    </Card>
  );
}

export default function SectionsEditor() {
  const { data: sections, isLoading } = useListSections();
  const sectionList = normalizeList<{ key: string; value: string }>(sections);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground font-mono">Loading sections...</div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="border-b border-border/50 pb-6">
        <h1 className="text-3xl font-display font-bold">Content Matrix</h1>
        <p className="text-muted-foreground font-mono text-sm mt-1">Manage global copy and configuration keys.</p>
      </div>

      <div className="grid gap-6 max-w-4xl">
        <HeroImageCard initialValue={sectionList.find((s) => s.key === "home_hero_image")?.value || ""} />
        <TickerCard initialValue={sectionList.find((s) => s.key === "home_ticker")?.value || "[]"} />
        <ClientsTickerCard initialValue={sectionList.find((s) => s.key === "home_clients_ticker")?.value || "[]"} />
        <ResumeCard initialValue={sectionList.find((s) => s.key === "resume_url")?.value || ""} />
        <FeaturedProjectsCard initialValue={sectionList.find((s) => s.key === "home_featured_projects")?.value || "[]"} />
        <TestimonialsCard initialValue={sectionList.find((s) => s.key === "home_testimonials")?.value || "[]"} />
        <FeaturedSkillsCard initialValue={sectionList.find((s) => s.key === "home_featured_skill_categories")?.value || "[]"} />
        <SkillCategoryImagesCard initialValue={sectionList.find((s) => s.key === "home_skill_category_images")?.value || "[]"} />
        <FeaturedPostsCard initialValue={sectionList.find((s) => s.key === "home_featured_posts")?.value || "[]"} />
        <TimelineCard initialValue={sectionList.find((s) => s.key === "about_timeline")?.value || "[]"} />
        <ConnectAccountsCard initialValue={sectionList.find((s) => s.key === "connect_accounts")?.value || "[]"} />

        {SECTION_SCHEMA.map(schema => {
          const existing = sectionList.find((s) => s.key === schema.key);
          return (
            <SectionCard 
              key={schema.key} 
              schema={schema} 
              initialValue={existing?.value || ""} 
            />
          );
        })}
      </div>
    </div>
  );
}
