import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

const LS_KEY = (id: string) => `catalyst_last_read_${id}`;

/** Mark a conversation as read right now. Call when the user opens it. */
export function markConversationRead(conversationId: string) {
  localStorage.setItem(LS_KEY(conversationId), new Date().toISOString());
}

/** Returns the total count of unread messages across all conversations.
 *  Updates in real-time via Supabase postgres_changes. */
export function useUnreadCount(): number {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) { setCount(0); return; }

    // 1. Get all conversations this user is in
    const { data: convs } = await supabase
      .from("conversations")
      .select("id")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

    if (!convs?.length) { setCount(0); return; }
    const convIds = convs.map((c) => c.id);

    // 2. Find the oldest "last read" timestamp so we can bound the query
    const epoch = new Date(0).toISOString();
    const minLastRead = convIds.reduce((min, id) => {
      const stored = localStorage.getItem(LS_KEY(id)) ?? epoch;
      return stored < min ? stored : min;
    }, new Date().toISOString());

    // 3. Fetch messages from others newer than that floor
    const { data: msgs } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_id, created_at")
      .in("conversation_id", convIds)
      .neq("sender_id", user.id)
      .gt("created_at", minLastRead);

    if (!msgs) { setCount(0); return; }

    // 4. Per-conversation filter against the actual stored timestamp
    const unread = msgs.filter((m) => {
      const lastRead = localStorage.getItem(LS_KEY(m.conversation_id)) ?? epoch;
      return m.created_at > lastRead;
    });

    setCount(unread.length);
  }, [user]);

  useEffect(() => {
    refresh();
    if (!user) return;

    // Real-time: re-count on any new message insert
    const channel = supabase
      .channel("unread-badge")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          // Only react to messages sent by someone else
          if (payload.new?.sender_id !== user.id) refresh();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, refresh]);

  return count;
}
