import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHostTrip } from "@/lib/use-host-trip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { fmtRange } from "@/lib/format";

export const Route = createFileRoute("/host/trip")({
  component: TripPage,
});

function TripPage() {
  const { trip, reload } = useHostTrip();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [tz, setTz] = useState("");
  const [name, setName] = useState("");
  const [intro, setIntro] = useState("");

  const [locs, setLocs] = useState<any[]>([]);
  const [newLoc, setNewLoc] = useState({ city: "", area: "", start_date: "", end_date: "", notes: "" });

  useEffect(() => {
    if (!trip) return;
    setTitle(trip.title); setStart(trip.start_date); setEnd(trip.end_date);
    setTz(trip.timezone); setName(trip.host_display_name); setIntro(trip.intro_text ?? "");
    supabase.from("trip_locations").select("*").eq("trip_id", trip.id).order("start_date").then(({ data }) => setLocs(data ?? []));
  }, [trip?.id]);

  async function saveTrip() {
    if (!trip) return;
    setSaving(true);
    const { error } = await supabase.from("trips").update({
      title, start_date: start, end_date: end, timezone: tz, host_display_name: name, intro_text: intro,
    }).eq("id", trip.id);
    setSaving(false);
    if (error) toast.error(error.message); else { toast.success("Saved"); reload(); }
  }

  async function addLoc() {
    if (!trip || !newLoc.city || !newLoc.start_date || !newLoc.end_date) return;
    const { error } = await supabase.from("trip_locations").insert({ ...newLoc, trip_id: trip.id });
    if (error) return toast.error(error.message);
    setNewLoc({ city: "", area: "", start_date: "", end_date: "", notes: "" });
    const { data } = await supabase.from("trip_locations").select("*").eq("trip_id", trip.id).order("start_date");
    setLocs(data ?? []);
  }

  async function removeLoc(id: string) {
    await supabase.from("trip_locations").delete().eq("id", id);
    setLocs(locs.filter(l => l.id !== id));
  }

  if (!trip) return <div>Loading…</div>;

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-clay">Trip</p>
        <h1 className="font-serif text-4xl mt-2">Details & cities</h1>
      </header>

      <Card className="p-5 space-y-4">
        <h2 className="font-serif text-xl">Trip basics</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div><Label>Display name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Start date</Label><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
          <div><Label>End date</Label><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
          <div><Label>Timezone</Label><Input value={tz} onChange={(e) => setTz(e.target.value)} /></div>
        </div>
        <div><Label>Public intro</Label><Textarea rows={2} value={intro} onChange={(e) => setIntro(e.target.value)} placeholder="Hey, I'll be in China…" /></div>
        <Button onClick={saveTrip} disabled={saving}>Save</Button>
      </Card>

      <section>
        <h2 className="font-serif text-2xl mb-4">City itinerary</h2>
        <div className="space-y-2 mb-6">
          {locs.map(l => (
            <Card key={l.id} className="p-4 flex justify-between items-start">
              <div>
                <p className="font-medium">{l.city} {l.area && <span className="text-muted-foreground font-normal">· {l.area}</span>}</p>
                <p className="text-sm text-muted-foreground">{fmtRange(l.start_date, l.end_date)}</p>
                {l.notes && <p className="text-sm mt-1">{l.notes}</p>}
              </div>
              <button onClick={() => removeLoc(l.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </Card>
          ))}
          {locs.length === 0 && <p className="text-sm text-muted-foreground">No cities added yet.</p>}
        </div>
        <Card className="p-5 space-y-3 bg-accent/30">
          <h3 className="font-medium text-sm">Add city</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <Input placeholder="City (e.g. Shanghai)" value={newLoc.city} onChange={(e) => setNewLoc({ ...newLoc, city: e.target.value })} />
            <Input placeholder="Area / neighborhood (optional)" value={newLoc.area} onChange={(e) => setNewLoc({ ...newLoc, area: e.target.value })} />
            <Input type="date" value={newLoc.start_date} onChange={(e) => setNewLoc({ ...newLoc, start_date: e.target.value })} />
            <Input type="date" value={newLoc.end_date} onChange={(e) => setNewLoc({ ...newLoc, end_date: e.target.value })} />
          </div>
          <Textarea rows={2} placeholder="Notes (optional)" value={newLoc.notes} onChange={(e) => setNewLoc({ ...newLoc, notes: e.target.value })} />
          <Button onClick={addLoc}>Add city</Button>
        </Card>
      </section>
    </div>
  );
}
