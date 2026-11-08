import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/journal")({
  head: () => ({
    meta: [
      { title: "My Diary — Daily Diary" },
      { name: "description", content: "Write today's page and revisit past days." },
      { property: "og:title", content: "My Diary — Daily Diary" },
      { property: "og:description", content: "Write today's page and revisit past days." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Journal,
});

const MOODS = ["😊", "😌", "😐", "😔", "😤", "🥰"];

function localDate(d = new Date()) {
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
}
function pretty(date: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(date + "T00:00:00").toLocaleDateString(undefined, opts);
}

type Entry = { id: string; entry_date: string; title: string; content: string; mood: string | null };

function Journal() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const today = localDate();
  const [date, setDate] = useState(today);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: entries = [] } = useQuery({
    queryKey: ["entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diary_entries")
        .select("id, entry_date, title, content, mood")
        .order("entry_date", { ascending: false });
      if (error) throw error;
      return data as Entry[];
    },
  });

  useEffect(() => {
    const e = entries.find((x) => x.entry_date === date);
    setTitle(e?.title ?? "");
    setContent(e?.content ?? "");
    setMood(e?.mood ?? null);
  }, [date, entries]);

  async function save() {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("diary_entries")
      .upsert(
        { user_id: u.user!.id, entry_date: date, title, content, mood, updated_at: new Date().toISOString() },
        { onConflict: "user_id,entry_date" },
      );
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Page saved");
    qc.invalidateQueries({ queryKey: ["entries"] });
  }

  async function remove() {
    const e = entries.find((x) => x.entry_date === date);
    if (!e || !confirm("Delete this page?")) return;
    await supabase.from("diary_entries").delete().eq("id", e.id);
    qc.invalidateQueries({ queryKey: ["entries"] });
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const hasToday = entries.some((e) => e.entry_date === today);
  const list = hasToday ? entries : [{ id: "new", entry_date: today, title: "", content: "", mood: null }, ...entries];
  const exists = entries.some((e) => e.entry_date === date);

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-8 md:flex-row md:px-8">
      <aside className="md:w-64 md:shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl">My diary</h2>
          <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button>
        </div>
        <label className="mt-4 block text-xs uppercase tracking-widest text-muted-foreground">
          Go to date
          <input
            type="date"
            max={today}
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="mt-1 block w-full rounded-md border bg-card px-3 py-2 text-sm text-foreground"
          />
        </label>
        <ul className="mt-6 space-y-1">
          {list.map((e) => (
            <li key={e.entry_date}>
              <button
                onClick={() => setDate(e.entry_date)}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left transition-colors hover:bg-secondary",
                  date === e.entry_date && "bg-secondary",
                )}
              >
                <div className="text-xs text-muted-foreground">
                  {e.entry_date === today ? "Today" : pretty(e.entry_date, { day: "numeric", month: "short", year: "numeric" })}
                  {e.mood && <span className="ml-2">{e.mood}</span>}
                </div>
                <div className="truncate text-sm">{e.title || (e.id === "new" ? "Write today's page…" : "Untitled")}</div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="flex-1 rounded-xl border bg-card p-6 shadow-page md:p-10">
        <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">
          {pretty(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title for the day"
          className="mt-3 w-full bg-transparent font-display text-4xl outline-none placeholder:text-muted-foreground/60 md:text-5xl"
        />
        <div className="mt-4 flex gap-1">
          {MOODS.map((m) => (
            <button
              key={m}
              onClick={() => setMood(mood === m ? null : m)}
              className={cn("rounded-full px-2 py-1 text-xl transition", mood === m ? "bg-accent" : "opacity-50 hover:opacity-100")}
              aria-label={`Mood ${m}`}
            >
              {m}
            </button>
          ))}
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Dear diary…"
          className="paper-lines mt-6 min-h-[50vh] w-full resize-none bg-transparent text-base outline-none"
        />
        <div className="mt-6 flex justify-between">
          {exists ? <Button variant="ghost" onClick={remove}>Delete</Button> : <span />}
          <Button onClick={save} disabled={saving} className="rounded-full px-8">
            {saving ? "Saving…" : "Save page"}
          </Button>
        </div>
      </section>
    </div>
  );
}
