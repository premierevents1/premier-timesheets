import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-server";
import { calcHours } from "@/lib/utils";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id } = await params;
  const sb = createAdminClient();

  // Verify ownership and pending status
  const { data: existing } = await sb
    .from("timesheet_entries")
    .select("id, user_id, status")
    .eq("id", id)
    .single();

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (existing.status !== "pending") return NextResponse.json({ error: "Only pending entries can be edited" }, { status: 400 });

  const body = await req.json();
  const { department_id, start_time, end_time, break_mins, leave_type, comment } = body;

  const total_hours = leave_type
    ? leave_type.includes("½") ? 3.75 : 7.5
    : calcHours(start_time, end_time, break_mins ?? 0);

  const { data, error } = await sb
    .from("timesheet_entries")
    .update({
      department_id,
      start_time: leave_type ? null : start_time,
      end_time: leave_type ? null : end_time,
      break_mins: leave_type ? 0 : (break_mins ?? 0),
      total_hours,
      leave_type: leave_type ?? null,
      comment: comment ?? "",
      status: "pending",
      approved_by: null,
    })
    .eq("id", id)
    .select(`
      *,
      user:users!timesheet_entries_user_id_fkey(name, first_name, last_name),
      approver:users!timesheet_entries_approved_by_fkey(name)
    `)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row: any = data;
  return NextResponse.json({
    entry: {
      ...row,
      user_name: row.user?.name ?? "",
      user_first: row.user?.first_name ?? "",
      user_last: row.user?.last_name ?? "",
      approver_name: null,
      user: undefined,
      approver: undefined,
    },
  });
}
