import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { first_name, last_name, email, role, default_dept, manager_id, departments } = body;

  const sb = createAdminClient();

  const name = `${first_name} ${last_name}`;

  const { error } = await sb
    .from("users")
    .update({ name, first_name, last_name, email, role, default_dept, manager_id: manager_id || null })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Replace department access
  await sb.from("user_departments").delete().eq("user_id", id);
  if (departments?.length) {
    await sb.from("user_departments").insert(
      departments.map((d: string) => ({ user_id: id, department_id: d }))
    );
  }

  return NextResponse.json({ ok: true });
}
