import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function OpportunitiesPage() {
  const { data } = useQuery({
    queryKey: ["opportunities"],
    queryFn: () => api<{ opportunities: Opp[] }>("/opportunities"),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">AI Opportunity Engine</h1>
        <p className="text-sm opacity-60">Scholarships, jobs, grants, incubators matched to you</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {(data?.opportunities || []).map((o) => (
          <article key={o._id} className="panel">
            <p className="text-xs uppercase tracking-wide text-leaf-600">{o.type}</p>
            <h2 className="mt-1 font-display text-xl font-semibold">{o.title}</h2>
            <p className="mt-2 text-sm opacity-70">{o.description}</p>
            <a className="mt-3 inline-block text-sm text-leaf-600 underline" href={o.url} target="_blank" rel="noreferrer">
              Open official link
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}

type Opp = {
  _id: string;
  title: string;
  type: string;
  description: string;
  url: string;
};
