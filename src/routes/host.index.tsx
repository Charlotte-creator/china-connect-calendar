import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHostTrip } from "@/lib/use-host-trip";
import { fmtDateTime, fmtRange } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Copy, MapPin, Calendar, Users, ListChecks } from "lucide-react";

export const Route = createFileRoute("/host/")({
  component: Dashboard,
});

function Dashboard() {
  const { trip, loading } = useHostTrip();
  const [events, setEvents] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [todos, setTodos] = useState<any[]>([]);

  useEffect(() => {
    if (!trip) return;
    (async () => {
      const [{ data: ev }, { data: locs }, { data: td }] = await Promise.all([
        supabase.from("events").select("*").eq("trip_id", trip.id).order("start_time"),
        supabase.from("trip_locations").select("*").eq("trip_id", trip.id).order("start_date"),
        supabase.from("todos").select("*").eq("trip_id", trip.id).order("due_date", { nullsFirst: false }),
      ]);
      setEvents(ev ?? []);
      setLocations(locs ?? []);
      setTodos(td ?? []);
      const eventIds = (ev ?? []).map((e) => e.id);
      if (eventIds.length) {
        const { data: jr } = await supabase.from("join_requests").select("*, guests(name), events(title, start_time, city)").in("event_id", eventIds).eq("status", "pending");
        setPending(jr ?? []);
      } else setPending([]);
    })();
  }, [trip?.id]);

  if (loading || !trip) return <div className="text-muted-foreground">Loading…</div>;

  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/t/${trip.public_slug}` : "";
  const grouped = locations.map((loc) => ({
    loc,
    events: events.filter((e) => e.city === loc.city),
  }));

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-clay">Dashboard</p>
        <h1 className="font-serif text-4xl mt-2">{trip.title}</h1>
        <p className="text-muted-foreground mt-1">{fmtRange(trip.start_date, trip.end_date)} · {trip.timezone}</p>
      </header>

      <Card className="p-5 bg-accent/40 border-sage">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Public booking link</p>
            <p className="font-mono text-sm break-all">{publicUrl}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success("Copied"); }}>
            <Copy className="w-4 h-4 mr-1" /> Copy
          </Button>
        </div>
      </Card>

      <section>
        <h2 className="font-serif text-2xl mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-clay" /> Upcoming</h2>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No bookings yet. <Link to="/host/availability" className="underline">Add availability</Link> so friends can book.</p>
        ) : (
          <div className="space-y-6">
            {grouped.filter(g => g.events.length).map(({ loc, events }) => (
              <div key={loc.id}>
                <p className="text-sm font-medium mb-2 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {loc.city} <span className="text-muted-foreground font-normal">· {fmtRange(loc.start_date, loc.end_date)}</span></p>
                <ul className="space-y-2">
                  {events.map(e => (
                    <li key={e.id} className="p-3 rounded-md bg-card border border-border flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium">{e.title}</p>
                        <p className="text-muted-foreground text-xs">{fmtDateTime(e.start_time)} · {e.area || e.city}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-serif text-2xl mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-clay" /> Pending join requests</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending requests.</p>
        ) : (
          <div className="space-y-2">
            {pending.map((r) => (
              <Link key={r.id} to="/host/requests" className="block p-3 rounded-md bg-card border border-border text-sm hover:bg-accent/30">
                <span className="font-medium">{r.guests?.name}</span> wants to join <span className="font-medium">{r.events?.title}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-serif text-2xl mb-4 flex items-center gap-2"><ListChecks className="w-5 h-5 text-clay" /> Open to-dos</h2>
        {todos.filter(t => t.status === "open").length === 0 ? (
          <p className="text-sm text-muted-foreground">All clear. <Link to="/host/todos" className="underline">Add one</Link>.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {todos.filter(t => t.status === "open").slice(0, 5).map(t => (
              <li key={t.id} className="p-2.5 rounded-md bg-card border border-border">{t.title}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
