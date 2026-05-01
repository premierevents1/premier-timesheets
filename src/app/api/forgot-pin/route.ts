import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const sb = createAdminClient();

  const { data: userRow } = await sb
    .from("users")
    .select("id, name, manager_id")
    .ilike("email", email.trim())
    .single();

  if (!userRow) {
    // Return success anyway to avoid user enumeration
    return NextResponse.json({ ok: true });
  }

  // Find the manager's email
  let toEmail = "charlotte.gambrill@premier-ltd.com"; // fallback to admin

  if (userRow.manager_id) {
    const { data: mgr } = await sb
      .from("users")
      .select("email, name")
      .eq("id", userRow.manager_id)
      .single();
    if (mgr?.email) toEmail = mgr.email;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://timesheets.premier-ltd.com";

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "Premier Timesheets <timesheets@premier-ltd.com>",
      to: toEmail,
      subject: `PIN Reset Request — ${userRow.name}`,
      html: `
        <p>${userRow.name} has requested a PIN reset for Premier Timesheets.</p>
        <p>Log in to reset their PIN: <a href="${appUrl}">${appUrl}</a></p>
        <p>Go to the <strong>PINs</strong> tab to generate a new PIN and share it with them verbally.</p>
      `,
    });
  } catch (err) {
    console.error("Resend error:", err);
    // Don't fail the request — PIN reset still works
  }

  return NextResponse.json({ ok: true });
}
