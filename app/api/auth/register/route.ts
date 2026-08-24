import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { name?: string; email?: string; password?: string } | null;
  const name = body?.name?.trim() ?? "";
  const email = body?.email?.trim().toLowerCase() ?? "";
  const password = body?.password ?? "";

  if (name.length < 2 || name.length > 60) {
    return NextResponse.json({ error: "Enter your full name." }, { status: 400 });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Use a password with at least 8 characters." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Account creation is not configured yet." }, { status: 503 });
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (error) {
    const duplicate = /already|registered|exists/i.test(error.message);
    return NextResponse.json(
      { error: duplicate ? "An account with this email already exists. Sign in instead." : error.message },
      { status: duplicate ? 409 : 400 },
    );
  }

  return NextResponse.json({ created: true, user: { id: data.user.id, email: data.user.email, name } }, { status: 201 });
}
