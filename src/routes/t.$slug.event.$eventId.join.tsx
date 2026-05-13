import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { fmtDate, fmtTime } from "@/lib/format";
import { getGuestProfile } from "@/lib/guest";

export const Route = createFileRoute("/t/$slug/event/$eventId/join")({
  component: JoinPage,
});

function JoinPage() {
  const { slug, eventId } = Route.useParams();
  const navigate = useNavigate();
  const profile = getGuestProfile();
  const [event, setEvent] = useState<any>(null);
  const [question, setQuestion] = useState<any>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profile) { navigate({ to: "/t/$slug", params: { slug } }); return; }
    (async () => {
      const { data: ev } = await supabase.from("events").select("*").eq("id", eventId).maybeSingle();
      setEvent(ev);
      const { data: q } = await supabase.from("event_join_questions").select("*").eq("event_id", eventId).maybeSingle();
      setQuestion(q);
    })();
  }, [eventId]);

  async function submit() {
    if (!profile || !question || !picked) return;
    setSubmitting(true);
    const correct = picked === question.correct_option;
    const { error } = await supabase.from("join_requests").insert({
      event_id: eventId, requesting_guest_id: profile.id, question_id: question.id,
      selected_option: picked, is_correct: correct, status: "pending",
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success(correct ? "Sent! Charlotte will approve soon." : "Sent — but your answer was off; she'll decide.");
    navigate({ to: "/t/$slug", params: { slug } });
  }

  if (!event || !profile) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (!question) return <div className="min-h-screen px-5 py-10 max-w-xl mx-auto"><p>This session has no join question.</p></div>;

  return (
    <div className="min-h-screen px-5 py-10 max-w-xl mx-auto">
      <Link to="/t/$slug" params={{ slug }} className="text-sm text-muted-foreground">← back</Link>
      <h1 className="font-serif text-3xl mt-4">{event.title}</h1>
      <p className="text-muted-foreground text-sm mb-8">
        {fmtDate(event.start_time)} · {fmtTime(event.start_time)} · {event.city}{event.area && ` · ${event.area}`}
      </p>

      <Card className="p-5 space-y-4">
        <p className="font-serif text-xl">{question.question_text}</p>
        <div className="space-y-2">
          {(["a", "b", "c", "d"] as const).map(k => (
            <button key={k} onClick={() => setPicked(k)}
              className={`w-full p-3 rounded-md border text-left transition ${picked === k ? "border-clay bg-accent/40" : "border-border bg-card hover:bg-accent/20"}`}>
              <span className="text-clay font-mono mr-3">{k.toUpperCase()}</span>
              {(question as any)["option_" + k]}
            </button>
          ))}
        </div>
        <Button onClick={submit} disabled={!picked || submitting} className="w-full">Send request</Button>
      </Card>
    </div>
  );
}
