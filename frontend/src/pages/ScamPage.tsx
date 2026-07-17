import { FormEvent, useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  ShieldAlert,
  ShieldCheck,
  Upload,
  AlertTriangle,
  Link2,
  FileText,
  FileSearch,
  Loader2,
  ChevronRight,
  Clipboard,
} from "lucide-react";

type Analysis = {
  _id?: string;
  text: string;
  label: string;
  confidence: number;
  reasons: string[];
};

export function ScamPage() {
  const qc = useQueryClient();
  const [activeInputType, setActiveInputType] = useState<"text" | "upload">("text");
  const [text, setText] = useState("");
  const [channel, setChannel] = useState("sms");
  const [extractingText, setExtractingText] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch history
  const { data } = useQuery({
    queryKey: ["scam-history"],
    queryFn: () => api<{ items: Analysis[] }>("/scam/history"),
  });

  // Scam analysis mutation
  const analyze = useMutation({
    mutationFn: (bodyData: { text: string; channel: string }) =>
      api<{ analysis: Analysis }>("/scam/analyze", {
        method: "POST",
        body: JSON.stringify(bodyData),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scam-history"] });
    },
  });

  // Document OCR text extraction helper
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtractingText(true);
    const form = new FormData();
    form.append("file", file);

    try {
      // 1. Upload file
      const uploadRes = await api<{ document: { _id: string } }>("/documents/upload", {
        method: "POST",
        form,
      });

      // 2. Trigger analysis to extract OCR text
      const analyzeRes = await api<{ document: { analysisSummary?: string } }>(
        `/documents/${uploadRes.document._id}/analyze`,
        { method: "POST" }
      );

      const ocrText = analyzeRes.document.analysisSummary || "";
      if (ocrText) {
        setText(ocrText);
        setActiveInputType("text"); // switch to text view to let user review
      } else {
        alert("Could not extract clear text from document. Try pasting the text manually.");
      }
    } catch (err) {
      alert("Text extraction failed: " + (err as Error).message);
    } finally {
      setExtractingText(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    analyze.mutate({ text, channel });
  };

  const latest = analyze.data?.analysis;

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-10">
      <div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">AI Scam Detector</h1>
        <p className="text-sm text-ink-700/60 dark:text-mist-200/60">
          Verify suspicious SMS, emails, notices, or screenshots for fraud and phishing links
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Form Panel (3/5 width) */}
        <form onSubmit={onSubmit} className="lg:col-span-3 panel space-y-5">
          <div className="flex items-center justify-between border-b border-ink-900/5 dark:border-white/5 pb-3">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <ShieldAlert className="text-leaf-500" size={18} />
              Analyze Source
            </h2>

            {/* Input tabs */}
            <div className="flex bg-mist-100 p-1 rounded-xl dark:bg-ink-900">
              <button
                type="button"
                onClick={() => setActiveInputType("text")}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition ${
                  activeInputType === "text"
                    ? "bg-leaf-600 text-white shadow-soft"
                    : "text-ink-700 dark:text-mist-200"
                }`}
              >
                Paste Text
              </button>
              <button
                type="button"
                onClick={() => setActiveInputType("upload")}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition ${
                  activeInputType === "upload"
                    ? "bg-leaf-600 text-white shadow-soft"
                    : "text-ink-700 dark:text-mist-200"
                }`}
              >
                Upload File
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Medium/Channel</label>
              <select className="input text-xs font-semibold py-2 px-3 rounded-xl bg-white dark:bg-ink-800" value={channel} onChange={(e) => setChannel(e.target.value)}>
                <option value="sms">SMS Message</option>
                <option value="whatsapp">WhatsApp Text</option>
                <option value="email">Email Notice</option>
                <option value="notice">Official Letter</option>
                <option value="other">Other Link/Socials</option>
              </select>
            </div>
          </div>

          {activeInputType === "text" ? (
            <div>
              <label className="label">Paste Content</label>
              <textarea
                className="input min-h-[160px] text-xs font-semibold leading-relaxed"
                required
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste SMS content, suspicious URLs, lottery win claims here..."
              />
            </div>
          ) : (
            <div className="border border-dashed border-ink-900/10 dark:border-white/10 rounded-2xl p-6 bg-mist-50/10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-leaf-500/40 transition relative">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,application/pdf"
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={extractingText}
              />
              {extractingText ? (
                <>
                  <Loader2 className="animate-spin text-leaf-500 mb-2" size={24} />
                  <span className="text-xs font-bold">AI OCR Text Extraction in progress...</span>
                </>
              ) : (
                <>
                  <Upload size={24} className="opacity-40 mb-2 text-leaf-500" />
                  <span className="text-xs font-bold block mb-1">Select Screenshot / PDF Notice</span>
                  <span className="text-[10px] opacity-50">AI will auto-extract text and scan contents</span>
                </>
              )}
            </div>
          )}

          <button className="btn-primary w-full flex items-center justify-center gap-2 py-2.5" disabled={analyze.isPending || extractingText || !text.trim()}>
            {analyze.isPending ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                Scanning database signatures & scoring risk...
              </>
            ) : (
              "Verify Authenticity"
            )}
          </button>
        </form>

        {/* Right Info Panel (2/5 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick verification links */}
          <section className="panel">
            <h3 className="font-display text-base font-bold mb-4 flex items-center gap-2">
              <Link2 size={16} className="text-leaf-500" />
              Official Verification Portals
            </h3>
            <div className="space-y-3 text-[11px] font-bold">
              {[
                { title: "National Cyber Crime Reporting Portal", url: "https://cybercrime.gov.in" },
                { title: "Sanchar Saathi Portal (Verify SIMs/Links)", url: "https://sancharsaathi.gov.in" },
                { title: "PIB Fact Check Desk", url: "https://factcheck.pib.gov.in" }
              ].map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-ink-900/5 bg-mist-50/50 hover:bg-white dark:border-white/5 dark:bg-ink-800/40 hover:border-leaf-500/20 transition"
                >
                  <span>{link.title}</span>
                  <ChevronRight size={14} className="opacity-60" />
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Analysis Result Display */}
      {latest && (
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-bold">Analysis Results</h2>
          <ResultCard item={latest} />
        </section>
      )}

      {/* History */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold flex items-center gap-2">
          <FileSearch className="text-leaf-500" size={20} />
          Scan History logs
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {(data?.items || []).map((item) => (
            <ResultCard key={item._id} item={item} />
          ))}
          {!(data?.items?.length) && (
            <p className="text-sm opacity-60 col-span-2 text-center p-8 italic">No messages analyzed yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function ResultCard({ item }: { item: Analysis }) {
  const isFraud = item.label.toLowerCase() === "fraudulent";
  const isSuspicious = item.label.toLowerCase() === "suspicious";

  let statusClass = "bg-leaf-500/10 text-leaf-700 dark:text-leaf-400 border-leaf-500/20";
  let Icon = ShieldCheck;
  let statusText = "Verified Genuine";
  if (isFraud) {
    statusClass = "bg-red-500/10 text-red-600 border-red-500/20";
    Icon = ShieldAlert;
    statusText = "Dangerous Scam / Fraud";
  } else if (isSuspicious) {
    statusClass = "bg-saffron-500/10 text-saffron-600 border-saffron-500/20";
    Icon = AlertTriangle;
    statusText = "Suspicious Notice";
  }

  // Score
  const scoreVal = Math.round(item.confidence * 100);

  return (
    <article className="panel space-y-4">
      <div className="flex items-center justify-between gap-3 border-b border-ink-900/5 dark:border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Icon className={isFraud ? "text-red-500" : isSuspicious ? "text-saffron-500" : "text-leaf-500"} size={18} />
          <span className={`rounded-lg px-2.5 py-0.5 text-xs font-bold border ${statusClass}`}>{statusText}</span>
        </div>
        <span className="text-xs font-bold opacity-60">Scam Confidence: {scoreVal}%</span>
      </div>

      <div className="space-y-3.5 text-xs">
        {/* Risk meter */}
        <div>
          <div className="flex justify-between font-bold text-[10px] uppercase opacity-50 mb-1">
            <span>Risk Score</span>
            <span>{scoreVal}%</span>
          </div>
          <div className="w-full bg-mist-100 dark:bg-ink-800 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${isFraud ? "bg-red-600" : isSuspicious ? "bg-saffron-500" : "bg-leaf-600"}`}
              style={{ width: `${scoreVal}%` }}
            ></div>
          </div>
        </div>

        {/* Content text */}
        <div>
          <p className="font-bold text-[9px] uppercase tracking-wider opacity-40 mb-1">Content Scanned</p>
          <p className="italic opacity-80 line-clamp-3 leading-relaxed">"{item.text}"</p>
        </div>

        {/* Reasons */}
        {item.reasons && item.reasons.length > 0 && (
          <div>
            <p className="font-bold text-[9px] uppercase tracking-wider opacity-40 mb-1.5">AI Flagged Indicators</p>
            <ul className="list-disc space-y-1 pl-4 opacity-90 leading-relaxed font-semibold">
              {item.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div>
          <p className="font-bold text-[9px] uppercase tracking-wider opacity-40 mb-1">Recommended Action</p>
          <p className="font-bold text-ink-950 dark:text-mist-50 bg-mist-100/50 dark:bg-black/10 p-2.5 rounded-xl border border-ink-900/5 dark:border-white/5">
            {isFraud
              ? "⚠️ BLOCK sender immediately. Do NOT click any links, call numbers provided, or share OTPs. File a report on cybercrime.gov.in."
              : isSuspicious
              ? "🔍 Do not share sensitive profile IDs. Verify the claim independently using official portals listed on the right."
              : "✅ Safe to proceed. No common phishing links or fraudulent bank signatures detected."}
          </p>
        </div>
      </div>
    </article>
  );
}

