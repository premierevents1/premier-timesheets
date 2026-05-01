import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-server";
import { randomPin } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (user.role === "staff") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { targetUserId } = await req.json();
  if (!targetUserId) return NextResponse.json({ error: "Missing targetUserId" }, { status: 400 });

  const sb = createAdminClient();

  // Verify the manager is allowed to reset this person's PIN
  if (user.role !== "admin") {
    const { data: target } = await sb
      .from("users")
      .select("manager_id")
      .eq("id", targetUserId)
      .single();

    if (!target || target.manager_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const newPin = randomPin();

  const { error } = await sb.rpc("reset_user_pin", {
    target_user_id: targetUserId,
    new_pin: newPin,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ pin: newPin });
}

// GET: list team members for PIN management
export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (user.role === "staff") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sb = createAdminClient();

  let query = sb
    .from("users")
    .select("id, name, first_name, last_name, email, role, default_dept")
    .order("name");

  if (user.role !== "admin") {
    query = query.eq("manager_id", user.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ users: data ?? [] });
}
