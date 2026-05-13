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

export const Route = createFileRoute("/host/question")({
  component: QuestionPage,
});

function QuestionPage() {
  const { trip } = useHostTrip();
  const [q, setQ] = useState<any>(null);
  const [form, setForm] = useState({
    question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "a",
  });

  useEffect(() => {
    if (!trip) return;
    supabase.from("host_questions").select("*").eq("trip_id", trip.id).eq("active", true).order("created_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setQ(data);
          setForm({
            question_text: data.question_text,
            option_a: data.option_a, option_b: data.option_b, option_c: data.option_c, option_d: data.option_d,
            correct_option: data.correct_option,
          });
        }
      });
  }, [trip?.id]);

  async function save() {
    if (!trip) return;
    if (!form.question_text || !form.option_a || !form.option_b || !form.option_c || !form.option_d) {
      return toast.error("Fill all fields");
    }
    if (q) {
      const { error } = await supabase.from("host_questions").update(form).eq("id", q.id);
      if (error) return toast.error(error.message);
    } else {
      // deactivate any old, insert new
      await supabase.from("host_questions").update({ active: false }).eq("trip_id", trip.id);
      const { data, error } = await supabase.from("host_questions").insert({ ...form, trip_id: trip.id }).select("*").single();
      if (error) return toast.error(error.message);
      setQ(data);
    }
    toast.success("Saved");
  }

  if (!trip) return <div>Loading…</div>;

  return (
    <div className="space-y-8 max-w-2xl">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-clay">Screening</p>
        <h1 className="font-serif text-4xl mt-2">Unlock question</h1>
        <p className="text-muted-foreground mt-2">Friends answer this before they see your calendar.</p>
      </header>

      <Card className="p-5 space-y-4">
        <div>
          <Label>Question</Label>
          <Input value={form.question_text} onChange={(e) => setForm({ ...form, question_text: e.target.value })} placeholder="What city did I grow up in?" />
        </div>
        {(["a", "b", "c", "d"] as const).map(k => (
          <div key={k}>
            <Label>Option {k.toUpperCase()}</Label>
            <Input value={(form as any)["option_" + k]} onChange={(e) => setForm({ ...form, ["option_" + k]: e.target.value } as any)} />
          </div>
        ))}
        <div>
          <Label>Correct answer</Label>
          <Select value={form.correct_option} onValueChange={(v) => setForm({ ...form, correct_option: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["a", "b", "c", "d"] as const).map(k => <SelectItem key={k} value={k}>{k.toUpperCase()}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={save}>Save question</Button>
      </Card>
    </div>
  );
}
