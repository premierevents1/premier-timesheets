import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-server";
import { randomPin } from "@/lib/utils";
import bcrypt from "bcryptjs";

export async function GET() {
  const user = await getSession();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sb = createAdminClient();

  const { data, error } = await sb
    .from("users")
    .select("id, name, first_name, last_name, email, role, default_dept, manager_id, user_departments(department_id)")
    .order("last_name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const staff = (data ?? []).map((u: any) => ({
    ...u,
    departments: (u.user_departments ?? []).map((d: { department_id: string }) => d.department_id),
    user_departments: undefined,
  }));

  return NextResponse.json({ staff });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { first_name, last_name, email, role, default_dept, manager_id, departments } = body;

  if (!first_name || !last_name || !email || !role || !default_dept) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const pin = randomPin();
  const hashed = await bcrypt.hash(pin, 10);
  const name = `${first_name} ${last_name}`;

  const sb = createAdminClient();

  const { data: newUser, error } = await sb
    .from("users")
    .insert({ name, first_name, last_name, email, pin: hashed, role, default_dept, manager_id: manager_id || null })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (departments?.length) {
    await sb.from("user_departments").insert(
      departments.map((d: string) => ({ user_id: newUser.id, department_id: d }))
    );
  }

  return NextResponse.json({ id: newUser.id, pin }, { status: 201 });
}
