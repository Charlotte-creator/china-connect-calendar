import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHostTrip } from "@/lib/use-host-trip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { fmtDateTime, MEETING_TYPES } from "@/lib/format";

export const Route = createFileRoute("/host/availability")({
  component: AvailabilityPage,
});

function AvailabilityPage() {
  const { trip } = useHostTrip();
  const [locs, setLocs] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [form, setForm] = useState({
    city: "", area: "", date: "", start: "", end: "",
    meeting_type: "flexible", location_note: "",
  });

  async function reload() {
    if (!trip) return;
    const [{ data: l }, { data: s }] = await Promise.all([
      supabase.from("trip_locations").select("*").eq("trip_id", trip.id),
      supabase.from("availability_slots").select("*").eq("trip_id", trip.id).order("start_time"),
    ]);
    setLocs(l ?? []); setSlots(s ?? []);
    if (l?.[0] && !form.city) setForm(f => ({ ...f, city: l[0].city }));
  }
  useEffect(() => { reload(); }, [trip?.id]);

  async function add() {
    if (!trip || !form.city || !form.date || !form.start || !form.end) {
      return toast.error("Fill city, date, start and end");
    }
    const startISO = new Date(`${form.date}T${form.start}:00`).toISOString();
    const endISO = new Date(`${form.date}T${form.end}:00`).toISOString();
    const { error } = await supabase.from("availability_slots").insert({
      trip_id: trip.id,
      city: form.city, area: form.area || null,
      meeting_type: form.meeting_type as any,
      location_note: form.location_note || null,
      start_time: startISO, end_time: endISO,
    });
    if (error) return toast.error(error.message);
    toast.success("Slot added");
    setForm({ ...form, date: "", start: "", end: "", location_note: "" });
    reload();
  }

  async function remove(id: string) {
    await supabase.from("availability_slots").delete().eq("id", id);
    setSlots(slots.filter(s => s.id !== id));
  }

  if (!trip) return <div>Loading…</div>;

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-clay">Availability</p>
        <h1 className="font-serif text-4xl mt-2">When friends can book</h1>
      </header>

      <Card className="p-5 space-y-3 bg-accent/30">
        <h3 className="font-medium">New slot</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>City</Label>
            <Select value={form.city} onValueChange={(v) => setForm({ ...form, city: v })}>
              <SelectTrigger><SelectValue placeholder="Choose city" /></SelectTrigger>
              <SelectContent>
                {locs.map(l => <SelectItem key={l.id} value={l.city}>{l.city}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Area (optional)</Label><Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} /></div>
          <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Start</Label><Input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></div>
            <div><Label>End</Label><Input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></div>
          </div>
          <div>
            <Label>Meeting type</Label>
            <Select value={form.meeting_type} onValueChange={(v) => setForm({ ...form, meeting_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MEETING_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Location note</Label><Input value={form.location_note} onChange={(e) => setForm({ ...form, location_note: e.target.value })} placeholder="e.g. café in Jing'an" /></div>
        </div>
        <Button onClick={add}>Add slot</Button>
        {locs.length === 0 && <p className="text-xs text-muted-foreground">Add cities in Trip first.</p>}
      </Card>

      <section>
        <h2 className="font-serif text-2xl mb-4">Slots</h2>
        {slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">None yet.</p>
        ) : (
          <ul className="space-y-2">
            {slots.map(s => (
              <li key={s.id} className="p-3 rounded-md bg-card border border-border flex justify-between items-center text-sm">
                <div>
                  <p className="font-medium">{s.city} {s.area && <span className="text-muted-foreground font-normal">· {s.area}</span>}</p>
                  <p className="text-muted-foreground text-xs">{fmtDateTime(s.start_time)} – {new Date(s.end_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · {s.meeting_type} · {s.status}</p>
                </div>
                <button onClick={() => remove(s.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
