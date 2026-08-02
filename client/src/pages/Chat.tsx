import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Flag,
  ImagePlus,
  MessageSquarePlus,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MemberLayout } from "@/components/member/MemberLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Channel, MemberDirectory, Message } from "@/lib/member-types";

type ConversationSummary = {
  conversation_id: string;
  other_user_id: string;
  other_name: string;
  other_group: number | null;
  can_send: boolean;
  updated_at: string;
};

export default function ChatPage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [channelId, setChannelId] = useState("");
  const [conversation, setConversation] = useState<ConversationSummary | null>(
    null,
  );
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { data: channels = [] } = useQuery({
    queryKey: ["channels", profile?.group_no],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("channels")
        .select("*")
        .order("kind")
        .order("group_no");
      if (error) throw error;
      return data as Channel[];
    },
  });
  const { data: directory = [] } = useQuery({
    queryKey: ["member-directory", profile?.group_no],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_member_directory");
      if (error) throw error;
      return data as MemberDirectory[];
    },
  });
  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_my_conversations");
      if (error) throw error;
      return data as ConversationSummary[];
    },
  });
  const targetKey = conversation
    ? `dm:${conversation.conversation_id}`
    : channelId
      ? `channel:${channelId}`
      : "none";
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", targetKey],
    enabled: targetKey !== "none",
    queryFn: async () => {
      let query = supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(100);
      query = conversation
        ? query.eq("conversation_id", conversation.conversation_id)
        : query.eq("channel_id", channelId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Message[];
    },
  });
  const directoryMap = useMemo(
    () => new Map(directory.map((member) => [member.id, member])),
    [directory],
  );
  const activeChannel = channels.find((channel) => channel.id === channelId);
  useEffect(() => {
    if (!channelId && !conversation && channels[0])
      setChannelId(channels[0].id);
  }, [channels, channelId, conversation]);
  useEffect(() => {
    if (targetKey === "none") return;
    const filter = conversation
      ? `conversation_id=eq.${conversation.conversation_id}`
      : `channel_id=eq.${channelId}`;
    const realtime = supabase
      .channel(`messages:${targetKey}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter },
        () =>
          queryClient.invalidateQueries({ queryKey: ["messages", targetKey] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(realtime);
    };
  }, [targetKey, channelId, conversation, queryClient]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function startDirect(member: MemberDirectory) {
    setError("");
    const { data, error } = await supabase.rpc("create_direct_conversation", {
      other_user: member.id,
    });
    if (error) return setError(error.message);
    await queryClient.invalidateQueries({ queryKey: ["conversations"] });
    setChannelId("");
    setConversation({
      conversation_id: data as string,
      other_user_id: member.id,
      other_name: member.full_name,
      other_group: member.group_no,
      can_send: true,
      updated_at: new Date().toISOString(),
    });
  }
  async function removeMessage(message: Message) {
    const { error } = await supabase
      .from("messages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", message.id);
    if (error) setError(error.message);
  }
  async function reportMessage(message: Message) {
    const reason = window.prompt("Why are you reporting this message?");
    if (!reason) return;
    const { error } = await supabase.rpc("report_message", {
      target_message: message.id,
      report_reason: reason,
    });
    setError(error ? error.message : "Message reported to the administrators.");
  }
  const canPost =
    activeChannel?.kind !== "announcements" || profile?.role !== "student";
  const canSend = conversation ? conversation.can_send : canPost;

  return (
    <MemberLayout>
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">
          Community
        </p>
        <h1 className="mt-3 font-sans text-3xl font-semibold normal-case tracking-[-0.04em]">
          Member chat
        </h1>
        <p className="mt-2 text-sm text-white/38">
          Your verified balance determines your trading room.
        </p>
      </div>
      {error && (
        <p className="mb-5 border-l border-white/30 pl-3 text-xs text-white/55">
          {error}
        </p>
      )}
      <div className="grid min-h-[620px] overflow-hidden border border-white/[0.09] lg:grid-cols-[250px_minmax(0,1fr)_250px]">
        <aside className="border-b border-white/[0.08] bg-white/[0.015] p-4 lg:border-b-0 lg:border-r">
          <p className="px-2 text-[9px] uppercase tracking-[0.18em] text-white/25">
            Rooms
          </p>
          <div className="mt-2 space-y-1">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => {
                  setConversation(null);
                  setChannelId(channel.id);
                }}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-xs ${channelId === channel.id && !conversation ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white/70"}`}
              >
                <Users className="size-3.5" />
                {channel.name}
              </button>
            ))}
          </div>
          <p className="mt-7 px-2 text-[9px] uppercase tracking-[0.18em] text-white/25">
            Direct messages
          </p>
          <div className="mt-2 space-y-1">
            {conversations.map((item) => (
              <button
                key={item.conversation_id}
                onClick={() => {
                  setChannelId("");
                  setConversation(item);
                }}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-xs ${conversation?.conversation_id === item.conversation_id ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white/70"}`}
              >
                <span className="grid size-6 place-items-center rounded-full bg-white/10 text-[8px]">
                  {item.other_name.slice(0, 2).toUpperCase()}
                </span>
                <span className="truncate">{item.other_name}</span>
                {!item.can_send && (
                  <span className="ml-auto text-[8px] text-white/20">
                    read only
                  </span>
                )}
              </button>
            ))}
            {conversations.length === 0 && (
              <p className="px-2 py-3 text-[10px] text-white/22">
                No conversations yet.
              </p>
            )}
          </div>
        </aside>
        <section className="flex min-h-[580px] min-w-0 flex-col">
          <header className="border-b border-white/[0.08] px-5 py-4">
            <h2 className="font-sans text-sm font-semibold normal-case tracking-normal">
              {conversation?.other_name ||
                activeChannel?.name ||
                "Select a room"}
            </h2>
            <p className="mt-1 text-[10px] text-white/28">
              {conversation
                ? conversation.can_send
                  ? `Private · ${conversation.other_group ? `Group ${conversation.other_group}` : "Administrator"}`
                  : "Previous conversation · read only"
                : activeChannel?.kind === "announcements"
                  ? "Updates for all active members"
                  : "Visible only to your verified balance group"}
            </p>
          </header>
          <div className="flex-1 space-y-1 overflow-y-auto p-4 sm:p-6">
            {isLoading ? (
              <p className="text-xs text-white/25">Loading messages…</p>
            ) : messages.length === 0 ? (
              <div className="grid h-full place-items-center text-center">
                <div>
                  <MessageSquarePlus className="mx-auto size-7 text-white/25" />
                  <p className="mt-3 text-xs text-white/30">
                    Start the conversation.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <MessageRow
                  key={message.id}
                  message={message}
                  own={message.sender_id === profile?.id}
                  sender={
                    directoryMap.get(message.sender_id)?.full_name ||
                    (message.sender_id === conversation?.other_user_id
                      ? conversation.other_name
                      : "Member")
                  }
                  onDelete={() => removeMessage(message)}
                  onReport={() => reportMessage(message)}
                />
              ))
            )}
            <div ref={bottomRef} />
          </div>
          {canSend ? (
            <Composer
              channelId={conversation ? null : channelId}
              conversationId={conversation?.conversation_id || null}
              userId={profile!.id}
              onError={setError}
              onSent={() =>
                queryClient.invalidateQueries({
                  queryKey: ["messages", targetKey],
                })
              }
            />
          ) : (
            <div className="border-t border-white/[0.08] px-5 py-4 text-xs text-white/30">
              You can read this conversation but cannot send new messages.
            </div>
          )}
        </section>
        <aside className="hidden border-l border-white/[0.08] p-4 lg:block">
          <p className="px-2 text-[9px] uppercase tracking-[0.18em] text-white/25">
            Start a message
          </p>
          <div className="mt-2 space-y-1">
            {directory
              .filter((member) => member.id !== profile?.id)
              .map((member) => (
                <button
                  key={member.id}
                  onClick={() => startDirect(member)}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-xs text-white/40 hover:bg-white/[0.04] hover:text-white/70"
                >
                  <span className="grid size-7 place-items-center rounded-full bg-white/10 text-[8px]">
                    {member.full_name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate">{member.full_name}</span>
                    <span className="mt-0.5 block text-[8px] uppercase tracking-wider text-white/20">
                      {member.role === "student"
                        ? `Group ${member.group_no}`
                        : member.role}
                    </span>
                  </span>
                </button>
              ))}
          </div>
        </aside>
      </div>
    </MemberLayout>
  );
}

function Composer({
  channelId,
  conversationId,
  userId,
  onError,
  onSent,
}: {
  channelId: string | null;
  conversationId: string | null;
  userId: string;
  onError: (message: string) => void;
  onSent: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = String(new FormData(form).get("body") || "").trim();
    if (!body && !file) return;
    setBusy(true);
    let attachment: string | null = null;
    if (file) {
      if (
        !file.type.match(/^image\/(jpeg|png|webp)$/) ||
        file.size > 8 * 1024 * 1024
      ) {
        setBusy(false);
        return onError("Image must be JPG, PNG or WebP and under 8 MB.");
      }
      attachment = `${userId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const upload = await supabase.storage
        .from("chat-media")
        .upload(attachment, file);
      if (upload.error) {
        setBusy(false);
        return onError(upload.error.message);
      }
    }
    const { error } = await supabase
      .from("messages")
      .insert({
        channel_id: channelId,
        conversation_id: conversationId,
        sender_id: userId,
        kind: file ? "image" : "text",
        body,
        attachment_path: attachment,
      });
    setBusy(false);
    if (error) return onError(error.message);
    form.reset();
    setFile(null);
    onSent();
  }
  return (
    <form onSubmit={submit} className="border-t border-white/[0.08] p-3">
      <div className="flex items-end gap-2 rounded-md bg-white/[0.035] p-2">
        <label className="grid size-9 shrink-0 cursor-pointer place-items-center text-white/35 hover:text-white">
          <ImagePlus className="size-4" />
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
        </label>
        <textarea
          name="body"
          rows={1}
          maxLength={2000}
          placeholder={file ? file.name : "Write a message"}
          className="max-h-28 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-white/20"
        />
        <button
          disabled={busy}
          aria-label="Send message"
          className="grid size-9 shrink-0 place-items-center rounded-md bg-white text-black disabled:opacity-40"
        >
          <Send className="size-4" />
        </button>
      </div>
    </form>
  );
}

function MessageRow({
  message,
  own,
  sender,
  onDelete,
  onReport,
}: {
  message: Message;
  own: boolean;
  sender: string;
  onDelete: () => void;
  onReport: () => void;
}) {
  if (message.deleted_at)
    return (
      <div className="py-3 text-xs italic text-white/18">Message removed</div>
    );
  return (
    <article
      className={`group flex gap-3 py-3 ${own ? "flex-row-reverse text-right" : ""}`}
    >
      <div className="grid size-8 shrink-0 place-items-center rounded-full bg-white/[0.08] text-[8px]">
        {sender.slice(0, 2).toUpperCase()}
      </div>
      <div className="max-w-[82%]">
        <div className={`flex items-center gap-2 ${own ? "justify-end" : ""}`}>
          <p className="text-[10px] font-medium text-white/55">{sender}</p>
          <time className="text-[8px] text-white/18">
            {new Date(message.created_at).toLocaleTimeString("en-ZA", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </div>
        {message.body && (
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-white/75">
            {message.body}
          </p>
        )}
        {message.attachment_path && (
          <Attachment path={message.attachment_path} />
        )}
        {message.shared_trade_snapshot && (
          <TradeShare data={message.shared_trade_snapshot} />
        )}
        <div
          className={`mt-1 flex gap-2 opacity-0 transition group-hover:opacity-100 ${own ? "justify-end" : ""}`}
        >
          {own ? (
            <button
              onClick={onDelete}
              className="text-white/25 hover:text-white"
              aria-label="Delete message"
            >
              <Trash2 className="size-3" />
            </button>
          ) : (
            <button
              onClick={onReport}
              className="text-white/25 hover:text-white"
              aria-label="Report message"
            >
              <Flag className="size-3" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
function Attachment({ path }: { path: string }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    supabase.storage
      .from("chat-media")
      .createSignedUrl(path, 3600)
      .then(({ data }) => setUrl(data?.signedUrl || ""));
  }, [path]);
  return url ? (
    <img
      src={url}
      alt="Chat attachment"
      className="mt-2 max-h-72 max-w-full rounded-md object-cover"
    />
  ) : (
    <div className="mt-2 h-24 w-40 animate-pulse bg-white/5" />
  );
}
function TradeShare({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="mt-2 min-w-64 border border-white/10 bg-white/[0.025] p-4 text-left">
      <div className="flex justify-between">
        <p className="text-xs font-semibold">
          {String(data.symbol || "Trade")} ·{" "}
          {String(data.side || "").toUpperCase()}
        </p>
        <p className="font-mono text-xs">
          {Number(data.netPnl || 0) >= 0 ? "+" : ""}
          {String(data.netPnl || 0)}
        </p>
      </div>
      <p className="mt-2 text-[10px] text-white/35">
        {String(data.setup || "")} ·{" "}
        {data.achievedR == null ? "Not recorded" : `${Number(data.achievedR).toFixed(2)}R`}
      </p>
      {Boolean(data.reason) && (
        <p className="mt-3 text-xs leading-5 text-white/55">
          {String(data.reason)}
        </p>
      )}
      <p className="mt-3 text-[9px] uppercase tracking-wider text-white/25">
        {String(data.emotion || "")} ·{" "}
        {Boolean(data.followedPlan) ? "Plan followed" : "Plan not followed"}
      </p>
    </div>
  );
}
