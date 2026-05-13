import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { fmtDate, fmtRange, fmtTime, CONTACT_TYPES } from "@/lib/format";
import {
  getGuestProfile, setGuestProfile, isTripUnlocked, setTripUnlocked, type GuestProfile,
} from "@/lib/guest";
import { MapPin, Lock, Sparkles } from "lucide-react";

export const Route = createFileRoute("/t/$slug")({
  component: PublicTrip,
});

type Stage = "intro" | "guest_info" | "question" | "unlocked";

function PublicTrip() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<any>(null);
  const [question, setQuestion] = useState<any>(null);
  const [stage, setStage] = useState<Stage>("intro");
  const [profile, setProfile] = useState<GuestProfile | null>(null);

  useEffect(() => {
    (async () => {
      const { data: t } = await supabase.from("trips").select("*").eq("public_slug", slug).maybeSingle();
      if (!t) return;
      setTrip(t);
      const { data: q } = await supabase.from("host_questions").select("*").eq("trip_id", t.id).eq("active", true).maybeSingle();
      setQuestion(q);
      const p = getGuestProfile();
      if (p) setProfile(p);
      if (p && isTripUnlocked(slug)) setStage("unlocked");
    })();
  }, [slug]);

  if (!trip) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen">
      <header className="px-6 py-5 flex justify-between items-center border-b border-border/50">
        <Link to="/" className="font-serif text-lg">{trip.host_display_name} · China</Link>
        <span className="text-xs text-muted-foreground">{fmtRange(trip.start_date, trip.end_date)}</span>
      </header>

      <main className="px-5 py-10 md:py-14 max-w-3xl mx-auto">
        {stage === "intro" && <Intro trip={trip} onContinue={() => setStage(profile ? "question" : "guest_info")} hasProfile={!!profile} />}
        {stage === "guest_info" && <GuestInfo onSaved={(p) => { setProfile(p); setStage("question"); }} />}
        {stage === "question" && question && profile && (
          <QuestionStage question={question} profile={profile}
            onCorrect={() => { setTripUnlocked(slug); setStage("unlocked"); }} />
        )}
        {stage === "question" && !question && <p className="text-muted-foreground">No screening question is set yet — message {trip.host_display_name} directly.</p>}
        {stage === "unlocked" && <Unlocked trip={trip} profile={profile!} navigate={navigate} slug={slug} />}
      </main>
    </div>
  );
}

function Intro({ trip, onContinue, hasProfile }: { trip: any; onContinue: () => void; hasProfile: boolean }) {
  return (
    <div className="text-center max-w-xl mx-auto">
      <p className="text-xs uppercase tracking-[0.25em] text-clay mb-6">{fmtRange(trip.start_date, trip.end_date)}</p>
      <h1 className="font-serif text-5xl md:text-6xl leading-tight mb-6">
        Hey, I'll be in <em className="text-clay not-italic">China</em>.
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        {trip.intro_text || `Answer one question to unlock my calendar :)`}
      </p>
      <Button size="lg" onClick={onContinue}>
        <Lock className="w-4 h-4 mr-2" /> {hasProfile ? "Continue" : "Get started"}
      </Button>
    </div>
  );
}

function GuestInfo({ onSaved }: { onSaved: (p: GuestProfile) => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("wechat");
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.from("guests").insert({
      name, contact_type: type as any, contact_value: value,
    }).select("*").single();
    setLoading(false);
    if (error) return toast.error(error.message);
    const p = { id: data.id, name: data.name, contact_type: data.contact_type, contact_value: data.contact_value };
    setGuestProfile(p);
    onSaved(p);
  }

  return (
    <form onSubmit={submit} className="max-w-md mx-auto space-y-4">
      <div className="text-center mb-6">
        <h1 className="font-serif text-3xl">First, who are you?</h1>
        <p className="text-sm text-muted-foreground mt-2">So I know who's booking.</p>
      </div>
      <div><Label>Your name</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1">
          <Label>Contact</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CONTACT_TYPES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="col-span-2"><Label>Handle / number</Label><Input required value={value} onChange={(e) => setValue(e.target.value)} /></div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>Continue</Button>
    </form>
  );
}

function QuestionStage({ question, profile, onCorrect }: { question: any; profile: GuestProfile; onCorrect: () => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [wrong, setWrong] = useState(false);

  async function submit() {
    if (!picked) return;
    const correct = picked === question.correct_option;
    await supabase.from("guest_question_attempts").insert({
      guest_id: profile.id, host_question_id: question.id,
      selected_option: picked, is_correct: correct,
    });
    if (correct) onCorrect();
    else { setWrong(true); }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <p className="text-xs uppercase tracking-[0.25em] text-clay mb-3">One question</p>
        <h1 className="font-serif text-3xl md:text-4xl">{question.question_text}</h1>
      </div>
      <div className="space-y-2">
        {(["a", "b", "c", "d"] as const).map(k => (
          <button key={k} onClick={() => { setPicked(k); setWrong(false); }}
            className={`w-full p-4 rounded-md border text-left transition ${picked === k ? "border-clay bg-accent/40" : "border-border bg-card hover:bg-accent/20"}`}>
            <span className="text-clay font-mono mr-3">{k.toUpperCase()}</span>
            {(question as any)["option_" + k]}
          </button>
        ))}
      </div>
      {wrong && <p className="text-center text-destructive mt-4 text-sm">Not quite. Try again, or message {profile.name ? "me" : "me"} directly if this is unfair.</p>}
      <Button onClick={submit} disabled={!picked} className="w-full mt-6" size="lg">Submit</Button>
    </div>
  );
}

function Unlocked({ trip, profile, navigate, slug }: { trip: any; profile: GuestProfile; navigate: any; slug: string }) {
  const [locs, setLocs] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    (async () => {
      const [{ data: l }, { data: s }, { data: ev }] = await Promise.all([
        supabase.from("trip_locations").select("*").eq("trip_id", trip.id).eq("visibility", "public").order("start_date"),
        supabase.from("availability_slots").select("*").eq("trip_id", trip.id).eq("status", "available").order("start_time"),
        supabase.from("events").select("*").eq("trip_id", trip.id).eq("status", "confirmed").order("start_time"),
      ]);
      setLocs(l ?? []); setSlots(s ?? []); setEvents(ev ?? []);
      const evIds = (ev ?? []).map(e => e.id);
      if (evIds.length) {
        const { data: pp } = await supabase.from("event_participants").select("*, guests(name)").in("event_id", evIds);
        setParticipants(pp ?? []);
      }
    })();
  }, [trip.id]);

  const cities = Array.from(new Set(locs.map(l => l.city)));
  const visibleSlots = slots.filter(s =>
    (filterCity === "all" || s.city === filterCity) &&
    (filterType === "all" || s.meeting_type === filterType)
  );

  return (
    <div className="space-y-10">
      <div className="text-center">
        <Sparkles className="w-6 h-6 mx-auto text-clay mb-3" />
        <p className="text-clay text-sm">Correct — you've unlocked the calendar.</p>
        <p className="text-xs text-muted-foreground mt-1">Welcome, {profile.name}.</p>
      </div>

      <section>
        <h2 className="font-serif text-3xl mb-5">Where I'll be</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {locs.map(l => (
            <Card key={l.id} className="p-4">
              <p className="font-medium flex items-center gap-1.5"><MapPin className="w-4 h-4 text-clay" /> {l.city}</p>
              <p className="text-sm text-muted-foreground">{fmtRange(l.start_date, l.end_date)}</p>
              {l.area && <p className="text-xs text-muted-foreground mt-1">{l.area}</p>}
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <h2 className="font-serif text-3xl">Open slots</h2>
          <div className="flex gap-2">
            <Select value={filterCity} onValueChange={setFilterCity}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cities</SelectItem>
                {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {["coffee","meal","walk","drinks","activity","flexible"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {cities.map(city => {
          const cs = visibleSlots.filter(s => s.city === city);
          if (!cs.length) return null;
          const loc = locs.find(l => l.city === city);
          return (
            <div key={city} className="mb-8">
              <p className="text-xs uppercase tracking-[0.2em] text-clay mb-3">{city}{loc && ` · ${fmtRange(loc.start_date, loc.end_date)}`}</p>
              <ul className="space-y-2">
                {cs.map(s => (
                  <li key={s.id}>
                    <button
                      onClick={() => navigate({ to: "/t/$slug/book/$slotId", params: { slug, slotId: s.id } })}
                      className="w-full p-4 rounded-md bg-card border border-border hover:bg-accent/30 text-left transition flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">{fmtDate(s.start_time)} · {fmtTime(s.start_time)} – {fmtTime(s.end_time)}</p>
                        <p className="text-xs text-muted-foreground">{s.meeting_type}{s.area ? ` · ${s.area}` : ""}{s.location_note ? ` · ${s.location_note}` : ""}</p>
                      </div>
                      <span className="text-clay text-sm">Book →</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        {visibleSlots.length === 0 && <p className="text-sm text-muted-foreground">No matching slots.</p>}
      </section>

      <section>
        <h2 className="font-serif text-3xl mb-5">Existing sessions</h2>
        {events.length === 0 ? <p className="text-sm text-muted-foreground">Nothing booked yet — be the first.</p> : (
          <ul className="space-y-2">
            {events.filter(e => e.visibility !== "private").map(e => {
              const pp = participants.filter(p => p.event_id === e.id);
              const detailed = e.visibility === "show_details";
              const showPeople = e.visibility === "show_details" || e.visibility === "show_people";
              const isMine = e.created_by_guest_id === profile.id;
              const canRequest = e.join_policy === "request_to_join" && !isMine;
              return (
                <li key={e.id} className="p-4 rounded-md bg-card border border-border">
                  <div className="flex justify-between items-start gap-3 flex-wrap">
                    <div>
                      <p className="font-medium">{detailed ? e.title : "Booked time"}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmtDate(e.start_time)} · {fmtTime(e.start_time)}–{fmtTime(e.end_time)} · {e.city}{detailed && e.area ? ` · ${e.area}` : ""}
                      </p>
                      {showPeople && pp.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">with {pp.map(p => p.guests?.name).filter(Boolean).join(", ")}</p>
                      )}
                    </div>
                    {canRequest && (
                      <Button size="sm" variant="outline"
                        onClick={() => navigate({ to: "/t/$slug/event/$eventId/join", params: { slug, eventId: e.id } })}>
                        Request to join
                      </Button>
                    )}
                    {isMine && <span className="text-xs text-clay">your booking</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
