import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Trip = Database["public"]["Tables"]["trips"]["Row"];

// Returns the host's first (and for MVP, only) trip; auto-creates a draft if none.
export function useHostTrip() {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) { setLoading(false); return; }
    const { data } = await supabase
      .from("trips")
      .select("*")
      .eq("host_user_id", uid)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (data) setTrip(data);
    else {
      const { data: created } = await supabase.from("trips").insert({
        host_user_id: uid,
        title: "China Trip",
        start_date: "2026-05-30",
        end_date: "2026-06-14",
        timezone: "Asia/Shanghai",
        host_display_name: "Charlotte",
      }).select("*").single();
      if (created) setTrip(created);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);
  return { trip, loading, reload: load, setTrip };
}
