import { useState, useEffect, useCallback } from "react";
import {
  Users, Shield, Key, Plus, Trash2, Edit2, Check, X,
  RefreshCw, UserPlus, ChevronDown, ChevronUp,
} from "lucide-react";
import Modal from "../components/Modal";
import { useApp } from "../context";
import {
  rolesApi, permissionsApi, usersApi,
  type AppRole, type Permission, type UserProfile,
} from "../lib/userManagementApi";
import Pagination from "../components/Pagination";

type Tab = "users" | "roles" | "permissions";

// ─── helpers ────────────────────────────────────────────────────────────────

function groupByModule(permissions: Permission[]): Record<string, Permission[]> {
  return permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.module] ??= []).push(p);
    return acc;
  }, {});
}

// ─── sub-components ─────────────────────────────────────────────────────────

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active ? "bg-primary-600 text-white shadow-sm" : "text-navy-500 hover:bg-navy-100"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── USERS TAB ───────────────────────────────────────────────────────────────

function UsersTab({ roles, showToast }: { roles: AppRole[]; showToast: (m: string, t?: "success" | "error" | "info") => void }) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersPage, setUsersPage] = useState(1);
  const USERS_PAGE_SIZE = 10;
  const [inviteModal, setInviteModal] = useState(false);
  const [editModal, setEditModal] = useState<UserProfile | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [inviteForm, setInviteForm] = useState({ email: "", fullName: "", roleId: "", password: "" });
  const [editName, setEditName] = useState("");
  const [assignRoleId, setAssignRoleId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await usersApi.list());
    } catch (e) {
      showToast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { void load(); }, [load]);

  const handleInvite = async () => {
    if (!inviteForm.email || !inviteForm.fullName || !inviteForm.roleId || !inviteForm.password) {
      showToast("All fields are required", "error");
      return;
    }
    if (inviteForm.password.length < 8) {
      showToast("Password must be at least 8 characters", "error");
      return;
    }
    setSaving(true);
    try {
      await usersApi.invite(inviteForm.email, inviteForm.fullName, inviteForm.roleId, inviteForm.password);
      showToast("User invited successfully");
      setInviteModal(false);
      setInviteForm({ email: "", fullName: "", roleId: "", password: "" });
      await load();
    } catch (e) {
      showToast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateName = async () => {
    if (!editModal || !editName.trim()) return;
    setSaving(true);
    try {
      await usersApi.updateProfile(editModal.id, editName);
      showToast("Name updated");
      setEditModal(null);
      await load();
    } catch (e) {
      showToast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAssignRole = async (userId: string) => {
    if (!assignRoleId) return;
    setSaving(true);
    try {
      await usersApi.assignRole(userId, assignRoleId);
      showToast("Role assigned");
      setAssignRoleId("");
      await load();
    } catch (e) {
      showToast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveRole = async (userId: string, roleId: string) => {
    setSaving(true);
    try {
      await usersApi.removeRole(userId, roleId);
      showToast("Role removed", "info");
      await load();
    } catch (e) {
      showToast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await usersApi.delete(userId);
      showToast("User deleted", "info");
      await load();
    } catch (e) {
      showToast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-navy-400">{users.length} user{users.length !== 1 ? "s" : ""}</p>
        <div className="flex gap-2">
          <button onClick={() => void load()} className="btn-outline py-2 px-3" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => setInviteModal(true)} className="btn-primary">
            <UserPlus className="w-4 h-4" /> Create User
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-navy-400 text-sm">Loading users…</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-navy-50 border-b border-navy-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Roles</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {users.slice((usersPage - 1) * USERS_PAGE_SIZE, usersPage * USERS_PAGE_SIZE).map((u) => (
                <>
                  <tr key={u.id} className="table-row-hover">
                    <td className="px-4 py-3 text-sm font-medium text-navy-800">{u.fullName}</td>
                    <td className="px-4 py-3 text-sm text-navy-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.appRoles.length === 0
                          ? <span className="text-xs text-navy-400">No roles</span>
                          : u.appRoles.map((r) => (
                            <span key={r.id} className="badge badge-navy flex items-center gap-1">
                              {r.name}
                              <button
                                onClick={() => void handleRemoveRole(u.id, r.id)}
                                className="hover:text-red-500 ml-0.5"
                                disabled={saving}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))
                        }
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => { setEditModal(u); setEditName(u.fullName); }}
                          className="text-navy-400 hover:text-primary-600 p-1.5 rounded-lg hover:bg-primary-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                          className="text-navy-400 hover:text-primary-600 p-1.5 rounded-lg hover:bg-primary-50"
                        >
                          {expandedUser === u.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => void handleDelete(u.id, u.fullName)}
                          className="text-navy-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50"
                          disabled={saving}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedUser === u.id && (
                    <tr key={`${u.id}-expand`} className="bg-navy-50/50">
                      <td colSpan={4} className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-navy-500 uppercase tracking-wide">Assign Role:</span>
                          <select
                            className="input py-1.5 text-sm w-48"
                            value={assignRoleId}
                            onChange={(e) => setAssignRoleId(e.target.value)}
                          >
                            <option value="">Select role…</option>
                            {roles
                              .filter((r) => !u.appRoles.some((ar) => ar.id === r.id))
                              .map((r) => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                              ))}
                          </select>
                          <button
                            onClick={() => void handleAssignRole(u.id)}
                            className="btn-primary py-1.5 px-3 text-sm"
                            disabled={!assignRoleId || saving}
                          >
                            <Check className="w-4 h-4" /> Assign
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          <Pagination page={usersPage} totalPages={Math.max(1, Math.ceil(users.length / USERS_PAGE_SIZE))} totalItems={users.length} pageSize={USERS_PAGE_SIZE} onPageChange={setUsersPage} />
        </div>
      )}

      {/* Invite Modal */}
      <Modal open={inviteModal} onClose={() => setInviteModal(false)} title="Create New User">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={inviteForm.fullName} onChange={(e) => setInviteForm({ ...inviteForm, fullName: e.target.value })} placeholder="e.g. Ahmed Khan" />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} placeholder="user@example.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Initial Role</label>
              <select className="input" value={inviteForm.roleId} onChange={(e) => setInviteForm({ ...inviteForm, roleId: e.target.value })}>
                <option value="">Select role…</option>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Temporary Password</label>
              <input type="password" className="input" value={inviteForm.password} onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })} placeholder="Min. 8 characters" />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setInviteModal(false)} className="btn-outline">Cancel</button>
            <button onClick={() => void handleInvite()} className="btn-primary" disabled={saving}>
              {saving ? "Creating…" : "Create User"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Name Modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit User" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setEditModal(null)} className="btn-outline">Cancel</button>
            <button onClick={() => void handleUpdateName()} className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── ROLES TAB ────────────────────────────────────────────────────────────────

function RolesTab({ roles, onRolesChange, showToast }: { roles: AppRole[]; onRolesChange: () => void; showToast: (m: string, t?: "success" | "error" | "info") => void }) {
  const [modal, setModal] = useState(false);
  const [editTarget, setEditTarget] = useState<AppRole | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setEditTarget(null); setForm({ name: "", description: "" }); setModal(true); };
  const openEdit = (r: AppRole) => { setEditTarget(r); setForm({ name: r.name, description: r.description }); setModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { showToast("Role name is required", "error"); return; }
    setSaving(true);
    try {
      if (editTarget) {
        await rolesApi.update(editTarget.id, form.name, form.description);
        showToast("Role updated");
      } else {
        await rolesApi.create(form.name, form.description);
        showToast("Role created");
      }
      setModal(false);
      onRolesChange();
    } catch (e) {
      showToast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (r: AppRole) => {
    if (r.isSystem) { showToast("System roles cannot be deleted", "error"); return; }
    if (!confirm(`Delete role "${r.name}"?`)) return;
    setSaving(true);
    try {
      await rolesApi.delete(r.id);
      showToast("Role deleted", "info");
      onRolesChange();
    } catch (e) {
      showToast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-navy-400">{roles.length} role{roles.length !== 1 ? "s" : ""}</p>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Role
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((r) => (
          <div key={r.id} className="card p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 flex-shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-navy-800 text-sm">{r.name}</p>
                  {r.isSystem && <span className="badge badge-gold text-xs">System</span>}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {!r.isSystem && (
                  <button onClick={() => openEdit(r)} className="text-navy-400 hover:text-primary-600 p-1.5 rounded-lg hover:bg-primary-50">
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                {!r.isSystem && (
                  <button onClick={() => void handleDelete(r)} className="text-navy-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50" disabled={saving}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-navy-400 leading-relaxed">{r.description || "No description"}</p>
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editTarget ? "Edit Role" : "Add Role"} size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Role Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Accountant" />
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What can this role do?" />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setModal(false)} className="btn-outline">Cancel</button>
            <button onClick={() => void handleSave()} className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : editTarget ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── PERMISSIONS TAB ──────────────────────────────────────────────────────────

function PermissionsTab({ roles, showToast }: { roles: AppRole[]; showToast: (m: string, t?: "success" | "error" | "info") => void }) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [grantedIds, setGrantedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    void permissionsApi.list().then(setPermissions).catch((e: Error) => showToast(e.message, "error"));
  }, [showToast]);

  useEffect(() => {
    if (!selectedRoleId) { setGrantedIds(new Set()); return; }
    setLoading(true);
    setDirty(false);
    permissionsApi.forRole(selectedRoleId)
      .then((ids) => setGrantedIds(new Set(ids)))
      .catch((e: Error) => showToast(e.message, "error"))
      .finally(() => setLoading(false));
  }, [selectedRoleId, showToast]);

  const toggle = (id: string) => {
    setGrantedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setDirty(true);
  };

  const handleSave = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    try {
      await permissionsApi.setForRole(selectedRoleId, [...grantedIds]);
      showToast("Permissions saved");
      setDirty(false);
    } catch (e) {
      showToast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const grouped = groupByModule(permissions);
  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <label className="label">Select Role to Configure</label>
          <select className="input" value={selectedRoleId} onChange={(e) => setSelectedRoleId(e.target.value)}>
            <option value="">Choose a role…</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        {dirty && (
          <button onClick={() => void handleSave()} className="btn-primary sm:self-end" disabled={saving}>
            {saving ? "Saving…" : <><Check className="w-4 h-4" /> Save Permissions</>}
          </button>
        )}
      </div>

      {!selectedRoleId && (
        <div className="card p-8 text-center text-navy-400 text-sm">Select a role above to manage its permissions.</div>
      )}

      {selectedRoleId && loading && (
        <div className="card p-8 text-center text-navy-400 text-sm">Loading…</div>
      )}

      {selectedRoleId && !loading && (
        <div className="space-y-4">
          {selectedRole?.isSystem && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-gold-50 border border-gold-200 text-gold-700 text-sm">
              <Shield className="w-4 h-4 flex-shrink-0" />
              System role — changes will take effect but be careful modifying built-in roles.
            </div>
          )}
          {Object.entries(grouped).map(([module, perms]) => (
            <div key={module} className="card overflow-hidden">
              <div className="px-4 py-3 bg-navy-50 border-b border-navy-100">
                <p className="text-xs font-semibold text-navy-600 uppercase tracking-wide">{module.replace("_", " ")}</p>
              </div>
              <div className="divide-y divide-navy-50">
                {perms.map((p) => (
                  <label key={p.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-navy-50/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={grantedIds.has(p.id)}
                      onChange={() => toggle(p.id)}
                      className="w-4 h-4 rounded accent-primary-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-navy-700">{p.action}</p>
                      <p className="text-xs text-navy-400">{p.description}</p>
                    </div>
                    {grantedIds.has(p.id) && <Check className="w-4 h-4 text-primary-600 flex-shrink-0" />}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function UserManagement() {
  const { showToast } = useApp();
  const [tab, setTab] = useState<Tab>("users");
  const [roles, setRoles] = useState<AppRole[]>([]);

  const loadRoles = useCallback(async () => {
    try {
      setRoles(await rolesApi.list());
    } catch (e) {
      showToast((e as Error).message, "error");
    }
  }, [showToast]);

  useEffect(() => { void loadRoles(); }, [loadRoles]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">User Management</h1>
        <p className="text-navy-400 text-sm mt-1">Manage users, roles and permissions — super admin only</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-navy-100 rounded-2xl w-fit">
        <TabButton active={tab === "users"} onClick={() => setTab("users")} icon={<Users className="w-4 h-4" />} label="Users" />
        <TabButton active={tab === "roles"} onClick={() => setTab("roles")} icon={<Shield className="w-4 h-4" />} label="Roles" />
        <TabButton active={tab === "permissions"} onClick={() => setTab("permissions")} icon={<Key className="w-4 h-4" />} label="Permissions" />
      </div>

      {tab === "users" && <UsersTab roles={roles} showToast={showToast} />}
      {tab === "roles" && <RolesTab roles={roles} onRolesChange={() => void loadRoles()} showToast={showToast} />}
      {tab === "permissions" && <PermissionsTab roles={roles} showToast={showToast} />}
    </div>
  );
}
