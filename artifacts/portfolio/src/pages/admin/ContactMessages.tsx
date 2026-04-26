import {
  getListContactMessagesQueryKey,
  useDeleteContactMessage,
  useListContactMessages,
  useUpdateContactMessage,
  type ContactMessage,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, Mail, MailOpen, Search, Trash2 } from "lucide-react";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function formatDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

export default function ContactMessages() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);

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

      <div className="bg-card/40 border border-border/50 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-card/50 font-mono text-xs uppercase text-muted-foreground border-b border-border/50">
              <tr>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">From</th>
                <th className="px-6 py-4 font-medium hidden md:table-cell">Subject</th>
                <th className="px-6 py-4 font-medium hidden lg:table-cell">Received</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {list.isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    No messages found.
                  </td>
                </tr>
              ) : (
                filtered.map((message) => (
                  <tr
                    key={message.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Badge
                        variant={message.isRead ? "secondary" : "default"}
                        className="font-mono text-[10px] uppercase"
                      >
                        {message.isRead ? "Read" : "Unread"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{message.name}</span>
                        <span className="text-muted-foreground font-mono text-xs break-all">
                          {message.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-mono text-xs hidden md:table-cell">
                      {message.subject}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-mono text-xs hidden lg:table-cell">
                      {formatDate(message.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="border-border/50 bg-card/95 backdrop-blur-xl max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <span>Message #{message.id}</span>
                                <Badge
                                  variant={message.isRead ? "secondary" : "default"}
                                  className="font-mono text-[10px] uppercase"
                                >
                                  {message.isRead ? "Read" : "Unread"}
                                </Badge>
                              </DialogTitle>
                              <DialogDescription className="font-mono text-xs">
                                Received {formatDate(message.createdAt)}
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 text-sm">
                              <div className="grid sm:grid-cols-2 gap-4">
                                <div className="bg-card/40 border border-border/50 rounded-lg p-4">
                                  <div className="text-muted-foreground font-mono text-[10px] uppercase mb-1">
                                    From
                                  </div>
                                  <div className="font-medium">{message.name}</div>
                                  <div className="text-muted-foreground font-mono text-xs break-all">
                                    {message.email}
                                  </div>
                                </div>
                                <div className="bg-card/40 border border-border/50 rounded-lg p-4">
                                  <div className="text-muted-foreground font-mono text-[10px] uppercase mb-1">
                                    Subject
                                  </div>
                                  <div className="font-medium">{message.subject}</div>
                                </div>
                              </div>

                              <div className="bg-card/40 border border-border/50 rounded-lg p-4">
                                <div className="text-muted-foreground font-mono text-[10px] uppercase mb-2">
                                  Message
                                </div>
                                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                                  {message.message}
                                </pre>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          onClick={() => toggleRead(message)}
                          disabled={updateMessage.isPending}
                        >
                          {message.isRead ? (
                            <Mail className="w-4 h-4" />
                          ) : (
                            <MailOpen className="w-4 h-4" />
                          )}
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              disabled={deleteMessage.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="border-border/50 bg-card/95 backdrop-blur-xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Message</AlertDialogTitle>
                              <AlertDialogDescription>
                                Delete this message from {message.name}? This action
                                cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="font-mono text-xs uppercase">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => remove(message.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono text-xs uppercase"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

