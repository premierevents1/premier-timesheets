import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-server";
import { calcHours } from "@/lib/utils";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const sb = createAdminClient();

  // Join with users to get names + approver name
  const { data, error } = await sb
    .from("timesheet_entries")
    .select(`
      *,
      user:users!timesheet_entries_user_id_fkey(name, first_name, last_name),
      approver:users!timesheet_entries_approved_by_fkey(name)
    `)
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const entries = (data ?? []).map(flattenEntry);
  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const { date, department_id, start_time, end_time, break_mins, leave_type, comment } = body;

  if (!date || !department_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  if (date > today) {
    return NextResponse.json({ error: "Cannot log future dates" }, { status: 400 });
  }

  const sb = createAdminClient();

  // Check for duplicate
  const { data: existing } = await sb
    .from("timesheet_entries")
    .select("id")
    .eq("user_id", user.id)
    .eq("date", date)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Entry already exists for this date" }, { status: 409 });
  }

  const total_hours = leave_type
    ? leave_type.includes("½") ? 3.75 : 7.5
    : calcHours(start_time, end_time, break_mins ?? 0);

  const { data, error } = await sb
    .from("timesheet_entries")
    .insert({
      user_id: user.id,
      date,
      department_id,
      start_time: leave_type ? null : start_time,
      end_time: leave_type ? null : end_time,
      break_mins: leave_type ? 0 : (break_mins ?? 0),
      total_hours,
      leave_type: leave_type ?? null,
      comment: comment ?? "",
      status: "pending",
    })
    .select(`
      *,
      user:users!timesheet_entries_user_id_fkey(name, first_name, last_name),
      approver:users!timesheet_entries_approved_by_fkey(name)
    `)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ entry: flattenEntry(data) }, { status: 201 });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flattenEntry(row: any) {
  return {
    ...row,
    user_name: row.user?.name ?? "",
    user_first: row.user?.first_name ?? "",
    user_last: row.user?.last_name ?? "",
    approver_name: row.approver?.name ?? null,
    user: undefined,
    approver: undefined,
  };
}
