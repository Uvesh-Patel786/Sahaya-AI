import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  GraduationCap,
  Briefcase,
  Heart,
  Store,
  Home,
  UserCheck,
  Sprout,
  UserRound,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Calendar,
  FileText,
  Loader2,
  HelpCircle,
} from "lucide-react";

type Plan = {
  title: string;
  summary: string;
  checklist: Array<{ step: string; documents?: string[]; priority: string }>;
  relatedBenefits: string[];
};

type Doc = {
  category: string;
};

const LIFE_STAGES = [
  { id: "student", label: "Student", icon: GraduationCap, desc: "Scholarships, admissions, education loans" },
  { id: "first job", label: "First Job", icon: Briefcase, desc: "Tax filings, EPFO, skills certifications" },
  { id: "marriage", label: "Marriage", icon: Heart, desc: "Marriage certificate, joint accounts, legal updates" },
  { id: "start a business", label: "Starting Business", icon: Store, desc: "GST, MSME registration, seed grants" },
  { id: "buy a house", label: "Buying House", icon: Home, desc: "RERA, stamp duty, housing subsidies" },
  { id: "retirement", label: "Senior Citizen", icon: UserRound, desc: "Pensions, health cards, senior benefits" },
  { id: "farmer", label: "Farmer", icon: Sprout, desc: "PM-Kisan, crop insurance, equipment subsidies" },
  { id: "women entrepreneur", label: "Women Entrepreneur", icon: Sparkles, desc: "Special mudra loans, Standup India benefits" },
];

export function LifeEventsPage() {
  const [selectedStage, setSelectedStage] = useState("student");
  const [details, setDetails] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Fetch vault documents to check availability
  const { data: vaultData } = useQuery({
    queryKey: ["documents"],
    queryFn: () => api<{ documents: Doc[] }>("/documents"),
  });

  const hasDoc = (name: string) => {
    if (!vaultData?.documents) return false;
    const n = name.toLowerCase().trim();
    return vaultData.documents.some((d) => d.category.toLowerCase().includes(n) || n.includes(d.category.toLowerCase()));
  };

  async function generateChecklist(stageId: string, customDetails = "") {
    setLoading(true);
    setPlan(null);
    setAiAnswer("");
    try {
      const data = await api<{ plan: Plan }>("/life-events/plan", {
        method: "POST",
        body: JSON.stringify({ event: stageId, details: customDetails }),
      });
      setPlan(data.plan);
    } catch (err) {
      alert("Failed to generate: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // AI Guidance Q&A specific to this life stage
  async function askAiGuidance(question: string) {
    if (!question.trim()) return;
    setAiLoading(true);
    setAiAnswer("");
    try {
      const data = await api<{ reply: string }>("/chat", {
        method: "POST",
        body: JSON.stringify({
          message: `Regarding the life stage "${selectedStage}", here is my question: ${question}. Focus on government rules, deadlines, and direct advice.`,
          language: "en",
        }),
      });
      setAiAnswer(data.reply);
    } catch (err) {
      setAiAnswer(`Error: ${(err as Error).message}`);
    } finally {
      setAiLoading(false);
    }
  }

  // Get matching opportunities/scholarships/grants
  const getStageOpportunities = (stageId: string) => {
    switch (stageId) {
      case "student":
        return [
          { title: "National Scholarship Portal (NSP)", type: "Scholarship", value: "Up to ₹50,000 / year" },
          { title: "PM Internship Scheme", type: "Internship", value: "₹5,000 / month stipend" }
        ];
      case "first job":
        return [
          { title: "Skill India Mission Training", type: "Certification", value: "Free training & placements" },
          { title: "Pradhan Mantri Kaushal Vikas Yojana", type: "Grant", value: "Skill assessment funding" }
        ];
      case "start a business":
        return [
          { title: "Startup India Seed Fund", type: "Funding", value: "Up to ₹20 Lakhs grant" },
          { title: "Mudra Loan Yojana (Shishu/Kishore)", type: "Credit", value: "Collateral free loans to ₹10 Lakhs" }
        ];
      case "farmer":
        return [
          { title: "PM Kisan Samman Nidhi", type: "Direct Benefit", value: "₹6,000 / year support" },
          { title: "Pradhan Mantri Fasal Bima Yojana", type: "Insurance", value: "Subsidized crop insurance" }
        ];
      case "women entrepreneur":
        return [
          { title: "Standup India Scheme", type: "Loan", value: "₹10 Lakh to ₹1 Crore project loan" },
          { title: "Mahila Co-operative Bank Grants", type: "Subsidy", value: "Interest concession benefits" }
        ];
      default:
        return [
          { title: "PM Awas Yojana (Subsidized Home Loans)", type: "Subsidy", value: "Interest subsidy up to 6.5%" },
          { title: "Ayushman Bharat Card Registration", type: "Health Insurance", value: "Free treatment up to ₹5 Lakhs" }
        ];
    }
  };

  const opportunities = getStageOpportunities(selectedStage);

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Life Event Assistant</h1>
        <p className="text-sm text-ink-700/60 dark:text-mist-200/60">
          Step-by-step roadmap planner, matching benefits, and AI guidance for citizen milestones
        </p>
      </div>

      {/* Grid: 8 visual life events */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {LIFE_STAGES.map((stage) => {
          const Icon = stage.icon;
          const isSelected = selectedStage === stage.id;
          return (
            <button
              key={stage.id}
              onClick={() => {
                setSelectedStage(stage.id);
                void generateChecklist(stage.id, details);
              }}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 ${
                isSelected
                  ? "bg-leaf-600 text-white shadow-soft border-leaf-500/20 translate-x-0.5"
                  : "border-ink-900/5 bg-mist-50/50 hover:bg-white dark:border-white/5 dark:bg-ink-800/40 hover:-translate-y-0.5"
              }`}
            >
              <Icon size={20} className={isSelected ? "text-white" : "text-leaf-600 dark:text-leaf-400"} />
              <h3 className="font-bold text-xs mt-3 tracking-tight">{stage.label}</h3>
              <p className={`text-[10px] mt-1 leading-snug line-clamp-2 ${isSelected ? "text-white/80" : "opacity-60"}`}>
                {stage.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Details Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void generateChecklist(selectedStage, details);
        }}
        className="panel space-y-3"
      >
        <label className="label">Add Personal Details (State, Age, Income...)</label>
        <textarea
          className="input min-h-20 text-xs font-semibold leading-relaxed"
          placeholder="e.g., I live in Gujarat, have a family income of 3 Lakhs, and want to apply for a post-matric scholarship."
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
        <button className="btn-primary py-2 px-5 text-xs flex items-center gap-2" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" size={12} /> : null}
          Generate Custom Roadmap & Deadlines
        </button>
      </form>

      {/* Main Results Split Screen */}
      {(plan || loading) && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Timeline & Roadmap (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <div className="panel flex items-center justify-center p-12">
                <Loader2 className="animate-spin text-leaf-500" />
              </div>
            ) : (
              plan && (
                <section className="panel space-y-6">
                  <div>
                    <h2 className="font-display text-2xl font-bold">{plan.title}</h2>
                    <p className="text-xs opacity-70 mt-1 leading-relaxed">{plan.summary}</p>
                  </div>

                  {/* Roadmap Timeline */}
                  <div className="relative border-l-2 border-mist-100 dark:border-white/5 pl-6 ml-2.5 space-y-6 pt-2">
                    {plan.checklist.map((c, i) => (
                      <div key={i} className="relative group">
                        {/* Circular Index */}
                        <div className="absolute -left-[35px] top-0 h-6 w-6 rounded-full bg-leaf-600 border-2 border-white dark:border-ink-950 flex items-center justify-center text-[10px] font-bold text-white shadow-soft">
                          {i + 1}
                        </div>
                        <div className="bg-mist-50/50 dark:bg-black/10 p-3.5 rounded-2xl border border-ink-900/5 dark:border-white/5">
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="font-bold text-xs text-ink-950 dark:text-mist-50">{c.step}</h4>
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border shrink-0 ${
                              c.priority.toLowerCase().includes("high")
                                ? "bg-red-500/10 text-red-600 border-red-500/25"
                                : "bg-saffron-500/10 text-saffron-600 border-saffron-500/25"
                            }`}>
                              {c.priority}
                            </span>
                          </div>

                          {/* Required Documents check list */}
                          {c.documents && c.documents.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-ink-900/5 dark:border-white/5">
                              <p className="text-[9px] font-bold uppercase tracking-wider opacity-40 mb-1">Required Documents</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {c.documents.map((doc, idx) => {
                                  const hasIt = hasDoc(doc);
                                  return (
                                    <span
                                      key={idx}
                                      className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${
                                        hasIt
                                          ? "bg-leaf-500/10 text-leaf-700 dark:text-leaf-400 border-leaf-500/20"
                                          : "bg-red-500/10 text-red-600 border-red-500/20"
                                      }`}
                                    >
                                      {doc} {hasIt ? "✓" : "✗"}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )
            )}
          </div>

          {/* Right Column: Opportunities & AI Guidance (1/3 width) */}
          <div className="space-y-6">
            {/* Matching Opportunities Card */}
            <section className="panel">
              <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                <Briefcase size={16} className="text-leaf-500" />
                Opportunities & Benefits
              </h3>
              <div className="space-y-3">
                {opportunities.map((opp, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-ink-900/5 bg-mist-50/50 dark:border-white/5 dark:bg-ink-800/40 text-xs font-semibold">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-saffron-600 dark:text-saffron-400">
                      {opp.type}
                    </span>
                    <h4 className="font-bold text-xs mt-0.5">{opp.title}</h4>
                    <p className="text-[10px] text-leaf-600 dark:text-leaf-400 mt-1 font-bold">{opp.value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* AI Stage Advisor */}
            <section className="panel">
              <h3 className="font-display text-lg font-bold mb-1 flex items-center gap-2">
                <Sparkles size={16} className="text-leaf-500" />
                AI Event Advisor
              </h3>
              <p className="text-[10px] opacity-60 mb-4 leading-relaxed">
                Ask specific legal, financial, or registration questions about this stage:
              </p>

              <div className="space-y-3">
                {/* Prefilled Prompt Chips */}
                <div className="flex flex-wrap gap-1">
                  {[
                    `Documents for ${selectedStage}?`,
                    `Deadlines for ${selectedStage}?`
                  ].map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setAiQuestion(p);
                        void askAiGuidance(p);
                      }}
                      className="text-[9px] font-bold bg-mist-100 hover:bg-mist-200 dark:bg-ink-800 dark:hover:bg-ink-700 px-2 py-0.5 rounded-lg border border-ink-900/5 dark:border-white/5 transition"
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <div className="flex gap-1.5 mt-2">
                  <input
                    type="text"
                    placeholder="Ask Advisor..."
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    className="input py-1.5 px-2.5 text-xs rounded-xl flex-1 bg-mist-50 dark:bg-ink-800 border border-ink-900/10"
                  />
                  <button
                    type="button"
                    onClick={() => askAiGuidance(aiQuestion)}
                    className="btn-primary py-1.5 px-3 text-[11px] rounded-xl shrink-0"
                    disabled={aiLoading}
                  >
                    Ask
                  </button>
                </div>

                {/* Advisor Answer Panel */}
                {aiAnswer && (
                  <div className="mt-3 bg-mist-50/50 dark:bg-black/10 border border-ink-900/5 dark:border-white/5 p-3 rounded-2xl text-[10px] leading-relaxed">
                    <p className="font-bold uppercase tracking-wider opacity-40 mb-1">AI Recommendation</p>
                    <p className="opacity-95 max-h-36 overflow-y-auto pr-1">{aiAnswer}</p>
                  </div>
                )}
                {aiLoading && (
                  <div className="mt-3 flex items-center justify-center p-4">
                    <Loader2 className="animate-spin text-leaf-500" size={14} />
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

