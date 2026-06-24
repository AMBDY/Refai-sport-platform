import { createServerFn } from "@/lib/server-fn";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertSuperAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "super_admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: super_admin only");
}

/** Hard-delete a user (auth + cascade) — super-admin only. */
export const deleteUserAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ user_id: z.string().uuid(), reason: z.string().max(500).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    if (data.user_id === context.userId) throw new Error("Cannot delete your own account");

    await supabaseAdmin.from("moderation_actions").insert({
      admin_id: context.userId,
      target_type: "user",
      target_id: data.user_id,
      action: "delete",
      reason: data.reason ?? null,
    });

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Set a profile's account_status. */
export const setAccountStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        user_id: z.string().uuid(),
        status: z.enum(["pending", "approved", "rejected", "suspended"]),
        reason: z.string().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        account_status: data.status,
        moderation_note: data.reason ?? null,
        moderated_at: new Date().toISOString(),
        moderated_by: context.userId,
      })
      .eq("id", data.user_id);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("moderation_actions").insert({
      admin_id: context.userId,
      target_type: "user",
      target_id: data.user_id,
      action: data.status,
      reason: data.reason ?? null,
    });

    return { ok: true };
  });

/** Suspend / unsuspend a league or team. */
export const setEntitySuspended = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        target_type: z.enum(["league", "team"]),
        target_id: z.string().uuid(),
        suspended: z.boolean(),
        reason: z.string().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const table = data.target_type === "league" ? "leagues" : "teams";
    const { error } = await supabaseAdmin
      .from(table)
      .update({ is_suspended: data.suspended, suspended_reason: data.reason ?? null })
      .eq("id", data.target_id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("moderation_actions").insert({
      admin_id: context.userId,
      target_type: data.target_type,
      target_id: data.target_id,
      action: data.suspended ? "suspend" : "unsuspend",
      reason: data.reason ?? null,
    });
    return { ok: true };
  });

/** Delete a league or team. */
export const deleteEntity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        target_type: z.enum(["league", "team"]),
        target_id: z.string().uuid(),
        reason: z.string().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const table = data.target_type === "league" ? "leagues" : "teams";
    await supabaseAdmin.from("moderation_actions").insert({
      admin_id: context.userId,
      target_type: data.target_type,
      target_id: data.target_id,
      action: "delete",
      reason: data.reason ?? null,
    });
    const { error } = await supabaseAdmin.from(table).delete().eq("id", data.target_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** List all users for moderation. */
export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.userId);
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, avatar_url, account_status, moderation_note, moderated_at, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);

    const { data: authList } = await supabaseAdmin.auth.admin.listUsers({ perPage: 500 });
    const emailMap = new Map(authList?.users.map((u) => [u.id, u.email ?? ""]) ?? []);
    const confirmedMap = new Map(authList?.users.map((u) => [u.id, !!u.email_confirmed_at]) ?? []);

    return (profiles ?? []).map((p) => ({
      ...p,
      email: emailMap.get(p.id) ?? "",
      email_confirmed: confirmedMap.get(p.id) ?? false,
    }));
  });
