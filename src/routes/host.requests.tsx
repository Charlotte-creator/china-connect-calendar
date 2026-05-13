import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHostTrip } from "@/lib/use-host-trip";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { fmtDateTime } from "@/lib/format";

export const Route = createFileRoute("/host/requests")({
  component: RequestsPage,
});

function RequestsPage() {
  const { trip } = useHostTrip();
  const [requests, setRequests] = useState<any[]>([]);

  async function load() {
    if (!trip) return;
    const { data: events } = await supabase.from("events").select("id").eq("trip_id", trip.id);
    const ids = (events ?? []).map(e => e.id);
    if (!ids.length) return setRequests([]);
    const { data } = await supabase
      .from("join_requests")
      .select("*, guests(name, contact_type, contact_value), events(title, city, area, start_time, end_time)")
      .in("event_id", ids)
      .order("created_at", { ascending: false });
    setRequests(data ?? []);
  }
  useEffect(() => { load(); }, [trip?.id]);

  async function decide(id: string, status: "approved" | "rejected", req: any) {
    const { error } = await supabase.from("join_requests").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    if (status === "approved") {
      await supabase.from("event_participants").insert({
        event_id: req.event_id, guest_id: req.requesting_guest_id, role: "participant", status: "confirmed",
      });
    }
    toast.success(status === "approved" ? "Approved" : "Rejected");
    load();
  }

  if (!trip) return <div>Loading…</div>;
  const pending = requests.filter(r => r.status === "pending");
  const decided = requests.filter(r => r.status !== "pending");

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-clay">Approval</p>
        <h1 className="font-serif text-4xl mt-2">Join requests</h1>
      </header>

      <section>
        <h2 className="font-serif text-xl mb-3">Pending</h2>
        {pending.length === 0 ? <p className="text-sm text-muted-foreground">None.</p> : (
          <div className="space-y-3">
            {pending.map(r => (
              <Card key={r.id} className="p-4">
                <div className="flex justify-between items-start gap-4 flex-wrap">
                  <div>
                    <p className="font-medium">{r.guests?.name} <span className="text-muted-foreground font-normal text-sm">({r.guests?.contact_type}: {r.guests?.contact_value})</span></p>
                    <p className="text-sm">wants to join <span className="font-medium">{r.events?.title}</span></p>
                    <p className="text-xs text-muted-foreground mt-0.5">{fmtDateTime(r.events?.start_time)} · {r.events?.city}{r.events?.area ? ` · ${r.events.area}` : ""}</p>
                    <p className="text-xs mt-2">Question answer: <span className={r.is_correct ? "text-clay font-medium" : "text-destructive"}>{r.is_correct ? "✓ correct" : "✗ wrong"}</span></p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => decide(r.id, "approved", r)}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => decide(r.id, "rejected", r)}>Reject</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {decided.length > 0 && (
        <section>
          <h2 className="font-serif text-xl mb-3">History</h2>
          <ul className="space-y-1.5 text-sm">
            {decided.map(r => (
              <li key={r.id} className="p-2.5 rounded-md bg-card border border-border flex justify-between">
                <span>{r.guests?.name} → {r.events?.title}</span>
                <span className="text-muted-foreground">{r.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
