import { FormEvent, useState } from "react";
import { api } from "@/lib/api";

export function RoadmapsPage() {
  const [goal, setGoal] = useState("Apply for a passport");
  const [context, setContext] = useState("");
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api<{ roadmap: Roadmap }>("/roadmaps/generate", {
        method: "POST",
        body: JSON.stringify({ goal, context }),
      });
      setRoadmap(data.roadmap);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">AI Roadmap Generator</h1>
        <p className="text-sm opacity-60">Phased action plans for your goals</p>
      </div>
      <form onSubmit={onSubmit} className="panel space-y-3">
        <input className="input" value={goal} onChange={(e) => setGoal(e.target.value)} required />
        <textarea className="input min-h-24" value={context} onChange={(e) => setContext(e.target.value)} placeholder="Context…" />
        <button className="btn-primary" disabled={loading}>
          {loading ? "Building…" : "Generate roadmap"}
        </button>
      </form>
      {roadmap && (
        <div className="space-y-4">
          {roadmap.phases.map((p) => (
            <section key={p.name} className="panel">
              <h2 className="font-display text-xl font-semibold">{p.name}</h2>
              <p className="text-xs opacity-60">{p.duration}</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                {p.actions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </section>
          ))}
          <section className="panel text-sm">
            <p>
              <strong>Documents:</strong> {roadmap.documents.join(", ")}
            </p>
            <p className="mt-2">
              <strong>Risks:</strong> {roadmap.risks.join(" · ")}
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

type Roadmap = {
  goal: string;
  phases: Array<{ name: string; duration: string; actions: string[] }>;
  documents: string[];
  risks: string[];
};
