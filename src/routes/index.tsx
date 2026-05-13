import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [trip, setTrip] = useState<{ public_slug: string; host_display_name: string; title: string } | null>(null);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    supabase.from("trips").select("public_slug, host_display_name, title").limit(1).maybeSingle()
      .then(({ data }) => { if (data) setTrip(data); });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-5 flex justify-between items-center">
        <span className="font-serif text-xl">Charlotte · China</span>
        <div className="flex gap-3 text-sm">
          {authed ? (
            <Link to="/host" className="underline underline-offset-4">Dashboard</Link>
          ) : (
            <Link to="/login" className="underline underline-offset-4">Host login</Link>
          )}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-clay mb-6">May 30 — June 14, 2026</p>
          <h1 className="font-serif text-5xl md:text-7xl leading-[0.95] mb-6">
            A small window<br/>
            <em className="text-clay not-italic">in China.</em>
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto mb-10">
            Book time with me — Shanghai, Beijing, Shenzhen, Hong Kong. Answer one question to unlock the calendar.
          </p>
          {trip ? (
            <Button size="lg" onClick={() => navigate({ to: "/t/$slug", params: { slug: trip.public_slug } })}>
              Open the calendar →
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">Calendar isn't set up yet.</p>
          )}
        </div>
      </main>

      <footer className="px-6 py-6 text-center text-xs text-muted-foreground">
        A personal scheduler · made with care
      </footer>
    </div>
  );
}
