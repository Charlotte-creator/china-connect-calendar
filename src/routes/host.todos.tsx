import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHostTrip } from "@/lib/use-host-trip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/host/todos")({
  component: TodosPage,
});

function TodosPage() {
  const { trip } = useHostTrip();
  const [todos, setTodos] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");

  async function load() {
    if (!trip) return;
    const { data } = await supabase.from("todos").select("*").eq("trip_id", trip.id).order("created_at");
    setTodos(data ?? []);
  }
  useEffect(() => { load(); }, [trip?.id]);

  async function add() {
    if (!trip || !title) return;
    const { error } = await supabase.from("todos").insert({ trip_id: trip.id, title, due_date: due || null });
    if (error) return toast.error(error.message);
    setTitle(""); setDue(""); load();
  }
  async function toggle(t: any) {
    await supabase.from("todos").update({ status: t.status === "open" ? "done" : "open" }).eq("id", t.id);
    load();
  }
  async function remove(id: string) {
    await supabase.from("todos").delete().eq("id", id); load();
  }

  if (!trip) return <div>Loading…</div>;

  return (
    <div className="space-y-8 max-w-2xl">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-clay">To-do</p>
        <h1 className="font-serif text-4xl mt-2">Trip list</h1>
      </header>

      <Card className="p-4 flex gap-2 items-end bg-accent/30">
        <div className="flex-1"><Input placeholder="What needs doing?" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} /></div>
        <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="w-40" />
        <Button onClick={add}>Add</Button>
      </Card>

      <ul className="space-y-2">
        {todos.map(t => (
          <li key={t.id} className="p-3 rounded-md bg-card border border-border flex items-center gap-3">
            <Checkbox checked={t.status === "done"} onCheckedChange={() => toggle(t)} />
            <div className="flex-1">
              <p className={t.status === "done" ? "line-through text-muted-foreground" : ""}>{t.title}</p>
              {t.due_date && <p className="text-xs text-muted-foreground">due {fmtDate(t.due_date)}</p>}
            </div>
            <button onClick={() => remove(t.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
          </li>
        ))}
        {todos.length === 0 && <p className="text-sm text-muted-foreground">Nothing yet.</p>}
      </ul>
    </div>
  );
}
