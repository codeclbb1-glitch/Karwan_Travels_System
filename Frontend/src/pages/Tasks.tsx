import { useState, useMemo, useEffect } from "react";
import {
  Plus, CheckCircle2, Circle, Clock, Trash2,
  ClipboardList, AlertCircle, User, ChevronDown, Pencil,
} from "lucide-react";
import { useApp } from "../context";
import Modal from "../components/Modal";
import { validators, collectErrors, hasErrors, FieldError, inputClass, type FieldErrors } from "../lib/validation";
import { authApi } from "../lib/api";
import type { Task, TaskPriority, TaskStatus } from "../types";

const PRIORITY_META: Record<TaskPriority, { label: string; className: string }> = {
  low:    { label: "Low",    className: "badge bg-navy-100 text-navy-600" },
  medium: { label: "Medium", className: "badge bg-gold-100 text-gold-700" },
  high:   { label: "High",   className: "badge bg-red-100 text-red-700" },
};

const STATUS_META: Record<TaskStatus, { label: string; icon: React.ReactNode; className: string }> = {
  pending:     { label: "Pending",     icon: <Circle className="w-4 h-4" />,       className: "text-navy-400" },
  in_progress: { label: "In Progress", icon: <Clock className="w-4 h-4" />,        className: "text-gold-600" },
  completed:   { label: "Completed",   icon: <CheckCircle2 className="w-4 h-4" />, className: "text-primary-600" },
};

const FILTER_OPTIONS: { value: TaskStatus | "all"; label: string }[] = [
  { value: "all",         label: "All Tasks" },
  { value: "pending",     label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed",   label: "Completed" },
];

export default function Tasks() {
  const { tasks, createTask, updateTask, updateTaskStatus, deleteTask, showToast } = useApp();

  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");

  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedToName: "",
    priority: "medium" as TaskPriority,
    dueDate: "",
  });
  const [formErrors, setFormErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void authApi.profile().then((p) => {
      setCurrentUserId(p.id);
      setCurrentUserName(p.full_name);
    }).catch(() => {});
  }, []);

  const validate = () => collectErrors([
    ["title",          validators.required(form.title, "Task title")],
    ["assignedToName", validators.required(form.assignedToName, "Assigned to")],
  ]);

  const openAdd = () => {
    setForm({ title: "", description: "", assignedToName: "", priority: "medium", dueDate: "" });
    setFormErrors({});
    setEditingTask(null);
    setModal("create");
  };

  const openEdit = (task: Task) => {
    setForm({ title: task.title, description: task.description, assignedToName: task.assignedToName, priority: task.priority, dueDate: task.dueDate });
    setFormErrors({});
    setEditingTask(task);
    setModal("edit");
  };

  const handleSave = async () => {
    const errors = validate();
    setFormErrors(errors);
    if (hasErrors(errors)) return;
    setSaving(true);
    try {
      if (modal === "edit" && editingTask) {
        await updateTask(editingTask.id, {
          title: form.title.trim(),
          description: form.description.trim(),
          assignedToName: form.assignedToName.trim(),
          priority: form.priority,
          dueDate: form.dueDate,
        });
        showToast("Task updated");
      } else {
        await createTask({
          title: form.title.trim(),
          description: form.description.trim(),
          assignedTo: currentUserId,
          assignedBy: currentUserId,
          assignedToName: form.assignedToName.trim(),
          status: "pending",
          priority: form.priority,
          dueDate: form.dueDate,
        });
        showToast("Task created successfully");
      }
      setModal(null);
    } catch {
      showToast(modal === "edit" ? "Failed to update task" : "Failed to create task", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusCycle = async (task: Task) => {
    const next: Record<TaskStatus, TaskStatus> = {
      pending: "in_progress",
      in_progress: "completed",
      completed: "pending",
    };
    setUpdatingId(task.id);
    try {
      await updateTaskStatus(task.id, next[task.status]);
    } catch {
      showToast("Failed to update status", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteTask(id);
      showToast("Task deleted", "info");
    } catch {
      showToast("Failed to delete task", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const myTasks = useMemo(() =>
    tasks.filter((t) => t.assignedTo === currentUserId || t.assignedBy === currentUserId),
    [tasks, currentUserId]
  );

  const filtered = useMemo(() =>
    filter === "all" ? myTasks : myTasks.filter((t) => t.status === filter),
    [myTasks, filter]
  );

  const counts = useMemo(() => ({
    all:         myTasks.length,
    pending:     myTasks.filter((t) => t.status === "pending").length,
    in_progress: myTasks.filter((t) => t.status === "in_progress").length,
    completed:   myTasks.filter((t) => t.status === "completed").length,
  }), [myTasks]);

  const formatDue = (iso: string) => {
    if (!iso) return null;
    const d = new Date(iso);
    const now = new Date();
    const overdue = d < now;
    const label = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    return { label, overdue };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="section-title">My Tasks</h1>
          <p className="text-navy-400 text-sm mt-1">
            Tasks assigned to or by <span className="font-medium text-navy-600">{currentUserName || "you"}</span>
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {FILTER_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`card p-4 text-left transition-all ${filter === value ? "border-primary-400 shadow-md" : "card-hover"}`}
          >
            <p className="text-2xl font-display font-bold text-navy-900">{counts[value]}</p>
            <p className="text-xs text-navy-400 mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
              filter === value
                ? "bg-primary-600 text-white shadow-sm"
                : "bg-white border border-navy-200 text-navy-600 hover:bg-navy-50"
            }`}
          >
            {label}
            <span className={`ml-1.5 text-xs ${filter === value ? "text-white/70" : "text-navy-400"}`}>
              {counts[value]}
            </span>
          </button>
        ))}
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center gap-3">
          <ClipboardList className="w-10 h-10 text-navy-200" />
          <p className="text-navy-400 font-medium">No tasks here</p>
          <p className="text-navy-300 text-sm">Create a new task to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => {
            const due = formatDue(task.dueDate);
            const statusMeta = STATUS_META[task.status];
            const priorityMeta = PRIORITY_META[task.priority];
            const isUpdating = updatingId === task.id;
            const isDeleting = deletingId === task.id;
            const isAssignedToMe = task.assignedTo === currentUserId;
            const isAssignedByMe = task.assignedBy === currentUserId;

            return (
              <div
                key={task.id}
                className={`card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start gap-4 ${
                  task.status === "completed" ? "opacity-70" : ""
                }`}
              >
                {/* Status toggle button */}
                <button
                  onClick={() => void handleStatusCycle(task)}
                  disabled={isUpdating}
                  title={`Mark as ${task.status === "pending" ? "In Progress" : task.status === "in_progress" ? "Completed" : "Pending"}`}
                  className={`mt-0.5 flex-shrink-0 transition-all hover:scale-110 disabled:opacity-50 ${statusMeta.className}`}
                >
                  {isUpdating ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin block" />
                  ) : statusMeta.icon}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className={`font-semibold text-navy-900 text-sm leading-snug ${task.status === "completed" ? "line-through text-navy-400" : ""}`}>
                      {task.title}
                    </p>
                    <span className={priorityMeta.className}>{priorityMeta.label}</span>
                  </div>

                  {task.description && (
                    <p className="text-sm text-navy-500 mb-2 leading-relaxed">{task.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-navy-400">
                    {/* Assigned to */}
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {isAssignedToMe ? "Assigned to me" : task.assignedToName}
                    </span>

                    {/* Assigned by */}
                    {isAssignedToMe && !isAssignedByMe && (
                      <span className="text-navy-300">by {task.assignedBy === currentUserId ? "me" : "admin"}</span>
                    )}

                    {/* Due date */}
                    {due && (
                      <span className={`flex items-center gap-1 ${due.overdue && task.status !== "completed" ? "text-red-500 font-medium" : ""}`}>
                        {due.overdue && task.status !== "completed" && <AlertCircle className="w-3.5 h-3.5" />}
                        Due {due.label}
                      </span>
                    )}

                    {/* Completed at */}
                    {task.completedAt && (
                      <span className="text-primary-500">
                        ✓ {new Date(task.completedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side: status badge + delete */}
                <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                  <span className={`badge text-xs ${
                    task.status === "completed"   ? "bg-primary-100 text-primary-700" :
                    task.status === "in_progress" ? "bg-gold-100 text-gold-700" :
                    "bg-navy-100 text-navy-600"
                  }`}>
                    {statusMeta.label}
                  </span>

                  {(isAssignedByMe || task.assignedTo === currentUserId) && (
                    <button
                      onClick={() => openEdit(task)}
                      className="text-navy-300 hover:text-primary-600 hover:bg-primary-50 p-1.5 rounded-lg transition-colors"
                      title="Edit task"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                  {(isAssignedByMe || task.assignedTo === currentUserId) && (
                    <button
                      onClick={() => void handleDelete(task.id)}
                      disabled={isDeleting}
                      className="text-navy-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isDeleting
                        ? <span className="w-4 h-4 border-2 border-red-300 border-t-transparent rounded-full animate-spin block" />
                        : <Trash2 className="w-4 h-4" />
                      }
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === "edit" ? "Edit Task" : "New Task"}>
        <div className="space-y-4">
          <div>
            <label className="label">Task Title</label>
            <input
              className={inputClass("input", formErrors.title)}
              placeholder="e.g. Follow up with customer"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <FieldError error={formErrors.title} />
          </div>

          <div>
            <label className="label">Description <span className="text-navy-400 font-normal">(optional)</span></label>
            <textarea
              className="input"
              rows={3}
              placeholder="Add more details about this task..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Assign To</label>
              <input
                className={inputClass("input", formErrors.assignedToName)}
                placeholder="e.g. Ahmed, Front Desk Staff"
                value={form.assignedToName}
                onChange={(e) => setForm({ ...form, assignedToName: e.target.value })}
              />
              <FieldError error={formErrors.assignedToName} />
            </div>

            <div>
              <label className="label">Priority</label>
              <div className="relative">
                <select
                  className="input pr-8 appearance-none"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <ChevronDown className="w-4 h-4 text-navy-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="label">Due Date <span className="text-navy-400 font-normal">(optional)</span></label>
            <input
              type="datetime-local"
              className="input"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>

          <div className="flex gap-3 justify-end pt-1">
            <button onClick={() => setModal(null)} className="btn-outline">Cancel</button>
            <button onClick={() => void handleSave()} disabled={saving} className="btn-primary">
              {saving ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
              ) : (
                <><Plus className="w-4 h-4" /> {modal === "edit" ? "Save Changes" : "Create Task"}</>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
