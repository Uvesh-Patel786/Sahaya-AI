import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  MapPin,
  Camera,
  AlertTriangle,
  Clock,
  Sparkles,
  Search,
  Droplet,
  Trash2,
  Lightbulb,
  Car,
  FileText,
  Loader2,
} from "lucide-react";

type Report = {
  _id: string;
  issueType: string;
  trackingId: string;
  aiComplaintText: string;
  department: string;
  severity: string;
  status: string;
  confidence: number;
};

const CATEGORIES = [
  { id: "pothole", label: "Pothole", icon: AlertTriangle, desc: "Dangerous road craters" },
  { id: "garbage", label: "Garbage Pile", icon: Trash2, desc: "Overflowing municipal bins" },
  { id: "water_leakage", label: "Water Leakage", icon: Droplet, desc: "Burst water pipes/flooding" },
  { id: "street_light", label: "Street Light", icon: Lightbulb, desc: "Non-functioning street lamps" },
  { id: "traffic", label: "Traffic Hazard", icon: Car, desc: "Blocked crossings or signals" },
  { id: "road_damage", label: "Road Damage", icon: AlertTriangle, desc: "Cracked tarmac or construction issues" },
];

export function CivicPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["civic"],
    queryFn: () => api<{ reports: Report[] }>("/civic/reports"),
  });

  const [lat, setLat] = useState("23.0225");
  const [lng, setLng] = useState("72.5714");
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState("pothole");

  const submit = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Photo required");
      const form = new FormData();
      form.append("photo", file);
      form.append("lat", lat);
      form.append("lng", lng);
      // Include the category tag in the description to assist Vision RAG
      form.append("description", `[${selectedCat.toUpperCase()}] ${desc}`);
      return api("/civic/reports", { method: "POST", form });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["civic"] });
      setDesc("");
      setFile(null);
      setPreviewUrl(null);
    },
  });

  function useMyLocation() {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude));
        setLng(String(pos.coords.longitude));
      },
      (err) => {
        alert("Failed to access location: " + err.message);
      }
    );
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    submit.mutate();
  }

  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${Number(lng) - 0.02}%2C${Number(lat) - 0.02}%2C${Number(lng) + 0.02}%2C${Number(lat) + 0.02}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Civic Issue Reporting</h1>
        <p className="text-sm text-ink-700/60 dark:text-mist-200/60">
          Vision AI classification, severity estimation, auto-drafted complaints, and tracking
        </p>
      </div>

      {/* Split Grid */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Column: Form (3/5 width) */}
        <div className="lg:col-span-3 space-y-6">
          <form onSubmit={onSubmit} className="panel space-y-5">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <Camera className="text-leaf-500" size={18} />
              File New Complaint
            </h2>

            {/* Category selection */}
            <div>
              <label className="label">Select Issue Category</label>
              <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSel = selectedCat === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCat(cat.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSel
                          ? "bg-leaf-600/10 text-leaf-700 dark:text-leaf-400 border-leaf-500/35"
                          : "border-ink-900/5 bg-mist-50/50 hover:bg-white dark:border-white/5 dark:bg-ink-800/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={14} className={isSel ? "text-leaf-600 dark:text-leaf-400" : "opacity-60"} />
                        <span className="text-[11px] font-bold">{cat.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Photo upload + preview */}
            <div>
              <label className="label">Evidence Photo</label>
              <div className="border border-dashed border-ink-900/10 dark:border-white/10 rounded-2xl p-4 bg-mist-50/10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-leaf-500/40 transition relative">
                {previewUrl ? (
                  <div className="relative w-full max-w-[200px] h-[140px] rounded-xl overflow-hidden shadow-soft">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setPreviewUrl(null);
                      }}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow-soft hover:bg-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <Camera size={24} className="opacity-40 mb-2 text-leaf-500 animate-pulse" />
                    <span className="text-xs font-bold block mb-1">Click to select photo</span>
                    <span className="text-[10px] opacity-50">Upload geo-tagged pothole / waste image</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="label">Describe Issue</label>
              <textarea
                className="input min-h-24 text-xs font-semibold leading-relaxed"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Pothole near the main crossing causing traffic blockages..."
                required
              />
            </div>

            {/* Lat / Lng */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Latitude</label>
                <input className="input text-xs font-semibold" value={lat} onChange={(e) => setLat(e.target.value)} />
              </div>
              <div>
                <label className="label">Longitude</label>
                <input className="input text-xs font-semibold" value={lng} onChange={(e) => setLng(e.target.value)} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-between items-center pt-2">
              <button
                type="button"
                className="btn-ghost py-2.5 px-4 text-xs font-bold flex items-center gap-1.5"
                onClick={useMyLocation}
              >
                <MapPin size={13} className="text-leaf-500" />
                Find My GPS
              </button>
              <button className="btn-primary py-2.5 px-6 text-xs" disabled={submit.isPending}>
                {submit.isPending ? (
                  <>
                    <Loader2 className="animate-spin" size={12} />
                    Submitting to AI Municipal Hub...
                  </>
                ) : (
                  "Submit Report"
                )}
              </button>
            </div>
            {submit.isError && <p className="text-xs text-red-500 font-semibold">{(submit.error as Error).message}</p>}
          </form>
        </div>

        {/* Right Column: Map (2/5 width) */}
        <div className="lg:col-span-2">
          <div className="panel overflow-hidden p-0 h-full min-h-[300px] border border-ink-900/5 dark:border-white/10 rounded-3xl relative">
            <iframe title="Issue map" className="h-full w-full border-0" src={mapSrc} />
            <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-ink-950/90 px-3 py-1.5 rounded-xl border border-ink-900/5 dark:border-white/10 text-[10px] font-bold flex items-center gap-1.5 backdrop-blur-sm shadow-soft">
              <MapPin size={12} className="text-leaf-500" />
              GPS Locked
            </div>
          </div>
        </div>
      </div>

      {/* Reports History */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold flex items-center gap-2">
          <FileText className="text-leaf-500" size={20} />
          Active Reports Tracker
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {(data?.reports || []).map((r) => {
            const severityColor =
              r.severity.toLowerCase().includes("high") || r.severity.toLowerCase().includes("critical")
                ? "bg-red-500/10 text-red-600 border-red-500/25"
                : r.severity.toLowerCase().includes("medium")
                ? "bg-saffron-500/10 text-saffron-600 border-saffron-500/25"
                : "bg-leaf-500/10 text-leaf-700 dark:text-leaf-400 border-leaf-500/25";

            const statusColor =
              r.status.toLowerCase().includes("resolved") || r.status.toLowerCase().includes("completed")
                ? "bg-leaf-500/10 text-leaf-700 dark:text-leaf-400 border-leaf-500/25"
                : "bg-saffron-500/10 text-saffron-600 border-saffron-500/25";

            return (
              <article
                key={r._id}
                className="panel relative flex flex-col justify-between hover:border-leaf-500/20 transition-all duration-200"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h3 className="font-bold text-sm capitalize tracking-tight">
                      {r.issueType.replace(/_/g, " ")}
                    </h3>
                    <span className="text-[10px] font-mono opacity-50 font-semibold">{r.trackingId}</span>
                  </div>

                  {/* AI drafted text */}
                  <div className="bg-mist-50/50 dark:bg-black/10 p-3 rounded-2xl border border-ink-900/5 dark:border-white/5 text-[11px] leading-relaxed mb-4">
                    <p className="font-bold text-[9px] uppercase tracking-wider opacity-40 mb-1">AI Generated Report</p>
                    <p className="opacity-90 italic leading-relaxed">"{r.aiComplaintText}"</p>
                  </div>
                </div>

                {/* Badges footer */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-ink-900/5 dark:border-white/5 text-[10px] font-bold">
                  <span className={`px-2 py-0.5 rounded-lg border ${severityColor}`}>
                    Severity: {r.severity}
                  </span>
                  <span className={`px-2 py-0.5 rounded-lg border ${statusColor}`}>
                    Status: {r.status}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg border border-ink-900/5 bg-mist-50/20 text-ink-900/70 dark:text-mist-200">
                    Dept: {r.department}
                  </span>
                </div>
              </article>
            );
          })}
          {!(data?.reports?.length) && (
            <p className="text-sm opacity-60 col-span-2 text-center p-8 italic">No complaints reported yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

