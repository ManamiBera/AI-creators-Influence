import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  directThreadId,
  nameFromEmail,
  normalizeEmail,
} from "@/lib/direct-chat";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const colors = [
  "coral",
  "violet",
  "amber",
  "cyan",
  "blue",
  "pink",
];

function initialsFor(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "IU"
  );
}

export async function GET() {
  const session = await auth();
  const currentEmail = normalizeEmail(
    session?.user?.email ?? "",
  );

  if (!currentEmail) {
    return NextResponse.json(
      { error: "Sign in to see users." },
      { status: 401 },
    );
  }

  const supabase = createSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      { error: "User directory is not configured." },
      { status: 503 },
    );
  }

  const { data, error } =
    await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });

  if (error) {
    return NextResponse.json(
      { error: "Users could not be loaded." },
      { status: 500 },
    );
  }

  const users = data.users
    .filter(
      (user) =>
        user.email &&
        normalizeEmail(user.email) !== currentEmail,
    )
    .map((user, index) => {
      const email = normalizeEmail(user.email ?? "");

      const metadataName =
        typeof user.user_metadata?.name === "string"
          ? user.user_metadata.name.trim()
          : "";

      const name =
        metadataName || nameFromEmail(email);

      return {
        id: directThreadId(currentEmail, email),
        userId: user.id,
        name,
        email,
        initials: initialsFor(name),
        color: colors[index % colors.length],
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ users });
}