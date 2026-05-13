import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { fmtDate, fmtTime, VISIBILITY_OPTS } from "@/lib/format";
import { getGuestProfile } from "@/lib/guest";

export const Route = createFileRoute("/t/$slug/book/$slotId")({
  component: BookPage,
});

function BookPage() {
  const { slug, slotId } = Route.useParams();
  const navigate = useNavigate();
  const [slot, setSlot] = useState<any>(null);
  const [trip, setTrip] = useState<any>(null);
  const [profile] = useState(() => getGuestProfile());

  const [form, setForm] = useState({
    title: "", description: "", exact_location: "",
    visibility: "show_people", join_policy: "not_joinable" as "not_joinable" | "request_to_join",
  });
  const [joinQ, setJoinQ] = useState({
    question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "a",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profile) { navigate({ to: "/t/$slug", params: { slug } }); return; }
    (async () => {
      const { data: t } = await supabase.from("trips").select("*").eq("public_slug", slug).maybeSingle();
      setTrip(t);
      const { data: s } = await supabase.from("availability_slots").select("*").eq("id", slotId).maybeSingle();
      setSlot(s);
    })();
  }, [slug, slotId]);

  async function submit() {
    if (!profile || !slot || !trip) return;
    if (!form.title) return toast.error("Add an event title");
    if (form.join_policy === "request_to_join") {
      if (!joinQ.question_text || !joinQ.option_a || !joinQ.option_b || !joinQ.option_c || !joinQ.option_d) {
        return toast.error("Fill in the join question");
      }
    }
    setSubmitting(true);
    const { data: ev, error } = await supabase.from("events").insert({
      trip_id: trip.id, slot_id: slot.id,
      title: form.title, description: form.description || null,
      city: slot.city, area: slot.area, exact_location: form.exact_location || null,
      location_status: form.exact_location ? "suggested" : "tbd",
      start_time: slot.start_time, end_time: slot.end_time,
      visibility: form.visibility as any, join_policy: form.join_policy,
      created_by_guest_id: profile.id,
    }).select("*").single();
    if (error || !ev) { setSubmitting(false); return toast.error(error?.message ?? "Failed"); }

    await supabase.from("event_participants").insert([
      { event_id: ev.id, guest_id: profile.id, role: "creator", status: "confirmed" },
    ]);

    await supabase.from("availability_slots").update({ status: "booked" }).eq("id", slot.id);

    if (form.join_policy === "request_to_join") {
      await supabase.from("event_join_questions").insert({
        event_id: ev.id, created_by_guest_id: profile.id, ...joinQ,
      });
    }

    // Schedule reminders (24h and 2h before)
    if (profile.contact_type === "email") {
      const start = new Date(slot.start_time).getTime();
      const reminders = [
        { send_at: new Date(start - 24 * 3600 * 1000).toISOString(), kind: "24h" },
        { send_at: new Date(start - 2 * 3600 * 1000).toISOString(), kind: "2h" },
      ].filter(r => new Date(r.send_at).getTime() > Date.now());
      if (reminders.length) {
        await supabase.from("reminders").insert(reminders.map(r => ({
          event_id: ev.id, recipient_email: profile.contact_value, send_at: r.send_at, kind: r.kind,
        })));
      }
    }

    setSubmitting(false);
    toast.success("Booked!");
    navigate({ to: "/t/$slug", params: { slug } });
  }

  if (!slot || !trip || !profile) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen px-5 py-10 max-w-2xl mx-auto">
      <Link to="/t/$slug" params={{ slug }} className="text-sm text-muted-foreground">← back</Link>
      <h1 className="font-serif text-4xl mt-4 mb-2">Book this slot</h1>
      <p className="text-muted-foreground mb-8">
        {fmtDate(slot.start_time)} · {fmtTime(slot.start_time)}–{fmtTime(slot.end_time)} · {slot.city}{slot.area && ` · ${slot.area}`}
      </p>

      <Card className="p-5 space-y-4">
        <div><Label>Event title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Coffee with Charlotte" /></div>
        <div><Label>Notes (optional)</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div><Label>Suggested location (optional)</Label><Input value={form.exact_location} onChange={(e) => setForm({ ...form, exact_location: e.target.value })} placeholder="e.g. Café Liushui, Jing'an" /></div>

        <div>
          <Label>Visibility</Label>
          <Select value={form.visibility} onValueChange={(v) => setForm({ ...form, visibility: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{VISIBILITY_OPTS.map(o => <SelectItem key={o.v} value={o.v}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between p-3 rounded-md bg-accent/30">
          <div>
            <Label className="cursor-pointer">Allow others to request to join</Label>
            <p className="text-xs text-muted-foreground">They'll need to answer your question first.</p>
          </div>
          <Switch checked={form.join_policy === "request_to_join"}
            onCheckedChange={(c) => setForm({ ...form, join_policy: c ? "request_to_join" : "not_joinable" })} />
        </div>

        {form.join_policy === "request_to_join" && (
          <div className="space-y-3 p-4 rounded-md border border-border bg-muted/30">
            <h3 className="font-medium text-sm">Your join question</h3>
            <Input placeholder="Question" value={joinQ.question_text} onChange={(e) => setJoinQ({ ...joinQ, question_text: e.target.value })} />
            {(["a", "b", "c", "d"] as const).map(k => (
              <Input key={k} placeholder={`Option ${k.toUpperCase()}`} value={(joinQ as any)["option_" + k]}
                onChange={(e) => setJoinQ({ ...joinQ, ["option_" + k]: e.target.value } as any)} />
            ))}
            <div>
              <Label>Correct answer</Label>
              <Select value={joinQ.correct_option} onValueChange={(v) => setJoinQ({ ...joinQ, correct_option: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(["a","b","c","d"] as const).map(k => <SelectItem key={k} value={k}>{k.toUpperCase()}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        )}

        <Button onClick={submit} disabled={submitting} size="lg" className="w-full">{submitting ? "Booking…" : "Confirm booking"}</Button>
      </Card>
    </div>
  );
}
