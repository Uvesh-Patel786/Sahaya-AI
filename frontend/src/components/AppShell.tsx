import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  MessageSquare,
  Landmark,
  CalendarHeart,
  FolderLock,
  Siren,
  ShieldAlert,
  AlarmClock,
  Settings,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Sparkles,
  Send,
  Mic,
  Volume2,
  ChevronUp,
  User,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";

const links = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/chat", label: "Ask Sahayak AI", icon: MessageSquare },
  { to: "/app/schemes", label: "Schemes", icon: Landmark },
  { to: "/app/documents", label: "Documents", icon: FolderLock },
  { to: "/app/life-events", label: "Life Events", icon: CalendarHeart },
  { to: "/app/civic", label: "Civic Reports", icon: Siren },
  { to: "/app/scam", label: "Scam Detector", icon: ShieldAlert },
  { to: "/app/deadlines", label: "Timeline & Deadlines", icon: AlarmClock },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showFloatingAi, setShowFloatingAi] = useState(false);

  // Floating AI State
  const [aiMessages, setAiMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { role: "assistant", content: "Namaste! I am Sahayak AI. How can I help you today?" }
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSessionId, setAiSessionId] = useState<string>();
  const aiChatEndRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showFloatingAi) {
      aiChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiMessages, showFloatingAi]);

  // Click outside to close profile dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSendAiMessage = async (text: string) => {
    if (!text.trim()) return;
    setAiMessages(prev => [...prev, { role: "user", content: text }]);
    setAiInput("");
    setAiLoading(true);

    try {
      const res = await api<{ reply: string; sessionId: string }>("/chat", {
        method: "POST",
        body: JSON.stringify({ message: text, language: "en", sessionId: aiSessionId }),
      });
      setAiSessionId(res.sessionId);
      setAiMessages(prev => [...prev, { role: "assistant", content: res.reply }]);
    } catch (err) {
      setAiMessages(prev => [...prev, { role: "assistant", content: `Error: ${(err as Error).message}` }]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleVoiceInput = () => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    const rec = new SR();
    rec.lang = "en-IN";
    rec.onresult = (ev: any) => {
      const text = ev.results[0][0].transcript;
      void handleSendAiMessage(text);
    };
    rec.start();
  };

  const speakText = (text: string) => {
    const u = new SpeechSynthesisUtterance(text.slice(0, 300));
    u.lang = "en-IN";
    speechSynthesis.speak(u);
  };

  return (
    <div className="min-h-screen bg-app-light text-ink-950 dark:bg-hero-grid dark:text-mist-50">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-ink-900/5 bg-white/90 p-4 backdrop-blur transition dark:border-white/10 dark:bg-ink-950/90 lg:static lg:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          } flex flex-col justify-between`}
        >
          <div>
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="font-display text-2xl font-bold tracking-tight bg-gradient-to-r from-leaf-600 to-saffron-500 bg-clip-text text-transparent">
                  Sahayak AI
                </p>
                <p className="text-xs text-ink-700/60 dark:text-mist-200/60 font-semibold tracking-wider uppercase">
                  Citizen Operating System
                </p>
              </div>
              <button className="lg:hidden text-ink-700 dark:text-mist-200" onClick={() => setOpen(false)} aria-label="Close menu">
                <X size={18} />
              </button>
            </div>

            <nav className="space-y-1">
              {links.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-leaf-600 text-white shadow-soft translate-x-1"
                        : "text-ink-700 hover:bg-mist-100 dark:text-mist-200 dark:hover:bg-white/5"
                    }`
                  }
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* User profile section at the bottom-left */}
          <div className="relative mt-auto pt-4 border-t border-ink-900/5 dark:border-white/10" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center justify-between w-full p-2 rounded-xl transition hover:bg-mist-100 dark:hover:bg-white/5 text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-leaf-500 to-saffron-500 flex items-center justify-center text-white font-bold">
                  {user?.name ? user.name[0].toUpperCase() : "U"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{user?.name || "Citizen"}</p>
                  <p className="truncate text-xs opacity-60">{user?.email}</p>
                </div>
              </div>
              <ChevronUp size={16} className={`opacity-60 transition-transform ${showProfileMenu ? "rotate-180" : ""}`} />
            </button>

            {/* Profile Dropdown Menu */}
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-16 left-0 right-0 z-50 rounded-2xl border border-ink-900/5 bg-white p-2 shadow-soft dark:border-white/10 dark:bg-ink-900"
                >
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate("/app/settings");
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium rounded-xl hover:bg-mist-50 dark:hover:bg-white/5"
                  >
                    <Settings size={16} className="opacity-70" />
                    Digital Twin Settings
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium rounded-xl hover:bg-red-500/10 text-red-600 dark:text-red-400"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>

        {/* Content Wrapper */}
        <div className="flex min-w-0 flex-1 flex-col relative">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-900/5 bg-white/70 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-ink-950/60">
            <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="text-saffron-500 animate-pulse" size={16} />
              <span className="hidden sm:inline bg-gradient-to-r from-ink-950 to-ink-700 dark:from-mist-50 dark:to-mist-200 bg-clip-text text-transparent">
                Making Government Services Simple for Everyone
              </span>
            </div>
            <button className="btn-ghost p-2 rounded-xl" onClick={toggle} aria-label="Toggle theme">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </header>
          <motion.main
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex-1 p-4 md:p-8"
          >
            <Outlet />
          </motion.main>
        </div>
      </div>

      {/* Backdrop for mobile menu */}
      {open && (
        <button
          className="fixed inset-0 z-30 bg-ink-950/40 lg:hidden"
          aria-label="Close overlay"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Floating AI Assistant Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowFloatingAi(!showFloatingAi)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-leaf-500 to-leaf-600 text-white shadow-soft hover:scale-105 active:scale-95 transition-all duration-200 group"
          aria-label="Ask Sahayak AI Assistant"
        >
          {showFloatingAi ? <X size={24} /> : <Sparkles className="h-6 w-6 group-hover:rotate-12 transition-transform" />}
          {!showFloatingAi && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-saffron-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-saffron-500"></span>
            </span>
          )}
        </button>
      </div>

      {/* Floating Assistant Drawer */}
      <AnimatePresence>
        {showFloatingAi && (
          <motion.div
            initial={{ opacity: 0, x: 100, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, y: 50, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-50 w-[90vw] sm:w-[400px] h-[500px] rounded-3xl border border-ink-900/5 bg-white/95 shadow-soft backdrop-blur-md dark:border-white/10 dark:bg-ink-950/95 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-ink-900/5 dark:border-white/10 bg-gradient-to-r from-leaf-600/10 to-saffron-500/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-leaf-600 flex items-center justify-center text-white">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Ask Sahayak AI</h3>
                  <p className="text-xs opacity-60">Digital Twin Assistant</p>
                </div>
              </div>
              <button
                onClick={() => setShowFloatingAi(false)}
                className="p-1 rounded-lg hover:bg-mist-100 dark:hover:bg-white/5 opacity-60 hover:opacity-100 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {aiMessages.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                      m.role === "user"
                        ? "bg-leaf-600 text-white"
                        : "bg-mist-100 dark:bg-ink-800 text-ink-950 dark:text-mist-50"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    {m.role === "assistant" && (
                      <button
                        onClick={() => speakText(m.content)}
                        className="mt-1.5 flex items-center gap-1 opacity-60 hover:opacity-100 transition"
                      >
                        <Volume2 size={10} /> Listen
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-mist-100 dark:bg-ink-800 rounded-2xl px-3.5 py-2 text-xs opacity-60 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-leaf-500 animate-bounce"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-leaf-500 animate-bounce delay-75"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-leaf-500 animate-bounce delay-150"></span>
                  </div>
                </div>
              )}
              <div ref={aiChatEndRef} />
            </div>

            {/* Quick Prompts Suggestions */}
            {aiMessages.length === 1 && (
              <div className="px-4 py-2 border-t border-ink-900/5 dark:border-white/10 bg-mist-50/50 dark:bg-black/10">
                <p className="text-[10px] uppercase font-bold opacity-40 mb-1.5">Suggested Questions</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Eligible schemes?",
                    "Lost my Aadhaar",
                    "Apply for Passport"
                  ].map((p, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendAiMessage(p)}
                      className="text-[10px] font-medium bg-white dark:bg-ink-800 border border-ink-900/5 dark:border-white/5 rounded-lg px-2.5 py-1 hover:border-leaf-500 dark:hover:border-leaf-400 transition"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendAiMessage(aiInput);
              }}
              className="p-3 border-t border-ink-900/5 dark:border-white/10 flex gap-1.5 items-center bg-white dark:bg-ink-950"
            >
              <button
                type="button"
                onClick={handleVoiceInput}
                className="p-2 rounded-xl text-ink-700 hover:bg-mist-100 dark:text-mist-200 dark:hover:bg-white/5 transition"
              >
                <Mic size={16} />
              </button>
              <input
                type="text"
                placeholder="Ask about schemes, help..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                className="flex-1 bg-mist-50 dark:bg-ink-800 border border-ink-900/5 dark:border-white/5 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-leaf-500/30"
              />
              <button
                disabled={aiLoading}
                className="p-2 rounded-xl bg-leaf-600 text-white hover:bg-leaf-700 disabled:opacity-50 transition"
              >
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

