import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export function useStartConversation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const start = async (otherId: string) => {
    if (!user || loading) return;
    setLoading(true);
    try {
      // Look for an existing conversation in either direction
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .or(
          `and(user_a.eq.${user.id},user_b.eq.${otherId}),and(user_a.eq.${otherId},user_b.eq.${user.id})`
        )
        .maybeSingle();

      let convId = existing?.id;

      if (!convId) {
        const { data: created } = await supabase
          .from("conversations")
          .insert({ user_a: user.id, user_b: otherId })
          .select("id")
          .single();
        convId = created?.id;
      }

      if (convId) {
        navigate({ to: "/messages/$id", params: { id: String(convId) } });
      }
    } finally {
      setLoading(false);
    }
  };

  return { start, loading };
}
