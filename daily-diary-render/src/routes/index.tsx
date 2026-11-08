import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Daily Diary — write a page every day" },
      { name: "description", content: "A calm, private diary. Write one page a day and look back anytime." },
      { property: "og:title", content: "Daily Diary — write a page every day" },
      { property: "og:description", content: "A calm, private diary. Write one page a day and look back anytime." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">{today}</p>
      <h1 className="mt-6 font-display text-6xl leading-none text-foreground md:text-8xl">
        Dear <em>diary,</em>
      </h1>
      <p className="mt-6 max-w-md text-lg text-muted-foreground">
        A quiet, private page for every day of your life. Write a little, remember a lot.
      </p>
      <Button asChild size="lg" className="mt-10 rounded-full">
        <Link to="/journal">Open my diary</Link>
      </Button>
    </main>
  );
}
