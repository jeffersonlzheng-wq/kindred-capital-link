import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DOC_TYPE_LABELS } from "@/lib/catalyst";

export const Route = createFileRoute("/_authenticated/messages/$id")({
  component: Conversation,
});

function Conversation() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [showDocs, setShowDocs] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const { data: conv } = useQuery({
    queryKey: ["conv", id],
    queryFn: async () => {
      const { data } = await supabase.from("conversations").select("user_a, user_b").eq("id", id).maybeSingle();
      if (!data || !user) return null;
      const otherId = data.user_a === user.id ? data.user_b : data.user_a;
      const { data: p } = await supabase.from("profiles").select("id, full_name, role").eq("id", otherId).maybeSingle();
      return { other: p };
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["messages", id],
    queryFn: async () => {
      const { data } = await supabase.from("messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true });
      return data ?? [];
    },
    refetchInterval: 3000,
  });

  const { data: myDocs } = useQuery({
    queryKey: ["my-docs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("documents").select("*").eq("owner_id", user!.id);
      return data ?? [];
    },
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (content: string, document_id?: string) => {
    if (!user || (!content.trim() && !document_id)) return;
    const { error } = await supabase.from("messages").insert({ conversation_id: id, sender_id: user.id, content, document_id: document_id ?? null });
    if (error) { toast.error(error.message); return; }
    await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", id);
    setText("");
    qc.invalidateQueries({ queryKey: ["messages", id] });
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/messages" className="shrink-0 text-sm font-bold text-muted-foreground md:hidden">←</Link>
          {conv?.other ? (
            <Link to="/profile/$id" params={{ id: conv.other.id }} className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {conv.other.full_name?.slice(0, 1).toUpperCase() || "?"}
              </div>
              <div className="min-w-0">
                <div className="truncate font-semibold">{conv.other.full_name}</div>
                <div className="mono-label">{conv.other.role}</div>
              </div>
            </Link>
          ) : <span>Loading…</span>}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages?.map(m => {
          const mine = m.sender_id === user?.id;
          const doc = m.document_id ? myDocs?.find(d => d.id === m.document_id) : null;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-surface-2 text-foreground"}`}>
                {m.content && <p className="break-words">{m.content}</p>}
                {doc && (
                  <div className="mt-1 text-xs opacity-80">📎 {doc.name} <span className="mono-label">({DOC_TYPE_LABELS[doc.doc_type] || "doc"})</span></div>
                )}
                {m.document_id && !doc && <div className="mt-1 text-xs opacity-80">📎 Document attached</div>}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {showDocs && (
        <div className="border-t border-border bg-surface-2 p-3">
          <div className="mb-2 mono-label">Send a document</div>
          {!myDocs?.length ? (
            <p className="text-xs text-muted-foreground">No documents uploaded. <Link to="/documents" className="text-primary">Upload one</Link>.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {myDocs.map(d => (
                <button key={d.id} onClick={() => { send(`Sent: ${d.name}`, d.id); setShowDocs(false); }} className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold hover:bg-accent">
                  📎 {d.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="flex gap-2 border-t border-border p-3">
        <button type="button" onClick={() => setShowDocs(!showDocs)} className="shrink-0 rounded-md border border-border bg-surface px-3 text-sm font-bold">📎</button>
        <input
          value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="h-10 min-w-0 flex-1 rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
        />
        <button type="submit" className="shrink-0 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground">Send</button>
      </form>
    </div>
  );
}

