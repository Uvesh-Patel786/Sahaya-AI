import { FormEvent, useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  FileCheck,
  AlertTriangle,
  Upload,
  Sparkles,
  Info,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  Loader2,
  ChevronRight,
} from "lucide-react";

type Doc = {
  _id: string;
  originalName: string;
  category: string;
  status: string;
  expiryDate?: string;
  analysisSummary?: string;
};

type Scheme = {
  _id: string;
  name: string;
  requiredDocuments: string[];
};

export function DocumentsPage() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocCategory, setSelectedDocCategory] = useState<string | null>(null);

  // Explanation states
  const [explain, setExplain] = useState<Record<string, unknown> | null>(null);
  const [explaining, setExplaining] = useState(false);

  // Fetch vault documents
  const { data: vaultData, isLoading: loadingDocs } = useQuery({
    queryKey: ["documents"],
    queryFn: () => api<{ documents: Doc[] }>("/documents"),
  });

  // Fetch recommended schemes to identify missing documents
  const { data: recData } = useQuery({
    queryKey: ["scheme-recommend"],
    queryFn: () =>
      api<{ recommendations: Array<{ scheme: Scheme; confidence: number }> }>("/schemes/recommend"),
  });

  // Mutations
  const upload = useMutation({
    mutationFn: async ({ file, category }: { file: File; category: string }) => {
      const form = new FormData();
      form.append("file", file);
      form.append("category", category);
      return api<{ document: Doc }>("/documents/upload", { method: "POST", form });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      qc.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });

  const analyze = useMutation({
    mutationFn: (id: string) => api(`/documents/${id}/analyze`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      qc.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });

  async function explainLetter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = (e.currentTarget.elements.namedItem("letter") as HTMLInputElement).files?.[0];
    if (!input) return;
    setExplaining(true);
    setExplain(null);
    try {
      const form = new FormData();
      form.append("file", input);
      const res = await api<{ explanation: Record<string, unknown> }>("/documents/explain-letter", {
        method: "POST",
        form,
      });
      setExplain(res.explanation);
    } catch (err) {
      alert("Failed to explain letter: " + (err as Error).message);
    } finally {
      setExplaining(false);
    }
  }

  // 8 Standard Documents
  const standardDocs = [
    { key: "aadhaar", label: "Aadhaar Card", aliases: ["aadhaar", "adhaar", "uidai"] },
    { key: "pan", label: "PAN Card", aliases: ["pan", "pancard"] },
    { key: "passport", label: "Indian Passport", aliases: ["passport"] },
    { key: "driving_licence", label: "Driving Licence", aliases: ["driving_licence", "dl", "driving"] },
    { key: "income", label: "Income Certificate", aliases: ["income", "income_certificate"] },
    { key: "caste", label: "Caste Certificate", aliases: ["caste", "caste_certificate"] },
    { key: "domicile", label: "Domicile Certificate", aliases: ["residence", "domicile", "residence_certificate"] },
    { key: "birth", label: "Birth Certificate", aliases: ["birth", "birth_certificate"] },
  ];

  // Map database docs to standard doc keys
  const getDocForCategory = (aliases: string[]): Doc | undefined => {
    return (vaultData?.documents || []).find((d) =>
      aliases.includes(d.category.toLowerCase().trim())
    );
  };

  // Find missing documents needed for recommended schemes
  const getMissingDocumentsForSchemes = () => {
    if (!recData?.recommendations || !vaultData?.documents) return [];
    const userDocs = new Set(vaultData.documents.map((d) => d.category.toLowerCase().trim()));

    const missing: Array<{ schemeName: string; document: string }> = [];
    recData.recommendations.forEach((r) => {
      if (r.confidence > 0.5) {
        (r.scheme.requiredDocuments || []).forEach((reqDoc) => {
          const reqLower = reqDoc.toLowerCase().trim();
          // Check if this required document is in any alias of standard documents user has
          const hasDoc = standardDocs.some((sd) => {
            const isMatch = sd.label.toLowerCase().includes(reqLower) || reqLower.includes(sd.key);
            if (isMatch) {
              const userHasIt = getDocForCategory(sd.aliases);
              return !!userHasIt;
            }
            return false;
          });

          if (!hasDoc) {
            missing.push({ schemeName: r.scheme.name, document: reqDoc });
          }
        });
      }
    });
    return missing;
  };

  const missingRequirements = getMissingDocumentsForSchemes();

  const handleUploadClick = (category: string) => {
    setSelectedDocCategory(category);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedDocCategory) {
      upload.mutate({ file, category: selectedDocCategory });
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">AI Document Vault</h1>
        <p className="text-sm text-ink-700/60 dark:text-mist-200/60">
          Secure cloud locker powered by OCR analysis, auto-classification, and expiry tracking
        </p>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,application/pdf,.txt"
      />

      {/* 1. AI Vault Insights & Suggestions */}
      {missingRequirements.length > 0 && (
        <section className="panel bg-gradient-to-r from-leaf-600/5 to-saffron-500/5 border border-leaf-500/10">
          <div className="flex items-start gap-3">
            <Sparkles className="text-leaf-500 shrink-0 mt-1" size={20} />
            <div>
              <h2 className="font-bold text-sm">AI Suggestions for Scheme Matches</h2>
              <div className="mt-2 space-y-1.5">
                {missingRequirements.slice(0, 3).map((mr, idx) => (
                  <p key={idx} className="text-xs text-ink-700/80 dark:text-mist-200/80 font-semibold flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 bg-saffron-500 rounded-full" />
                    Upload your <strong className="text-saffron-600 dark:text-saffron-400">{mr.document}</strong> to unlock eligibility for <strong className="text-leaf-700 dark:text-leaf-400">{mr.schemeName}</strong>.
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Grid: Left - Document Vault, Right - Government Letter Explainer */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Document Grid */}
        <div className="lg:col-span-2 space-y-6">
          <section className="panel">
            <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
              <FileCheck className="text-leaf-500" size={20} />
              Vault Dashboard
            </h2>

            {loadingDocs ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin text-leaf-500" />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {standardDocs.map((sd) => {
                  const doc = getDocForCategory(sd.aliases);
                  const isVerified = doc?.status === "verified" || doc?.status === "active";
                  const isPending = doc?.status === "pending" || doc?.status === "analyzed";
                  const isMissing = !doc;

                  let statusText = "Missing";
                  let statusClass = "bg-red-500/10 text-red-600 border-red-500/25";
                  if (isVerified) {
                    statusText = "Verified";
                    statusClass = "bg-leaf-500/10 text-leaf-700 dark:text-leaf-400 border-leaf-500/25";
                  } else if (isPending) {
                    statusText = "Pending Analysis";
                    statusClass = "bg-saffron-500/10 text-saffron-600 border-saffron-500/25";
                  }

                  return (
                    <div
                      key={sd.key}
                      className={`p-4 rounded-2xl border flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-200 ${
                        isMissing
                          ? "border-dashed border-ink-900/10 dark:border-white/10 bg-mist-50/20"
                          : "border-ink-900/5 bg-mist-50/50 dark:border-white/5 dark:bg-ink-800/40"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-sm tracking-tight">{sd.label}</h3>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border uppercase ${statusClass}`}>
                            {statusText}
                          </span>
                        </div>

                        {doc && (
                          <div className="space-y-1">
                            <p className="text-[10px] opacity-60 truncate font-semibold">
                              File: {doc.originalName}
                            </p>
                            {doc.expiryDate && (
                              <p className="text-[10px] text-saffron-600 dark:text-saffron-400 font-bold flex items-center gap-1">
                                <Calendar size={11} />
                                Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                              </p>
                            )}
                            {doc.analysisSummary && (
                              <div className="mt-2 bg-white/50 dark:bg-black/10 p-2.5 rounded-xl text-xs opacity-75 border border-ink-900/5 dark:border-white/5">
                                <p className="font-bold text-[9px] uppercase tracking-wider opacity-40 mb-1">AI Extracted Info</p>
                                <p className="line-clamp-2 leading-relaxed">{doc.analysisSummary}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex gap-2">
                        {isMissing ? (
                          <button
                            onClick={() => handleUploadClick(sd.key)}
                            disabled={upload.isPending && selectedDocCategory === sd.key}
                            className="btn-primary w-full py-2 text-xs flex items-center justify-center gap-2 rounded-xl"
                          >
                            {upload.isPending && selectedDocCategory === sd.key ? (
                              <Loader2 className="animate-spin" size={12} />
                            ) : (
                              <Upload size={12} />
                            )}
                            Upload File
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => analyze.mutate(doc._id)}
                              disabled={analyze.isPending}
                              className="btn-ghost flex-1 py-1.5 text-[11px] font-bold flex items-center justify-center gap-1 hover:border-leaf-500/30"
                            >
                              <Sparkles size={11} className="text-leaf-500" />
                              AI Analyze
                            </button>
                            <button
                              onClick={() => handleUploadClick(sd.key)}
                              className="btn-ghost py-1.5 px-3 hover:bg-mist-100 text-[11px]"
                            >
                              Replace
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right: Explainer */}
        <div className="space-y-6">
          <section className="panel flex flex-col h-full justify-between">
            <div>
              <h2 className="font-display text-xl font-bold mb-2 flex items-center gap-2">
                <FileText className="text-saffron-500" size={18} />
                Govt Letter Explainer
              </h2>
              <p className="text-xs opacity-60 mb-5 leading-relaxed">
                Upload any official notification, tax demand, or court summons to translate it into simple, plain terms.
              </p>

              <form onSubmit={explainLetter} className="space-y-4">
                <div className="border border-dashed border-ink-900/10 dark:border-white/10 rounded-2xl p-4 bg-mist-50/10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-leaf-500/40 transition">
                  <Upload size={24} className="opacity-40 mb-2 text-leaf-500" />
                  <span className="text-xs font-bold block mb-1">Select Notice File</span>
                  <span className="text-[10px] opacity-50">PDF, JPG, PNG or TXT</span>
                  <input
                    name="letter"
                    type="file"
                    accept="image/*,application/pdf,.txt"
                    required
                    className="mt-3 text-xs w-full max-w-[200px]"
                  />
                </div>
                <button className="btn-primary w-full flex items-center justify-center gap-2" disabled={explaining}>
                  {explaining ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      Analyzing letter...
                    </>
                  ) : (
                    "Explain in plain language"
                  )}
                </button>
              </form>
            </div>

            {/* Explanation Results */}
            {explain && (
              <div className="mt-6 border border-ink-900/5 bg-mist-50/50 p-4 rounded-2xl dark:border-white/5 dark:bg-ink-800/40 text-xs leading-relaxed space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm tracking-tight text-ink-950 dark:text-mist-50">Plain-Language Guide</h4>
                  <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-extrabold uppercase ${
                    String(explain.priority || "").toLowerCase().includes("high") || String(explain.priority || "").toLowerCase().includes("urgent")
                      ? "bg-red-500/10 text-red-600 border-red-500/25"
                      : "bg-saffron-500/10 text-saffron-600 border-saffron-500/25"
                  }`}>
                    {String(explain.priority || "Action Required")}
                  </span>
                </div>
                <div>
                  <p className="font-bold opacity-40 text-[9px] uppercase tracking-wider mb-1">Summary</p>
                  <p className="font-semibold">{String(explain.summary || "")}</p>
                </div>
                <div>
                  <p className="font-bold opacity-40 text-[9px] uppercase tracking-wider mb-1">Simplified Explanation</p>
                  <p className="opacity-95 leading-relaxed">{String(explain.plain_explanation || explain.explanation || "")}</p>
                </div>
                {explain.deadline && (
                  <div className="bg-saffron-500/10 border border-saffron-500/20 text-saffron-700 dark:text-saffron-400 p-2 rounded-xl flex items-center gap-2 font-bold text-[10px]">
                    <Clock size={12} />
                    Deadline: {String(explain.deadline)}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

