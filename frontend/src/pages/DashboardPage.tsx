import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "react-router-dom"; // Note: we'll use motion from framer-motion instead
import { motion as framerMotion } from "framer-motion";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Award,
  Clock,
  FileCheck,
  Activity,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Sparkles,
  Calendar,
  Zap,
  MessageSquare,
  Upload,
  Siren,
  ShieldAlert,
} from "lucide-react";

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["recommendations"],
    queryFn: () =>
      api<{
        twin: Record<string, unknown> | null;
        schemes: Array<{ _id: string; name: string; description: string }>;
        opportunities: Array<{ _id: string; title: string; type: string }>;
        deadlines: Array<{ _id: string; title: string; dueDate: string; status: string }>;
        insights: string[];
      }>("/twin/recommendations"),
  });

  // Fallbacks if data doesn't load
  const eligibleSchemesCount = data?.schemes?.length ?? 5;
  const pendingDeadlinesCount = data?.deadlines?.filter(d => d.status !== "done").length ?? 2;
  const documentsCountText = "8/10";
  const aiHealthScore = "92%";

  return (
    <div className="space-y-8 pb-10">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-leaf-600 dark:text-leaf-400">
            Citizen Command Center
          </p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight mt-1">
            Hello, {user?.name?.split(" ")[0] || "Priyanshu"} 👋
          </h1>
          <p className="mt-2 text-sm text-ink-700/80 dark:text-mist-200/80 max-w-xl">
            {data?.insights?.[0] || "Your AI Digital Twin has analyzed your profile and prepared personalized recommendations."}
          </p>
        </div>
        <div className="flex items-center gap-2.5 bg-leaf-500/10 text-leaf-700 dark:text-leaf-400 px-4 py-2.5 rounded-2xl border border-leaf-500/20 text-xs font-bold">
          <Sparkles className="animate-spin text-leaf-500" size={16} />
          Digital Twin Synchronized
        </div>
      </div>

      {/* 2. Stats Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Eligible Schemes",
            value: eligibleSchemesCount,
            icon: Award,
            color: "text-leaf-600 dark:text-leaf-400 bg-leaf-600/10",
            to: "/app/schemes",
          },
          {
            label: "Pending Deadlines",
            value: pendingDeadlinesCount,
            icon: Clock,
            color: "text-saffron-600 dark:text-saffron-400 bg-saffron-600/10",
            to: "/app/deadlines",
          },
          {
            label: "Documents Verified",
            value: documentsCountText,
            icon: FileCheck,
            color: "text-blue-600 dark:text-blue-400 bg-blue-600/10",
            to: "/app/documents",
          },
          {
            label: "AI Health Score",
            value: aiHealthScore,
            icon: Activity,
            color: "text-purple-600 dark:text-purple-400 bg-purple-600/10",
            to: "/app/settings",
          },
        ].map((card, i) => (
          <framerMotion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -3 }}
            className="panel relative overflow-hidden group cursor-pointer"
            onClick={() => navigate(card.to)}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider opacity-60">{card.label}</span>
              <div className={`p-2.5 rounded-xl ${card.color}`}>
                <card.icon size={18} />
              </div>
            </div>
            <p className="mt-4 font-display text-3xl font-extrabold">{card.value}</p>
          </framerMotion.div>
        ))}
      </div>

      {/* 3. Citizen Profile Completion & Missing warning */}
      <framerMotion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="panel bg-gradient-to-r from-saffron-500/5 to-leaf-500/5 border border-saffron-500/10"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold">Citizen Profile Completion</span>
              <span className="font-extrabold text-saffron-600 dark:text-saffron-400">92%</span>
            </div>
            <div className="w-full bg-mist-100 dark:bg-ink-800 rounded-full h-3 overflow-hidden">
              <div className="bg-gradient-to-r from-saffron-500 to-leaf-500 h-full rounded-full" style={{ width: "92%" }}></div>
            </div>
            <p className="text-xs text-saffron-600 dark:text-saffron-400 font-semibold flex items-center gap-1.5 pt-1">
              <AlertTriangle size={14} />
              Complete your domicile certificate to unlock 4 more schemes.
            </p>
          </div>
          <button
            onClick={() => navigate("/app/settings")}
            className="btn-ghost self-start md:self-auto hover:bg-leaf-600 hover:text-white border-leaf-500/20 text-leaf-600 dark:text-leaf-400 flex items-center gap-2"
          >
            Complete Profile
            <ArrowRight size={16} />
          </button>
        </div>
      </framerMotion.div>

      {/* Two columns: Left (Recommendations & Timeline), Right (Quick Actions & Recent Docs) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 4. AI Recommendations Section */}
          <section className="panel">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="text-leaf-500" size={20} />
                <h2 className="font-display text-2xl font-bold">Personalized AI Matches</h2>
              </div>
              <Link to="/app/schemes" className="text-xs font-bold text-leaf-600 hover:underline flex items-center gap-1">
                View all schemes <ArrowRight size={12} />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: "National Scholarship Portal",
                  status: "Eligible",
                  statusColor: "bg-leaf-500/10 text-leaf-600 dark:text-leaf-400 border-leaf-500/25",
                  sub: "Apply before August 20",
                  desc: "Financial assistance for post-matric and merit-cum-means students."
                },
                {
                  title: "Startup India Seed Fund",
                  status: "Highly Recommended",
                  statusColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25",
                  sub: "AI Match Score: 98%",
                  desc: "Financial assistance to early stage startups for proof of concept and prototyping."
                },
                {
                  title: "Skill India Mission",
                  status: "Recommended",
                  statusColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25",
                  sub: "AI Match Score: 85%",
                  desc: "Vocational training and placement certifications for young professionals."
                },
                {
                  title: "PM Internship Scheme",
                  status: "Eligible",
                  statusColor: "bg-leaf-500/10 text-leaf-600 dark:text-leaf-400 border-leaf-500/25",
                  sub: "Monthly Stipend: ₹5000",
                  desc: "Gain industry experience with 12 months internships in top Indian corporate groups."
                }
              ].map((rec, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-ink-900/5 bg-mist-50/50 p-4 dark:border-white/5 dark:bg-ink-800/40 flex flex-col justify-between hover:border-leaf-500/20 dark:hover:border-leaf-500/10 transition-all duration-200"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-sm tracking-tight">{rec.title}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${rec.statusColor} shrink-0`}>
                        {rec.status}
                      </span>
                    </div>
                    <p className="text-xs opacity-70 line-clamp-2 mb-3">{rec.desc}</p>
                  </div>
                  <p className="text-[11px] font-semibold text-saffron-600 dark:text-saffron-400 mt-auto">{rec.sub}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 5. Upcoming Timeline Section */}
          <section className="panel">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="text-leaf-500" size={20} />
                <h2 className="font-display text-2xl font-bold">Upcoming Timeline</h2>
              </div>
              <Link to="/app/deadlines" className="text-xs font-bold text-leaf-600 hover:underline flex items-center gap-1">
                Open Schedule <ArrowRight size={12} />
              </Link>
            </div>
            <div className="relative border-l-2 border-mist-100 dark:border-white/5 pl-4 ml-2 space-y-5">
              {[
                { time: "Today", title: "Upload income certificate", desc: "For renewal of post-matric scholarship benefits." },
                { time: "Tomorrow", title: "National Scholarship Deadline", desc: "NSP application portal closing soon." },
                { time: "Next Week", title: "Passport appointment", desc: "Regional Passport Office, 10:30 AM." }
              ].map((item, idx) => (
                <div key={idx} className="relative group">
                  <div className="absolute -left-[23px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-leaf-500 bg-white dark:bg-ink-950 group-hover:scale-125 transition-transform" />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-saffron-600 dark:text-saffron-400">
                        {item.time}
                      </span>
                      <h4 className="font-bold text-sm text-ink-950 dark:text-mist-50 mt-0.5">{item.title}</h4>
                      <p className="text-xs opacity-75 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-6">
          {/* 6. Quick Actions Section */}
          <section className="panel">
            <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
              <Zap size={18} className="text-saffron-500" />
              Quick Actions
            </h2>
            <div className="grid gap-2.5">
              {[
                { label: "Ask AI Assistant", icon: MessageSquare, to: "/app/chat", color: "hover:bg-leaf-500/10 hover:text-leaf-600 hover:border-leaf-500/30" },
                { label: "Apply for Scheme", icon: Award, to: "/app/schemes", color: "hover:bg-purple-500/10 hover:text-purple-600 hover:border-purple-500/30" },
                { label: "Upload Document", icon: Upload, to: "/app/documents", color: "hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/30" },
                { label: "Report Civic Issue", icon: Siren, to: "/app/civic", color: "hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30" },
                { label: "Check Scam Alert", icon: ShieldAlert, to: "/app/scam", color: "hover:bg-yellow-500/10 hover:text-yellow-600 hover:border-yellow-500/30" }
              ].map((action, i) => (
                <button
                  key={i}
                  onClick={() => navigate(action.to)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border border-ink-900/5 bg-mist-50/50 hover:bg-white dark:border-white/5 dark:bg-ink-800/40 dark:hover:bg-ink-800 text-sm font-semibold transition-all duration-200 ${action.color}`}
                >
                  <action.icon size={16} />
                  {action.label}
                </button>
              ))}
            </div>
          </section>

          {/* 7. Recent Documents Section */}
          <section className="panel">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                <FileText size={18} className="text-leaf-500" />
                Recent Vault
              </h2>
              <Link to="/app/documents" className="text-xs font-bold text-leaf-600 hover:underline">
                Manage Vault
              </Link>
            </div>
            <div className="space-y-2.5">
              {[
                { name: "Aadhaar", status: "Verified", color: "bg-leaf-500/10 text-leaf-700 dark:text-leaf-400 border-leaf-500/10", icon: ShieldCheck },
                { name: "PAN Card", status: "Verified", color: "bg-leaf-500/10 text-leaf-700 dark:text-leaf-400 border-leaf-500/10", icon: ShieldCheck },
                { name: "Income Certificate", status: "Pending", color: "bg-saffron-500/10 text-saffron-600 border-saffron-500/10", icon: Clock },
                { name: "Caste Certificate", status: "Missing", color: "bg-red-500/10 text-red-600 border-red-500/10", icon: AlertTriangle }
              ].map((doc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl border border-ink-900/5 bg-mist-50/50 dark:border-white/5 dark:bg-ink-800/40 text-xs font-bold"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <doc.icon size={14} className="opacity-60 shrink-0" />
                    <span className="truncate">{doc.name}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg border ${doc.color} shrink-0 text-[10px]`}>
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

