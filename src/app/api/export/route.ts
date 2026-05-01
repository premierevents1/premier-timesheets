import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-server";
import { getDept, leaveHours } from "@/lib/types";
import { timeToFraction, minsToFraction } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const sb = createAdminClient();

  let query = sb
    .from("timesheet_entries")
    .select(`
      *,
      user:users!timesheet_entries_user_id_fkey(name, first_name, last_name),
      approver:users!timesheet_entries_approved_by_fkey(name)
    `)
    .eq("status", "approved")
    .order("date", { ascending: true });

  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const headers = [
    "Employee Export Code",
    "Employee Name",
    "Date",
    "Start",
    "End",
    "Mealbreak",
    "Total Hours",
    "Total Cost",
    "Employee Comment",
    "Area Export Code",
    "Area Name",
    "Location Code",
    "Location Name",
    "Leave",
    "Manager's Comment",
    "Firstname",
    "Lastname",
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []).map((e: any) => {
    const dept = getDept(e.department_id);
    const hrs = e.leave_type
      ? leaveHours(e.leave_type).toFixed(2)
      : (e.total_hours ?? 0).toFixed(2);

    return [
      "",
      e.user?.name ?? "",
      e.date,
      timeToFraction(e.start_time),
      timeToFraction(e.end_time),
      minsToFraction(e.break_mins ?? 0),
      hrs,
      "0",
      e.comment ?? "",
      dept.export_code,
      dept.name,
      dept.export_code,
      dept.location,
      e.leave_type ?? "",
      e.approver?.name ? `Approved by ${e.approver.name}` : "",
      e.user?.first_name ?? "",
      e.user?.last_name ?? "",
    ];
  });

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const filename = `timesheets_${from ?? "all"}_${to ?? "all"}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
