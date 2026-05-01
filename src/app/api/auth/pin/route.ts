import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { createSession, sessionCookieOptions } from "@/lib/auth";
import type { SessionUser } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { pin } = await req.json();

  if (!pin || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 400 });
  }

  const sb = createAdminClient();

  // Verify PIN using pgcrypto bcrypt comparison
  const { data, error } = await sb.rpc("authenticate_pin", { input_pin: pin });

  if (error || !data || data.length === 0) {
    return NextResponse.json({ error: "PIN not recognised" }, { status: 401 });
  }

  const row = data[0];

  // Fetch user's department access
  const { data: depts } = await sb
    .from("user_departments")
    .select("department_id")
    .eq("user_id", row.id);

  const departments = (depts ?? []).map((d: { department_id: string }) => d.department_id);

  const sessionUser: SessionUser = {
    id: row.id,
    name: row.name,
    first_name: row.first_name,
    last_name: row.last_name,
    role: row.role,
    default_dept: row.default_dept,
    manager_id: row.manager_id,
    departments,
  };

  const token = await createSession(sessionUser);
  const res = NextResponse.json({ user: sessionUser });
  res.cookies.set(sessionCookieOptions(token));
  return res;
}
