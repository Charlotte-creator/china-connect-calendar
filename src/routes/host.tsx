import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export const Route = createFileRoute("/host")({
  component: HostLayout,
});

const NAV: { to: string; label: string; exact?: boolean }[] = [
  { to: "/host", label: "Dashboard", exact: true },
  { to: "/host/trip", label: "Trip & cities" },
  { to: "/host/availability", label: "Availability" },
  { to: "/host/question", label: "Screening Q" },
  { to: "/host/requests", label: "Join requests" },
  { to: "/host/todos", label: "To-dos" },
];

function HostLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (!session) navigate({ to: "/login" });
    });
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setReady(true);
      if (!data.session) navigate({ to: "/login" });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  if (!ready) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (!user) return null;

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="md:w-60 md:min-h-screen border-b md:border-b-0 md:border-r border-border bg-card/50">
        <div className="px-5 py-5">
          <Link to="/" className="font-serif text-lg block">Charlotte · China</Link>
          <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
        </div>
        <nav className="px-2 pb-4 flex md:flex-col gap-1 overflow-x-auto">
          {NAV.map(n => {
            const active = n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to}
                className={`px-3 py-2 rounded-md text-sm whitespace-nowrap ${active ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-accent/50"}`}>
                {n.label}
              </Link>
            );
          })}
          <button onClick={logout} className="px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent/50 text-left">Sign out</button>
        </nav>
      </aside>
      <main className="flex-1 px-5 md:px-10 py-8 max-w-5xl"><Outlet /></main>
    </div>
  );
}
