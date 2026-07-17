import { FormEvent, useEffect, useRef, useState } from "react";
import { Mic, Volume2, Send, Plus, FileUp, Loader2, MessageSquare, Sparkles, VolumeX } from "lucide-react";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Msg = { role: "user" | "assistant"; content: string; sources?: Array<{ title: string; source: string; url?: string }> };
type ChatSessionMeta = { _id: string; title: string; updatedAt: string };

export function ChatPage() {
  const qc = useQueryClient();
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Namaste. I am Sahayak. Ask me about government schemes, documents, or how to navigate life events. I will cross-reference your query with official sources and your Digital Twin profile.",
    },
  ]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("en");
  const [sessionId, setSessionId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch past sessions
  const { data: sessionsData, refetch: refetchSessions } = useQuery({
    queryKey: ["chat-sessions"],
    queryFn: () => api<{ sessions: ChatSessionMeta[] }>("/chat/sessions"),
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Load selected session
  const loadSession = async (id: string) => {
    setLoading(true);
    try {
      const data = await api<{ session: { messages: Msg[] } }>(`/chat/sessions/${id}`);
      setSessionId(id);
      if (data.session.messages.length > 0) {
        setMessages(data.session.messages);
      }
    } catch (err) {
      alert("Failed to load session: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Start a new session
  const startNewChat = () => {
    setSessionId(undefined);
    setMessages([
      {
        role: "assistant",
        content:
          "Namaste. I am Sahayak. Ask me about government schemes, documents, or how to navigate life events. I will cross-reference your query with official sources and your Digital Twin profile.",
      },
    ]);
  };

  async function send(text: string) {
    if (!text.trim()) return;
    // Add user message locally
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    try {
      const data = await api<{ reply: string; sources: Msg["sources"]; sessionId: string }>("/chat", {
        method: "POST",
        body: JSON.stringify({ message: text, language, sessionId }),
      });
      setSessionId(data.sessionId);
      setMessages((m) => [...m, { role: "assistant", content: data.reply, sources: data.sources }]);
      void refetchSessions();
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `Sorry, there was an issue processing your request: ${(err as Error).message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  function startVoice() {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) {
      alert("Speech recognition is not supported in this browser. Try Chrome.");
      return;
    }
    const rec = new SR();
    rec.lang = language === "hi" ? "hi-IN" : language === "gu" ? "gu-IN" : "en-IN";
    rec.onresult = (ev: any) => {
      const text = ev.results[0][0].transcript;
      void send(text);
    };
    rec.start();
  }

  async function speak(text: string) {
    if (speaking === text) {
      speechSynthesis.cancel();
      setSpeaking(null);
      return;
    }
    speechSynthesis.cancel();
    setSpeaking(text);
    try {
      const res = await fetch("/api/speech/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("sahayak_access")}`,
        },
        body: JSON.stringify({ text: text.slice(0, 400), language }),
      });
      if (res.ok && res.headers.get("content-type")?.includes("audio")) {
        const blob = await res.blob();
        const audio = new Audio(URL.createObjectURL(blob));
        audio.onended = () => setSpeaking(null);
        void audio.play();
        return;
      }
    } catch {
      // browser fallback
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = language === "hi" ? "hi-IN" : language === "gu" ? "gu-IN" : "en-IN";
    u.onend = () => setSpeaking(null);
    speechSynthesis.speak(u);
  }

  // File upload logic
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    const form = new FormData();
    form.append("file", file);

    try {
      // 1. Upload to vault
      const uploadRes = await api<{ document: { _id: string; originalName: string } }>("/documents/upload", {
        method: "POST",
        form,
      });

      // 2. Perform AI analysis
      const analysisRes = await api<{ document: { originalName: string; analysisSummary?: string } }>(
        `/documents/${uploadRes.document._id}/analyze`,
        { method: "POST" }
      );

      const summary = analysisRes.document.analysisSummary || "The document was parsed successfully.";
      const promptText = `I have uploaded my document "${file.name}" to my vault. The AI parsed it and extracted: "${summary}". How does this impact my scheme eligibility and what should I do next?`;
      void send(promptText);
    } catch (err) {
      alert("Failed to upload and analyze document: " + (err as Error).message);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const suggestedPrompts = [
    { text: "Which schemes am I eligible for?", icon: LandmarkIcon },
    { text: "I lost my Aadhaar card.", icon: FileUpIcon },
    { text: "How do I apply for a Passport?", icon: Sparkles },
    { text: "I want to start a business.", icon: BriefcaseIcon },
    { text: "What documents do I need for scholarships?", icon: BookmarkIcon },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 h-[calc(100vh-7.5rem)] min-h-[500px]">
      {/* Sessions History Sidebar */}
      <aside className="panel flex flex-col h-full overflow-hidden p-4 hidden lg:flex">
        <button
          onClick={startNewChat}
          className="btn-primary w-full flex items-center justify-center gap-2 mb-4 py-2 text-xs"
        >
          <Plus size={14} />
          New Assistant Chat
        </button>
        <p className="text-[10px] font-bold uppercase tracking-wider opacity-40 mb-2">Previous Chats</p>
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {(sessionsData?.sessions || []).map((s) => (
            <button
              key={s._id}
              onClick={() => loadSession(s._id)}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold truncate hover:bg-mist-100 dark:hover:bg-white/5 flex items-center gap-2 transition-all ${
                sessionId === s._id ? "bg-leaf-600/10 text-leaf-700 dark:text-leaf-400 border border-leaf-500/20" : ""
              }`}
            >
              <MessageSquare size={13} className="shrink-0 opacity-60" />
              <span className="truncate">{s.title || "Untiled Chat"}</span>
            </button>
          ))}
          {!(sessionsData?.sessions?.length) && (
            <p className="text-xs opacity-50 p-2 italic">No chat history yet.</p>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-2">
              <Sparkles className="text-leaf-500 animate-pulse" size={24} />
              Ask Sahayak AI
            </h1>
            <p className="text-xs opacity-60 font-medium">Production-grade Citizen RAG Assistant</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={startNewChat}
              className="lg:hidden btn-ghost p-2 rounded-xl"
              title="New Chat"
            >
              <Plus size={16} />
            </button>
            <select
              className="input w-auto text-xs py-1.5 px-3 font-semibold rounded-xl bg-white dark:bg-ink-800"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="hi">Hindi (हिंदी)</option>
              <option value="gu">Gujarati (ગુજરાતી)</option>
            </select>
          </div>
        </div>

        {/* Viewport panel */}
        <div className="panel flex-1 flex flex-col justify-between overflow-hidden relative">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-leaf-600 text-white shadow-soft"
                      : "bg-mist-50 dark:bg-ink-800 border border-ink-900/5 dark:border-white/5"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  {/* Sources display */}
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-3 border-t border-black/10 pt-2 dark:border-white/10">
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Verified Sources</p>
                      <ul className="mt-1.5 space-y-1 text-xs opacity-80">
                        {m.sources.map((s, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <span className="h-1 w-1 bg-leaf-500 rounded-full shrink-0" />
                            {s.url ? (
                              <a className="underline hover:text-leaf-500 font-semibold" href={s.url} target="_blank" rel="noreferrer">
                                {s.title}
                              </a>
                            ) : (
                              <span className="font-semibold">{s.title} — {s.source}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Audio read-aloud */}
                  {m.role === "assistant" && (
                    <button
                      className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold opacity-70 hover:opacity-100 transition-all text-leaf-600 dark:text-leaf-400"
                      onClick={() => speak(m.content)}
                    >
                      {speaking === m.content ? <VolumeX size={13} /> : <Volume2 size={13} />}
                      {speaking === m.content ? "Mute" : "Listen Response"}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Loading / Thinking spinner */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-mist-50 dark:bg-ink-800 rounded-2xl px-4 py-3 text-sm flex items-center gap-2.5 border border-ink-900/5 dark:border-white/5 opacity-70">
                  <Loader2 className="animate-spin text-leaf-500" size={16} />
                  <span>AI is searching national knowledge base & matching digital twin...</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Prompts Suggestions overlay for empty chats */}
          {messages.length === 1 && !loading && (
            <div className="absolute inset-x-4 top-4 bottom-16 pointer-events-none flex flex-col justify-center items-center text-center p-4">
              <div className="max-w-md pointer-events-auto bg-white/40 dark:bg-black/10 p-5 rounded-3xl backdrop-blur-sm border border-ink-900/5 dark:border-white/5">
                <Sparkles className="text-leaf-500 mx-auto mb-2" size={28} />
                <h3 className="font-display font-extrabold text-lg">AI Citizens Portal</h3>
                <p className="text-xs opacity-60 mt-1 mb-4">Click one of the custom prompts below to start analyzing your options</p>
                <div className="flex flex-col gap-2">
                  {suggestedPrompts.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => send(p.text)}
                      className="w-full text-left p-3 rounded-xl bg-white hover:bg-mist-50 dark:bg-ink-900 dark:hover:bg-ink-800 border border-ink-900/5 dark:border-white/5 text-xs font-semibold flex items-center gap-2.5 hover:border-leaf-500/30 transition-all"
                    >
                      <p.icon size={14} className="text-leaf-600 dark:text-leaf-400 shrink-0" />
                      <span>{p.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={onSubmit} className="mt-4 pt-3 border-t border-ink-900/5 dark:border-white/10 flex gap-2 items-center">
            {/* Document Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,application/pdf,.txt"
            />
            <button
              type="button"
              disabled={uploadingFile}
              onClick={() => fileInputRef.current?.click()}
              className="btn-ghost p-3 rounded-xl border-ink-900/10 hover:border-leaf-500/30 shrink-0 relative"
              title="Upload official letter / ID card to analyze"
            >
              {uploadingFile ? <Loader2 className="animate-spin" size={18} /> : <FileUp size={18} />}
            </button>

            {/* Voice Input Button */}
            <button
              type="button"
              className="btn-ghost p-3 rounded-xl border-ink-900/10 hover:border-leaf-500/30 shrink-0"
              onClick={startVoice}
              title="Voice assistant input"
              aria-label="Voice input"
            >
              <Mic size={18} />
            </button>

            {/* Text Input */}
            <input
              className="input flex-1 py-3 px-4 rounded-xl border-ink-900/10 font-medium"
              placeholder="Ask about passport, schemes, scholarship document requirements..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading || uploadingFile}
            />

            {/* Send Button */}
            <button className="btn-primary py-3 px-5 rounded-xl shrink-0" disabled={loading || uploadingFile}>
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Custom icons
function LandmarkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="2" y1="22" x2="22" y2="22"></line><line x1="4" y1="11" x2="20" y2="11"></line><path d="M5 11v11"></path><path d="M19 11v11"></path><path d="M12 2v9"></path><path d="M9 11v11"></path><path d="M15 11v11"></path></svg>
  );
}

function FileUpIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><outline x1="12" y1="18" x2="12" y2="12"></outline><polyline points="9 15 12 12 15 15"></polyline></svg>
  );
}

function BriefcaseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
  );
}

function BookmarkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
  );
}

