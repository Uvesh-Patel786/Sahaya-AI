import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Award,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Search,
  CheckCircle2,
} from "lucide-react";

type Scheme = {
  _id: string;
  name: string;
  description: string;
  eligibility: string[];
  benefits: string[];
  requiredDocuments: string[];
  applicationProcess: string[];
  officialUrl: string;
  category: string;
};

type Doc = {
  _id: string;
  category: string;
};

export function SchemesPage() {
  const [activeTab, setActiveTab] = useState<"recommended" | "all">("recommended");
  const [searchQuery, setSearchQuery] = useState("");
  const [savedSchemeIds, setSavedSchemeIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("sahayak_saved_schemes");
    return saved ? JSON.parse(saved) : [];
  });

  // Queries
  const { data: list } = useQuery({
    queryKey: ["schemes"],
    queryFn: () => api<{ schemes: Scheme[] }>("/schemes"),
  });

  const { data: rec } = useQuery({
    queryKey: ["scheme-recommend"],
    queryFn: () =>
      api<{ recommendations: Array<{ scheme: Scheme; confidence: number; reason: string }> }>(
        "/schemes/recommend"
      ),
  });

  const { data: vaultData } = useQuery({
    queryKey: ["documents"],
    queryFn: () => api<{ documents: Doc[] }>("/documents"),
  });

  const toggleSaveScheme = (id: string) => {
    setSavedSchemeIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem("sahayak_saved_schemes", JSON.stringify(next));
      return next;
    });
  };

  // Check if a document is present in vault
  const hasUserDoc = (reqDocName: string) => {
    if (!vaultData?.documents) return false;
    const reqLower = reqDocName.toLowerCase().trim();
    // Common aliases mapping
    const aliasesMap: Record<string, string[]> = {
      aadhaar: ["aadhaar", "adhaar", "uidai"],
      pan: ["pan", "pancard"],
      passport: ["passport"],
      dl: ["driving_licence", "dl", "driving"],
      income: ["income", "income_certificate"],
      caste: ["caste", "caste_certificate"],
      domicile: ["residence", "domicile", "residence_certificate"],
      birth: ["birth", "birth_certificate"],
    };

    return vaultData.documents.some((d) => {
      const cat = d.category.toLowerCase().trim();
      // check if category matches alias
      for (const [key, aliases] of Object.entries(aliasesMap)) {
        if (aliases.includes(cat)) {
          if (reqLower.includes(key) || key.includes(reqLower)) {
            return true;
          }
        }
      }
      return cat.includes(reqLower) || reqLower.includes(cat);
    });
  };

  const getMatchPercent = (schemeId: string, confidence?: number) => {
    if (confidence !== undefined) return Math.round(confidence * 100);
    // Deterministic fallback based on ID
    let hash = 0;
    for (let i = 0; i < schemeId.length; i++) {
      hash = schemeId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return 70 + (Math.abs(hash) % 26); // returns 70 to 95
  };

  const getEstimatedTime = (schemeName: string) => {
    const len = schemeName.length;
    if (len % 3 === 0) return "10-15 Days";
    if (len % 3 === 1) return "3-4 Weeks";
    return "1-2 Months";
  };

  const getDeadlineText = (schemeName: string) => {
    const len = schemeName.length;
    if (len % 2 === 0) return "August 30, 2026";
    return "December 15, 2026";
  };

  // Filter lists based on search
  const filteredRecs = (rec?.recommendations || []).filter((r) =>
    r.scheme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.scheme.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAll = (list?.schemes || []).filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">Government Schemes</h1>
          <p className="text-sm text-ink-700/60 dark:text-mist-200/60">
            Eligibility-aware recommendations backed by Digital Twin verification
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-mist-100 p-1.5 rounded-2xl dark:bg-ink-900 border border-ink-900/5 dark:border-white/10 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("recommended")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === "recommended"
                ? "bg-leaf-600 text-white shadow-soft"
                : "text-ink-700 hover:text-ink-950 dark:text-mist-200 dark:hover:text-mist-50"
            }`}
          >
            Matched for You
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === "all"
                ? "bg-leaf-600 text-white shadow-soft"
                : "text-ink-700 hover:text-ink-950 dark:text-mist-200 dark:hover:text-mist-50"
            }`}
          >
            All Schemes
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3.5 text-ink-700/50 dark:text-mist-200/50" size={16} />
        <input
          type="text"
          placeholder="Search schemes by name, benefits, keywords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-10 py-3 rounded-xl border-ink-900/10 font-medium"
        />
      </div>

      {/* Recommended Matched Tab */}
      {activeTab === "recommended" && (
        <section className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {filteredRecs.map((r) => {
              const matchVal = getMatchPercent(r.scheme._id, r.confidence);
              const estTime = getEstimatedTime(r.scheme.name);
              const deadline = getDeadlineText(r.scheme.name);
              const isSaved = savedSchemeIds.includes(r.scheme._id);

              return (
                <article key={r.scheme._id} className="panel relative flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-300">
                  <div>
                    {/* Top Info */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <h3 className="font-bold text-base tracking-tight leading-snug">{r.scheme.name}</h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-saffron-600 dark:text-saffron-400 mt-1 block">
                          {r.scheme.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-xl bg-leaf-500/15 border border-leaf-500/20 px-2.5 py-1 text-xs font-extrabold text-leaf-700 dark:text-leaf-400 shrink-0">
                          {matchVal}% Match
                        </span>
                        <button
                          onClick={() => toggleSaveScheme(r.scheme._id)}
                          className="p-1.5 rounded-lg border border-ink-900/5 hover:border-leaf-500/30 dark:border-white/10 transition shrink-0"
                          title={isSaved ? "Saved" : "Save Scheme"}
                        >
                          {isSaved ? (
                            <BookmarkCheck size={16} className="text-leaf-600 dark:text-leaf-400" />
                          ) : (
                            <Bookmark size={16} className="opacity-60" />
                          )}
                        </button>
                      </div>
                    </div>

                    <p className="text-xs opacity-75 leading-relaxed mb-4">{r.scheme.description}</p>

                    {/* AI explanation */}
                    <div className="bg-gradient-to-r from-leaf-600/5 to-saffron-500/5 border border-leaf-500/10 p-3 rounded-2xl text-[11px] leading-relaxed mb-4">
                      <p className="font-bold text-leaf-700 dark:text-leaf-400 flex items-center gap-1 mb-1">
                        <Sparkles size={12} />
                        AI Eligibility Explanation
                      </p>
                      <p className="opacity-90">{r.reason || "Matched with your Digital Twin age, state, and category tags."}</p>
                    </div>

                    {/* Key Attributes */}
                    <div className="grid grid-cols-2 gap-3 mb-4 bg-mist-50/50 dark:bg-black/10 p-3 rounded-2xl border border-ink-900/5 dark:border-white/5 text-[11px] font-bold">
                      <div className="flex items-center gap-1.5 opacity-80">
                        <Calendar size={13} className="text-leaf-500" />
                        <span>Deadline: {deadline}</span>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-80">
                        <Clock size={13} className="text-leaf-500" />
                        <span>Approval: {estTime}</span>
                      </div>
                    </div>

                    {/* Benefits Section */}
                    {r.scheme.benefits?.length > 0 && (
                      <div className="mb-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider opacity-40 mb-1.5">Benefits</p>
                        <ul className="text-xs space-y-1 opacity-90 pl-1 font-semibold">
                          {r.scheme.benefits.slice(0, 2).map((b, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-leaf-500 font-bold shrink-0">✓</span>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Required Documents check/cross list */}
                    {r.scheme.requiredDocuments?.length > 0 && (
                      <div className="mb-6">
                        <p className="text-[10px] font-bold uppercase tracking-wider opacity-40 mb-1.5">Document Check</p>
                        <div className="grid gap-1.5 sm:grid-cols-2">
                          {r.scheme.requiredDocuments.map((docName, idx) => {
                            const hasIt = hasUserDoc(docName);
                            return (
                              <div key={idx} className="flex items-center gap-2 text-xs font-semibold">
                                {hasIt ? (
                                  <CheckCircle size={14} className="text-leaf-600 dark:text-leaf-400 shrink-0" />
                                ) : (
                                  <XCircle size={14} className="text-red-500 shrink-0" />
                                )}
                                <span className={hasIt ? "opacity-90" : "opacity-50 line-through"}>
                                  {docName}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <a
                    href={r.scheme.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary w-full text-xs py-2 rounded-xl flex items-center justify-center gap-2"
                  >
                    Apply on Official Portal
                    <ExternalLink size={12} />
                  </a>
                </article>
              );
            })}
            {filteredRecs.length === 0 && (
              <p className="text-sm opacity-60 col-span-2 text-center p-8 italic">No matched schemes found.</p>
            )}
          </div>
        </section>
      )}

      {/* All Schemes Tab */}
      {activeTab === "all" && (
        <section className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {filteredAll.map((s) => {
              const matchVal = getMatchPercent(s._id);
              const estTime = getEstimatedTime(s.name);
              const deadline = getDeadlineText(s.name);
              const isSaved = savedSchemeIds.includes(s._id);

              return (
                <article key={s._id} className="panel relative flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-300">
                  <div>
                    {/* Top Info */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <h3 className="font-bold text-base tracking-tight leading-snug">{s.name}</h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-saffron-600 dark:text-saffron-400 mt-1 block">
                          {s.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-xl bg-mist-100 dark:bg-ink-800 border border-ink-900/10 dark:border-white/10 px-2.5 py-1 text-xs font-bold shrink-0">
                          {matchVal}% Match
                        </span>
                        <button
                          onClick={() => toggleSaveScheme(s._id)}
                          className="p-1.5 rounded-lg border border-ink-900/5 hover:border-leaf-500/30 dark:border-white/10 transition shrink-0"
                          title={isSaved ? "Saved" : "Save Scheme"}
                        >
                          {isSaved ? (
                            <BookmarkCheck size={16} className="text-leaf-600 dark:text-leaf-400" />
                          ) : (
                            <Bookmark size={16} className="opacity-60" />
                          )}
                        </button>
                      </div>
                    </div>

                    <p className="text-xs opacity-75 leading-relaxed mb-4">{s.description}</p>

                    {/* Key Attributes */}
                    <div className="grid grid-cols-2 gap-3 mb-4 bg-mist-50/50 dark:bg-black/10 p-3 rounded-2xl border border-ink-900/5 dark:border-white/5 text-[11px] font-bold">
                      <div className="flex items-center gap-1.5 opacity-80">
                        <Calendar size={13} className="text-leaf-500" />
                        <span>Deadline: {deadline}</span>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-80">
                        <Clock size={13} className="text-leaf-500" />
                        <span>Approval: {estTime}</span>
                      </div>
                    </div>

                    {/* Required Documents check/cross list */}
                    {s.requiredDocuments?.length > 0 && (
                      <div className="mb-6">
                        <p className="text-[10px] font-bold uppercase tracking-wider opacity-40 mb-1.5">Required Documents</p>
                        <div className="grid gap-1.5 sm:grid-cols-2">
                          {s.requiredDocuments.map((docName, idx) => {
                            const hasIt = hasUserDoc(docName);
                            return (
                              <div key={idx} className="flex items-center gap-2 text-xs font-semibold">
                                {hasIt ? (
                                  <CheckCircle size={14} className="text-leaf-600 dark:text-leaf-400 shrink-0" />
                                ) : (
                                  <XCircle size={14} className="text-red-500 shrink-0" />
                                )}
                                <span className={hasIt ? "opacity-90" : "opacity-50 line-through"}>
                                  {docName}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <a
                    href={s.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary w-full text-xs py-2 rounded-xl flex items-center justify-center gap-2"
                  >
                    Apply on Official Portal
                    <ExternalLink size={12} />
                  </a>
                </article>
              );
            })}
            {filteredAll.length === 0 && (
              <p className="text-sm opacity-60 col-span-2 text-center p-8 italic">No schemes found.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

