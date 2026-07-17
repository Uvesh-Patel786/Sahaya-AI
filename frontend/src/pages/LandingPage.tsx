import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Languages, MapPin } from "lucide-react";

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-hero-grid text-mist-50">
      <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2760%27 height=%2760%27 viewBox=%270 0 60 60%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cg fill=%27none%27 fill-rule=%27evenodd%27%3E%3Cg fill=%27%23ffffff%27 fill-opacity=%270.03%27%3E%3Cpath d=%27M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%27/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <p className="font-display text-2xl font-bold md:text-3xl">Sahayak AI</p>
        <div className="flex gap-3">
          <Link to="/login" className="btn-ghost border-white/15 bg-white/5 text-mist-50">
            Sign in
          </Link>
          <Link to="/register" className="btn-primary">
            Get started
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-6xl gap-10 px-6 pb-24 pt-10 md:grid-cols-[1.1fr_0.9fr] md:items-end md:pt-16">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl"
          >
            Sahayak AI
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-5 max-w-xl text-xl text-mist-100/85 md:text-2xl"
          >
            Making Government Services Simple for Everyone.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-4 max-w-lg text-sm leading-relaxed text-mist-200/70 md:text-base"
          >
            Your AI operating system for schemes, documents, civic reports, scam checks, and life-event
            guidance—grounded in official knowledge.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link to="/register" className="btn-primary">
              Open Citizen OS <ArrowRight size={16} />
            </Link>
            <a href="#capabilities" className="btn-ghost border-white/15 bg-white/5 text-mist-50">
              Explore capabilities
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative min-h-[320px] overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-leaf-600/30 via-ink-800/40 to-saffron-600/25 p-6 shadow-soft"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(61,220,151,0.35),transparent_45%)]" />
          <div className="relative space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] text-mist-200/60">Live companion</p>
            <p className="font-display text-3xl font-semibold">Digital Twin + RAG Chat</p>
            <div className="space-y-3 text-sm text-mist-100/80">
              <div className="rounded-2xl bg-ink-950/40 p-4 backdrop-blur">
                “Which scholarships am I eligible for in Gujarat?”
              </div>
              <div className="rounded-2xl border border-leaf-400/30 bg-leaf-600/20 p-4">
                Matched NSP schemes with citations and a confidence score—then set Deadline Guardian
                reminders.
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section id="capabilities" className="relative z-10 border-t border-white/10 bg-ink-950/50 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "Trustworthy answers",
              body: "RAG over curated government knowledge with source citations.",
            },
            {
              icon: Languages,
              title: "Multilingual access",
              body: "English, Hindi, and Gujarati chat with voice-ready interfaces.",
            },
            {
              icon: MapPin,
              title: "Civic action",
              body: "Photo + map issue reports with AI classification and tracking IDs.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <item.icon className="mb-4 text-leaf-400" />
              <h2 className="font-display text-xl font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-mist-200/70">{item.body}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
