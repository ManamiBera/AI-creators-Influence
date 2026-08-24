import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { normalizeEmail } from "@/lib/direct-chat";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type CampaignRow = {
  id: string;
  owner_email: string;
  name: string;
  brand: string;
  category: string;
  objective: string;
  budget: string;
  progress: number;
  status: "Live" | "Closing" | "Complete";
  assignee_emails: string[];
  created_at: string;
};

const categoryColors: Record<string, string> = {
  Skincare: "#d8ff61",
  Technology: "#8b7cff",
  Fitness: "#55d9cd",
  Food: "#ff8b72",
  Travel: "#6fb4ff",
  Other: "#d4d9e2",
};

function toCampaign(row: CampaignRow) {
  const assignees = row.assignee_emails ?? [];

  return {
    id: row.id,
    ownerEmail: row.owner_email,
    name: row.name,
    brand: row.brand,
    category: row.category,
    objective: row.objective,
    progress: row.progress,
    budget: row.budget,
    creators: assignees.length,
    creatorIds: assignees,
    reach: "—",
    color:
      categoryColors[row.category] ??
      categoryColors.Other,
    status: row.status,
    createdAt: row.created_at,
  };
}

async function signedInEmail() {
  const session = await auth();

  return normalizeEmail(
    session?.user?.email ?? "",
  );
}

export async function GET() {
  const email = await signedInEmail();

  if (!email) {
    return NextResponse.json(
      { error: "Sign in to view campaigns." },
      { status: 401 },
    );
  }

  const supabase = createSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Campaign storage is not configured.",
      },
      { status: 503 },
    );
  }

  const { data, error } = await supabase
    .from("campaigns")
    .select(
      "id,owner_email,name,brand,category,objective,budget,progress,status,assignee_emails,created_at",
    )
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    return NextResponse.json(
      {
        error:
          "Campaign database is not ready.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    campaigns: (data as CampaignRow[]).map(
      toCampaign,
    ),
  });
}

export async function POST(request: Request) {
  const email = await signedInEmail();

  if (!email) {
    return NextResponse.json(
      { error: "Sign in to create a campaign." },
      { status: 401 },
    );
  }

  const payload = (await request
    .json()
    .catch(() => null)) as {
    name?: string;
    brand?: string;
    category?: string;
    objective?: string;
    budget?: string;
  } | null;

  const name = payload?.name?.trim() ?? "";
  const brand = payload?.brand?.trim() ?? "";
  const category =
    payload?.category?.trim() ?? "";
  const objective =
    payload?.objective?.trim() ?? "";
  const budget = payload?.budget?.trim() ?? "";

  if (
    !name ||
    !brand ||
    !category ||
    !objective ||
    !budget
  ) {
    return NextResponse.json(
      { error: "Complete every campaign field." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Campaign storage is not configured.",
      },
      { status: 503 },
    );
  }

  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      owner_email: email,
      name,
      brand,
      category,
      objective,
      budget,
    })
    .select(
      "id,owner_email,name,brand,category,objective,budget,progress,status,assignee_emails,created_at",
    )
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Campaign could not be created." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      campaign: toCampaign(
        data as CampaignRow,
      ),
    },
    { status: 201 },
  );
}

export async function PATCH(request: Request) {
  const email = await signedInEmail();

  if (!email) {
    return NextResponse.json(
      { error: "Sign in to update a campaign." },
      { status: 401 },
    );
  }

  const payload = (await request
    .json()
    .catch(() => null)) as {
    id?: string;
    action?: "advance" | "toggle-user";
    userEmail?: string;
  } | null;

  const id = payload?.id?.trim() ?? "";

  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json(
      { error: "Invalid campaign." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Campaign storage is not configured.",
      },
      { status: 503 },
    );
  }

  const { data: existing, error: readError } =
    await supabase
      .from("campaigns")
      .select(
        "id,owner_email,name,brand,category,objective,budget,progress,status,assignee_emails,created_at",
      )
      .eq("id", id)
      .single();

  if (readError || !existing) {
    return NextResponse.json(
      { error: "Campaign not found." },
      { status: 404 },
    );
  }

  const row = existing as CampaignRow;

  let update: {
    progress?: number;
    status?: string;
    assignee_emails?: string[];
  } = {};

  if (payload?.action === "advance") {
    const progress = Math.min(
      100,
      row.progress + 25,
    );

    update = {
      progress,
      status:
        progress >= 100
          ? "Complete"
          : progress >= 75
            ? "Closing"
            : "Live",
    };
  } else if (
    payload?.action === "toggle-user"
  ) {
    const userEmail = normalizeEmail(
      payload.userEmail ?? "",
    );

    if (!/^\S+@\S+\.\S+$/.test(userEmail)) {
      return NextResponse.json(
        { error: "Choose a registered user." },
        { status: 400 },
      );
    }

    const current = row.assignee_emails ?? [];

    update = {
      assignee_emails: current.includes(
        userEmail,
      )
        ? current.filter(
            (item) => item !== userEmail,
          )
        : [...current, userEmail],
    };
  } else {
    return NextResponse.json(
      { error: "Invalid campaign update." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("campaigns")
    .update(update)
    .eq("id", id)
    .select(
      "id,owner_email,name,brand,category,objective,budget,progress,status,assignee_emails,created_at",
    )
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Campaign could not be updated." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    campaign: toCampaign(
      data as CampaignRow,
    ),
  });
}