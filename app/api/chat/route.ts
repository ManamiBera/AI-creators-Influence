import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  directThreadId,
  normalizeEmail,
} from "@/lib/direct-chat";
import {
  createSupabaseAdmin,
  realtimeChatConfigured,
} from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type ChatRow = {
  id: string;
  thread_id: string;
  sender_email: string;
  recipient_email: string;
  sender_name: string;
  body: string;
  created_at: string;
};

function toMessage(row: ChatRow) {
  return {
    id: row.id,
    from: "brand" as const,
    text: row.body,
    time: new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(row.created_at)),
    senderEmail: row.sender_email,
    senderName: row.sender_name,
    createdAt: row.created_at,
  };
}

export async function GET(request: Request) {
  const session = await auth();

  const currentEmail = normalizeEmail(
    session?.user?.email ?? "",
  );

  if (!currentEmail) {
    return NextResponse.json(
      { error: "Sign in to open chat." },
      { status: 401 },
    );
  }

  if (!realtimeChatConfigured) {
    return NextResponse.json({
      configured: false,
      messages: [],
    });
  }

  const recipientEmail = normalizeEmail(
    new URL(request.url).searchParams.get(
      "recipientEmail",
    ) ?? "",
  );

  if (
    !/^\S+@\S+\.\S+$/.test(recipientEmail) ||
    recipientEmail === currentEmail
  ) {
    return NextResponse.json(
      { error: "Invalid conversation." },
      { status: 400 },
    );
  }

  const threadId = directThreadId(
    currentEmail,
    recipientEmail,
  );

  const supabase = createSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json({
      configured: false,
      messages: [],
    });
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .select(
      "id,thread_id,sender_email,recipient_email,sender_name,body,created_at",
    )
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    return NextResponse.json(
      {
        error:
          "Chat database is not ready. Run supabase/chat.sql first.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    configured: true,
    messages: (data as ChatRow[]).map(toMessage),
  });
}

export async function POST(request: Request) {
  const session = await auth();

  const email = normalizeEmail(
    session?.user?.email ?? "",
  );

  if (!email) {
    return NextResponse.json(
      { error: "Sign in to send a message." },
      { status: 401 },
    );
  }

  if (!realtimeChatConfigured) {
    return NextResponse.json(
      {
        configured: false,
        error: "Realtime chat is not configured.",
      },
      { status: 503 },
    );
  }

  const payload = (await request
    .json()
    .catch(() => null)) as {
    recipientEmail?: string;
    text?: string;
  } | null;

  const recipientEmail = normalizeEmail(
    payload?.recipientEmail ?? "",
  );

  const body = payload?.text?.trim() ?? "";

  if (
    !/^\S+@\S+\.\S+$/.test(recipientEmail) ||
    recipientEmail === email
  ) {
    return NextResponse.json(
      { error: "Invalid conversation." },
      { status: 400 },
    );
  }

  if (!body || body.length > 2000) {
    return NextResponse.json(
      {
        error:
          "Messages must be 1–2,000 characters.",
      },
      { status: 400 },
    );
  }

  const threadId = directThreadId(
    email,
    recipientEmail,
  );

  const supabase = createSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      { error: "Realtime chat is not configured." },
      { status: 503 },
    );
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      thread_id: threadId,
      sender_email: email,
      recipient_email: recipientEmail,
      sender_name:
        session?.user?.name ?? email.split("@")[0],
      body,
    })
    .select(
      "id,thread_id,sender_email,recipient_email,sender_name,body,created_at",
    )
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Message could not be saved." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      configured: true,
      message: toMessage(data as ChatRow),
    },
    { status: 201 },
  );
}