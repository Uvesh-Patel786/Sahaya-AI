import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Calendar,
  AlertCircle,
  Bell,
  BellOff,
  CheckCircle,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  CalendarDays,
  Loader2,
} from "lucide-react";

type Deadline = {
  _id: string;
  title: string;
  dueDate: string;
  type: string;
  status: string;
};

export function DeadlinesPage() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [enabledReminders, setEnabledReminders] = useState<string[]>(() => {
    const saved = localStorage.getItem("sahayak_reminders");
    return saved ? JSON.parse(saved) : [];
  });

  // Fetch deadlines
  const { data, isLoading } = useQuery({
    queryKey: ["deadlines"],
    queryFn: () => api<{ deadlines: Deadline[] }>("/deadlines"),
  });

  // Mutations
  const create = useMutation({
    mutationFn: () =>
      api("/deadlines", {
        method: "POST",
        body: JSON.stringify({ title, dueDate: new Date(dueDate).toISOString(), type: "custom" }),
      }),
    onSuccess: () => {
      setTitle("");
      setDueDate("");
      qc.invalidateQueries({ queryKey: ["deadlines"] });
      qc.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });

  const markDone = useMutation({
    mutationFn: (id: string) =>
      api(`/deadlines/${id}`, { method: "PATCH", body: JSON.stringify({ status: "done" }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deadlines"] });
      qc.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });

  const toggleReminder = (id: string) => {
    setEnabledReminders((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem("sahayak_reminders", JSON.stringify(next));
      return next;
    });
  };

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    create.mutate();
  }

  // Chronological Grouping
  const getGroupedDeadlines = () => {
    const groups: Record<string, Deadline[]> = {
      Overdue: [],
      Today: [],
      Tomorrow: [],
      "This Week": [],
      "This Month": [],
      Later: [],
      Completed: [],
    };

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const list = data?.deadlines || [];
    list.forEach((d) => {
      if (d.status === "done") {
        groups["Completed"].push(d);
        return;
      }

      const due = new Date(d.dueDate);
      due.setHours(0, 0, 0, 0);

      const diffTime = due.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        groups["Overdue"].push(d);
      } else if (diffDays === 0) {
        groups["Today"].push(d);
      } else if (diffDays === 1) {
        groups["Tomorrow"].push(d);
      } else if (diffDays > 1 && diffDays <= 7) {
        groups["This Week"].push(d);
      } else if (diffDays > 7 && diffDays <= 30) {
        groups["This Month"].push(d);
      } else {
        groups["Later"].push(d);
      }
    });

    return groups;
  };

  const grouped = getGroupedDeadlines();

  const groupMeta = [
    { key: "Overdue", color: "text-red-600 dark:text-red-400 border-red-500/25 bg-red-500/5", icon: AlertCircle },
    { key: "Today", color: "text-saffron-600 dark:text-saffron-400 border-saffron-500/25 bg-saffron-500/5", icon: Clock },
    { key: "Tomorrow", color: "text-saffron-500 border-saffron-500/20 bg-saffron-500/5", icon: Clock },
    { key: "This Week", color: "text-leaf-600 dark:text-leaf-400 border-leaf-500/20 bg-leaf-500/5", icon: CalendarDays },
    { key: "This Month", color: "text-blue-600 dark:text-blue-400 border-blue-500/20 bg-blue-500/5", icon: Calendar },
    { key: "Later", color: "text-ink-700/60 dark:text-mist-200/60 border-ink-900/5 bg-mist-50/10", icon: Calendar },
    { key: "Completed", color: "text-leaf-600 dark:text-leaf-400 border-leaf-500/20 bg-leaf-500/5", icon: CheckCircle2 },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">Timeline & Deadlines</h1>
          <p className="text-sm text-ink-700/60 dark:text-mist-200/60">
            Never miss a subsidy window, scholarship deadline, or ID card renewal
          </p>
        </div>
      </div>

      {/* Add reminder inline form */}
      <form onSubmit={onSubmit} className="panel flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 w-full">
          <label className="label">Reminder/Event Title</label>
          <input
            className="input text-xs font-semibold"
            placeholder="e.g. Renew Domicile Certificate"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="w-full sm:w-[180px]">
          <label className="label">Due Date</label>
          <input
            className="input text-xs font-semibold"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        </div>
        <button className="btn-primary w-full sm:w-auto py-2.5 px-6 text-xs flex items-center gap-1.5 shrink-0">
          <Plus size={14} />
          Add Schedule
        </button>
      </form>

      {/* Chronological timeline column listing */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="animate-spin text-leaf-500" />
          </div>
        ) : (
          groupMeta.map((group) => {
            const list = grouped[group.key] || [];
            if (list.length === 0) return null;
            const Icon = group.icon;

            return (
              <section key={group.key} className="space-y-3">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-bold text-xs w-fit ${group.color}`}>
                  <Icon size={14} />
                  <span>{group.key} ({list.length})</span>
                </div>

                <div className="grid gap-3">
                  {list.map((d) => {
                    const isReminderOn = enabledReminders.includes(d._id);
                    return (
                      <article
                        key={d._id}
                        className={`panel p-4 flex flex-wrap items-center justify-between gap-3 hover:border-leaf-500/10 transition-all duration-200 ${
                          d.status === "done" ? "opacity-60 bg-mist-50/20" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {d.status !== "done" ? (
                            <button
                              onClick={() => markDone.mutate(d._id)}
                              className="h-5 w-5 rounded-full border border-ink-900/15 dark:border-white/15 hover:border-leaf-500 flex items-center justify-center mt-0.5 shrink-0 transition"
                              title="Mark as done"
                            >
                              <span className="h-2.5 w-2.5 rounded-full hover:bg-leaf-500" />
                            </button>
                          ) : (
                            <CheckCircle className="text-leaf-600 dark:text-leaf-400 mt-0.5 shrink-0" size={18} />
                          )}
                          <div className="min-w-0">
                            <p className={`font-bold text-sm leading-snug ${d.status === "done" ? "line-through opacity-70" : ""}`}>
                              {d.title}
                            </p>
                            <p className="text-[10px] opacity-60 font-semibold mt-1 flex items-center gap-1.5">
                              <Calendar size={11} />
                              Due: {new Date(d.dueDate).toLocaleDateString()} · {d.type}
                            </p>
                          </div>
                        </div>

                        {d.status !== "done" && (
                          <div className="flex items-center gap-2">
                            {/* Reminder Alarm Bell toggle */}
                            <button
                              onClick={() => toggleReminder(d._id)}
                              className={`p-2 rounded-xl border transition ${
                                isReminderOn
                                  ? "bg-leaf-600/10 text-leaf-700 dark:text-leaf-400 border-leaf-500/25"
                                  : "border-ink-900/5 hover:border-leaf-500/20 dark:border-white/10"
                              }`}
                              title={isReminderOn ? "Reminders active" : "Enable email reminder"}
                            >
                              {isReminderOn ? <Bell size={14} className="animate-bounce" /> : <BellOff size={14} className="opacity-60" />}
                            </button>
                            <button
                              onClick={() => markDone.mutate(d._id)}
                              className="btn-ghost py-1.5 px-3 rounded-xl text-xs"
                            >
                              Mark Done
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}

