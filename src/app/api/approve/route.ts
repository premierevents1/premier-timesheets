import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (user.role === "staff") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sb = createAdminClient();
  const body = await req.json();

  // body: { action: 'approve' | 'reject', ids: string[] }  OR  { action: 'approve-all' }
  const { action, ids } = body as { action: string; ids?: string[] };

  let targetIds: string[] = ids ?? [];

  if (action === "approve-all") {
    // Fetch all pending entries this manager/admin can see
    let query = sb
      .from("timesheet_entries")
      .select("id, user_id, users!timesheet_entries_user_id_fkey(manager_id)")
      .eq("status", "pending");

    if (user.role !== "admin") {
      // Manager: only their direct reports
      const { data: reports } = await sb
        .from("users")
        .select("id")
        .eq("manager_id", user.id);
      const reportIds = (reports ?? []).map((r: { id: string }) => r.id);
      query = query.in("user_id", reportIds);
    }

    const { data } = await query;
    targetIds = (data ?? []).map((e: { id: string }) => e.id);
  }

  if (!targetIds.length) return NextResponse.json({ updated: 0 });

  // Verify manager is allowed to act on these entries
  if (user.role !== "admin") {
    const { data: reports } = await sb
      .from("users")
      .select("id")
      .eq("manager_id", user.id);
    const reportIds = new Set((reports ?? []).map((r: { id: string }) => r.id));

    const { data: entries } = await sb
      .from("timesheet_entries")
      .select("id, user_id")
      .in("id", targetIds);

    const allowed = (entries ?? []).every((e: { user_id: string }) => reportIds.has(e.user_id));
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const newStatus = action === "reject" ? "rejected" : "approved";

  const { error } = await sb
    .from("timesheet_entries")
    .update({ status: newStatus, approved_by: user.id })
    .in("id", targetIds);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ updated: targetIds.length });
}

// GET: fetch pending entries the caller can approve
export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (user.role === "staff") return NextResponse.json({ entries: [] });

  const sb = createAdminClient();

  let query = sb
    .from("timesheet_entries")
    .select(`
      *,
      user:users!timesheet_entries_user_id_fkey(name, first_name, last_name, default_dept, manager_id),
      approver:users!timesheet_entries_approved_by_fkey(name)
    `)
    .eq("status", "pending")
    .order("date", { ascending: true });

  if (user.role !== "admin") {
    const { data: reports } = await sb
      .from("users")
      .select("id")
      .eq("manager_id", user.id);
    const reportIds = (reports ?? []).map((r: { id: string }) => r.id);
    if (!reportIds.length) return NextResponse.json({ entries: [] });
    query = query.in("user_id", reportIds);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entries = (data ?? []).map((row: any) => ({
    ...row,
    user_name: row.user?.name ?? "",
    user_first: row.user?.first_name ?? "",
    user_last: row.user?.last_name ?? "",
    user_default_dept: row.user?.default_dept ?? "",
    approver_name: row.approver?.name ?? null,
    user: undefined,
    approver: undefined,
  }));

  return NextResponse.json({ entries });
}
