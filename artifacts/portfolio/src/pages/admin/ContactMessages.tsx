import {
  getListContactMessagesQueryKey,
  useDeleteContactMessage,
  useListContactMessages,
  useUpdateContactMessage,
  type ContactMessage,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Mail, MailOpen, Search, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { normalizeList } from "@/lib/normalize-list";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function formatDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

export default function ContactMessages() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const list = useListContactMessages(
    { unreadOnly },
    { query: { queryKey: getListContactMessagesQueryKey({ unreadOnly }) } },
  );
  const updateMessage = useUpdateContactMessage();
  const deleteMessage = useDeleteContactMessage();

  const messages = normalizeList<ContactMessage>(list.data);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return messages;
    return messages.filter((m) =>
      `${m.name} ${m.email} ${m.subject} ${m.message}`.toLowerCase().includes(needle),
    );
  }, [messages, search]);

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null);
      return;
    }
    setSelectedId((prev) => {
      if (prev == null) return filtered[0]?.id ?? null;
      if (filtered.some((m) => m.id === prev)) return prev;
      return filtered[0]?.id ?? null;
    });
  }, [filtered]);

  const selected = useMemo(() => {
    if (selectedId == null) return null;
    return filtered.find((m) => m.id === selectedId) ?? null;
  }, [filtered, selectedId]);

  const markRead = (message: ContactMessage) => {
    if (message.isRead) return;

    updateMessage.mutate(
      { id: message.id, data: { isRead: true } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getListContactMessagesQueryKey({ unreadOnly }),
          });
          queryClient.invalidateQueries({
            queryKey: getListContactMessagesQueryKey({ unreadOnly: false }),
          });
          queryClient.invalidateQueries({
            queryKey: getListContactMessagesQueryKey({ unreadOnly: true }),
          });
        },
      },
    );
  };

  const toggleRead = (message: ContactMessage) => {
    updateMessage.mutate(
      { id: message.id, data: { isRead: !message.isRead } },
      {
        onSuccess: () => {
          toast.success(message.isRead ? "Marked as unread" : "Marked as read");
          queryClient.invalidateQueries({
            queryKey: getListContactMessagesQueryKey({ unreadOnly }),
          });
          queryClient.invalidateQueries({
            queryKey: getListContactMessagesQueryKey({ unreadOnly: false }),
          });
          queryClient.invalidateQueries({
            queryKey: getListContactMessagesQueryKey({ unreadOnly: true }),
          });
        },
        onError: () => toast.error("Failed to update message"),
      },
    );
  };

  const remove = (id: number) => {
    deleteMessage.mutate(
      { id },
      {
        onSuccess: () => {
          toast.success("Message deleted");
          queryClient.invalidateQueries({
            queryKey: getListContactMessagesQueryKey({ unreadOnly }),
          });
          queryClient.invalidateQueries({
            queryKey: getListContactMessagesQueryKey({ unreadOnly: false }),
          });
          queryClient.invalidateQueries({
            queryKey: getListContactMessagesQueryKey({ unreadOnly: true }),
          });
        },
        onError: () => toast.error("Failed to delete message"),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Contact Messages</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">
            Review incoming contact form submissions.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex items-center gap-4 bg-card/20 p-2 rounded-lg border border-border/50 flex-1">
          <Search className="w-5 h-5 text-muted-foreground ml-2" />
          <Input
            placeholder="Search by name, email, subject, or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 font-mono text-sm"
          />
        </div>

        <div className="flex items-center justify-between lg:justify-start gap-3 bg-card/20 p-3 rounded-lg border border-border/50">
          <div className="flex flex-col">
            <span className="font-mono text-xs uppercase text-muted-foreground">
              Unread Only
            </span>
          </div>
          <Switch checked={unreadOnly} onCheckedChange={setUnreadOnly} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <div className="bg-card/40 border border-border/50 rounded-xl overflow-hidden backdrop-blur-sm">
          <div className="px-4 py-3 border-b border-border/50 bg-card/50 flex items-center justify-between">
            <div className="font-mono text-xs uppercase text-muted-foreground">
              Inbox
            </div>
            <div className="font-mono text-xs text-muted-foreground">
              {filtered.length} message{filtered.length === 1 ? "" : "s"}
            </div>
          </div>

          {list.isLoading ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              No messages found.
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filtered.map((message) => {
                const isSelected = selectedId === message.id;
                const preview = (message.message || "")
                  .replace(/\s+/g, " ")
                  .trim()
                  .slice(0, 120);

                return (
                  <button
                    key={message.id}
                    type="button"
                    className={[
                      "w-full text-left px-4 py-3 transition-colors",
                      "hover:bg-muted/20",
                      isSelected ? "bg-muted/20" : "",
                    ].join(" ")}
                    onClick={() => {
                      setSelectedId(message.id);
                      markRead(message);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1.5">
                        <span
                          className={[
                            "inline-block h-2 w-2 rounded-full",
                            message.isRead ? "bg-muted-foreground/30" : "bg-primary",
                          ].join(" ")}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium truncate">
                              {message.subject || "(No subject)"}
                            </div>
                            <div className="text-muted-foreground font-mono text-xs truncate">
                              {message.name} • {message.email}
                            </div>
                          </div>
                          <div className="text-muted-foreground font-mono text-[10px] whitespace-nowrap">
                            {formatDate(message.createdAt)}
                          </div>
                        </div>

                        {preview ? (
                          <div className="text-muted-foreground text-xs mt-2 line-clamp-2">
                            {preview}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-card/40 border border-border/50 rounded-xl overflow-hidden backdrop-blur-sm min-h-[320px]">
          <div className="px-4 py-3 border-b border-border/50 bg-card/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="font-mono text-xs uppercase text-muted-foreground">
                Message
              </div>
              {selected ? (
                <Badge
                  variant={selected.isRead ? "secondary" : "default"}
                  className="font-mono text-[10px] uppercase"
                >
                  {selected.isRead ? "Read" : "Unread"}
                </Badge>
              ) : null}
            </div>

            {selected ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                  onClick={() => toggleRead(selected)}
                  disabled={updateMessage.isPending}
                  title={selected.isRead ? "Mark as unread" : "Mark as read"}
                >
                  {selected.isRead ? (
                    <Mail className="w-4 h-4" />
                  ) : (
                    <MailOpen className="w-4 h-4" />
                  )}
                </Button>

                <Button
                  asChild
                  variant="ghost"
                  className="h-8 px-3 font-mono text-xs uppercase text-muted-foreground hover:text-primary hover:bg-primary/10"
                >
                  <a
                    href={`mailto:${selected.email}?subject=${encodeURIComponent(
                      `Re: ${selected.subject || "Contact message"}`,
                    )}`}
                  >
                    Reply
                  </a>
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      disabled={deleteMessage.isPending}
                      title="Delete message"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border-border/50 bg-card/95 backdrop-blur-xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Message</AlertDialogTitle>
                      <AlertDialogDescription>
                        Delete this message from {selected.name}? This action cannot
                        be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="font-mono text-xs uppercase">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => remove(selected.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono text-xs uppercase"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : null}
          </div>

          {selected ? (
            <div className="p-4 space-y-4">
              <div className="space-y-1">
                <div className="text-2xl font-display font-bold break-words">
                  {selected.subject || "(No subject)"}
                </div>
                <div className="text-muted-foreground font-mono text-xs break-words">
                  From {selected.name} • {selected.email} • {formatDate(selected.createdAt)}
                </div>
              </div>

              <div className="bg-card/40 border border-border/50 rounded-lg p-4">
                <div className="text-muted-foreground font-mono text-[10px] uppercase mb-2">
                  Body
                </div>
                <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed max-h-[60vh] overflow-y-auto">
                  {selected.message}
                </pre>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              Select a message to read.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
