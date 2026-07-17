import { FormEvent, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const CATEGORIES = ["student", "farmer", "senior", "woman", "pwd", "entrepreneur", "jobseeker", "rural", "urban"];

export function SettingsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["twin"],
    queryFn: () => api<{ twin: Twin | null }>("/twin"),
  });
  const [form, setForm] = useState<Twin>({
    age: 25,
    state: "Gujarat",
    education: "",
    occupation: "",
    categories: [],
    interests: [],
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data?.twin) {
      setForm({
        age: data.twin.age || 25,
        gender: data.twin.gender || "",
        state: data.twin.state || "",
        district: data.twin.district || "",
        education: data.twin.education || "",
        occupation: data.twin.occupation || "",
        incomeBand: data.twin.incomeBand || "",
        categories: data.twin.categories || [],
        interests: data.twin.interests || [],
      });
    }
  }, [data]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await api("/twin", { method: "PUT", body: JSON.stringify(form) });
    setSaved(true);
    qc.invalidateQueries({ queryKey: ["twin"] });
    qc.invalidateQueries({ queryKey: ["recommendations"] });
    setTimeout(() => setSaved(false), 2000);
  }

  function toggleCategory(c: string) {
    setForm((f) => ({
      ...f,
      categories: f.categories?.includes(c)
        ? f.categories.filter((x) => x !== c)
        : [...(f.categories || []), c],
    }));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Digital Twin Settings</h1>
        <p className="text-sm opacity-60">Privacy-respecting profile powering recommendations</p>
      </div>
      <form onSubmit={onSubmit} className="panel space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Age</label>
            <input
              className="input"
              type="number"
              value={form.age || ""}
              onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="label">State</label>
            <input className="input" value={form.state || ""} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </div>
          <div>
            <label className="label">District</label>
            <input
              className="input"
              value={form.district || ""}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Occupation</label>
            <input
              className="input"
              value={form.occupation || ""}
              onChange={(e) => setForm({ ...form, occupation: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Education</label>
            <input
              className="input"
              value={form.education || ""}
              onChange={(e) => setForm({ ...form, education: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Income band</label>
            <input
              className="input"
              value={form.incomeBand || ""}
              onChange={(e) => setForm({ ...form, incomeBand: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="label">Categories</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleCategory(c)}
                className={`rounded-xl px-3 py-1.5 text-sm ${
                  form.categories?.includes(c)
                    ? "bg-leaf-600 text-white"
                    : "bg-mist-100 dark:bg-ink-800"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <button className="btn-primary">{saved ? "Saved" : "Save Digital Twin"}</button>
      </form>
    </div>
  );
}

type Twin = {
  age?: number;
  gender?: string;
  state?: string;
  district?: string;
  education?: string;
  occupation?: string;
  incomeBand?: string;
  categories?: string[];
  interests?: string[];
};
