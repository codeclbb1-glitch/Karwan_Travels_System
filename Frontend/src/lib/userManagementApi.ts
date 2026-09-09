import { supabase } from "./supabase";

export interface AppRole {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  createdAt: string;
}

export interface Permission {
  id: string;
  module: string;
  action: string;
  description: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: string; // from profiles.role (legacy enum — kept for auth context)
  appRoles: AppRole[];
  createdAt: string;
}

type Row = Record<string, unknown>;
const str = (v: unknown) => String(v ?? "");

// ── Roles ────────────────────────────────────────────────────────────────────

export const rolesApi = {
  list: async (): Promise<AppRole[]> => {
    const { data, error } = await supabase
      .from("app_roles")
      .select("*")
      .order("name");
    if (error) throw error;
    return (data ?? []).map((r: Row) => ({
      id: str(r.id),
      name: str(r.name),
      description: str(r.description),
      isSystem: Boolean(r.is_system),
      createdAt: str(r.created_at),
    }));
  },

  create: async (name: string, description: string): Promise<AppRole> => {
    const { data, error } = await supabase
      .from("app_roles")
      .insert({ name: name.trim(), description: description.trim() })
      .select()
      .single();
    if (error) throw error;
    const r = data as Row;
    return { id: str(r.id), name: str(r.name), description: str(r.description), isSystem: false, createdAt: str(r.created_at) };
  },

  update: async (id: string, name: string, description: string): Promise<void> => {
    const { error } = await supabase
      .from("app_roles")
      .update({ name: name.trim(), description: description.trim() })
      .eq("id", id)
      .eq("is_system", false); // prevent renaming system roles
    if (error) throw error;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("app_roles")
      .delete()
      .eq("id", id)
      .eq("is_system", false);
    if (error) throw error;
  },
};

// ── Permissions ───────────────────────────────────────────────────────────────

export const permissionsApi = {
  list: async (): Promise<Permission[]> => {
    const { data, error } = await supabase
      .from("permissions")
      .select("*")
      .order("module")
      .order("action");
    if (error) throw error;
    return (data ?? []).map((r: Row) => ({
      id: str(r.id),
      module: str(r.module),
      action: str(r.action),
      description: str(r.description),
    }));
  },

  // Get permission ids assigned to a role
  forRole: async (roleId: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from("role_permissions")
      .select("permission_id")
      .eq("role_id", roleId);
    if (error) throw error;
    return (data ?? []).map((r: Row) => str(r.permission_id));
  },

  // Replace all permissions for a role in one transaction-like batch
  setForRole: async (roleId: string, permissionIds: string[]): Promise<void> => {
    // Delete existing then insert new — done in two calls (no client-side transactions)
    const { error: delErr } = await supabase
      .from("role_permissions")
      .delete()
      .eq("role_id", roleId);
    if (delErr) throw delErr;

    if (permissionIds.length === 0) return;

    const rows = permissionIds.map((pid) => ({
      role_id: roleId,
      permission_id: pid,
      granted_by: null,
    }));
    const { error: insErr } = await supabase.from("role_permissions").insert(rows);
    if (insErr) throw insErr;
  },
};

// ── Users ─────────────────────────────────────────────────────────────────────

export const usersApi = {
  list: async (): Promise<UserProfile[]> => {
    // 1. Fetch all profiles
    const { data: profileData, error: profileErr } = await supabase
      .from("profiles")
      .select("id, full_name, role, created_at")
      .order("created_at", { ascending: false });
    if (profileErr) throw profileErr;

    const profiles = profileData ?? [];
    const userIds = profiles.map((r: Row) => str(r.id));

    // 2. Fetch user_roles + app_roles for those users
    const { data: urData, error: urErr } = await supabase
      .from("user_roles")
      .select("user_id, app_roles ( id, name, description, is_system, created_at )")
      .in("user_id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);
    if (urErr) throw urErr;

    // Build a map: user_id -> AppRole[]
    const rolesByUser: Record<string, AppRole[]> = {};
    for (const ur of (urData ?? []) as Row[]) {
      const uid = str(ur.user_id);
      const ar = ur.app_roles as Row | null;
      if (!ar) continue;
      (rolesByUser[uid] ??= []).push({
        id: str(ar.id),
        name: str(ar.name),
        description: str(ar.description),
        isSystem: Boolean(ar.is_system),
        createdAt: str(ar.created_at),
      });
    }

    // 3. Fetch emails via security-definer RPC
    const emailMap = await usersApi._fetchEmails(userIds);

    return profiles.map((r: Row) => ({
      id: str(r.id),
      fullName: str(r.full_name),
      email: emailMap[str(r.id)] ?? "—",
      role: str(r.role),
      appRoles: rolesByUser[str(r.id)] ?? [],
      createdAt: str(r.created_at),
    }));
  },

  // Supabase anon key cannot read auth.users — we expose a security-definer RPC
  _fetchEmails: async (userIds: string[]): Promise<Record<string, string>> => {
    if (userIds.length === 0) return {};
    const { data, error } = await supabase.rpc("get_user_emails", { p_user_ids: userIds });
    if (error) return {}; // non-fatal — emails just show as "—"
    const map: Record<string, string> = {};
    for (const row of (data ?? []) as Row[]) {
      map[str(row.id)] = str(row.email);
    }
    return map;
  },

  invite: async (email: string, fullName: string, roleId: string, password: string): Promise<string> => {
    const { data, error } = await supabase.rpc("invite_user", {
      p_email: email.trim().toLowerCase(),
      p_full_name: fullName.trim(),
      p_role_id: roleId,
      p_password: password,
    });
    if (error) throw error;
    return str(data);
  },

  updateProfile: async (userId: string, fullName: string): Promise<void> => {
    const { error } = await supabase.rpc("update_user_profile", {
      p_user_id: userId,
      p_full_name: fullName.trim(),
    });
    if (error) throw error;
  },

  assignRole: async (userId: string, roleId: string): Promise<void> => {
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role_id: roleId })
      .select();
    if (error) throw error;
  },

  removeRole: async (userId: string, roleId: string): Promise<void> => {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role_id", roleId);
    if (error) throw error;
  },

  delete: async (userId: string): Promise<void> => {
    const { error } = await supabase.rpc("delete_user", { p_user_id: userId });
    if (error) throw error;
  },
};
