import { NextResponse } from "next/server";
import { auth } from "@/auth";

type MatchRequest = {
  name?: string;
  brand?: string;
  category?: string;
  objective?: string;
  budget?: string;
};

const categoryProfiles: Record<string, { creatorIds: string[]; reachPerLakh: number; color: string }> = {
  Skincare: { creatorIds: ["riya", "ishita"], reachPerLakh: 410000, color: "#d8ff61" },
  Technology: { creatorIds: ["prisha", "naina"], reachPerLakh: 320000, color: "#8b7cff" },
  Fitness: { creatorIds: ["arjun"], reachPerLakh: 360000, color: "#55d9cd" },
  Food: { creatorIds: ["sana"], reachPerLakh: 440000, color: "#ff8b72" },
};

function budgetInLakhs(value: string) {
  const amounts = (value.match(/[\d.]+/g) ?? []).map(Number).filter(Number.isFinite);
  if (!amounts.length) return 1;
  const average = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
  return value.includes("K") ? average / 100 : average;
}

function formatReach(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  return `${Math.round(value / 1000)}K`;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in to run a creator match." }, { status: 401 });
  }
  const body = await request.json().catch(() => null) as MatchRequest | null;
  const name = body?.name?.trim();
  const brand = body?.brand?.trim();
  const category = body?.category?.trim();
  const objective = body?.objective?.trim();
  const budget = body?.budget?.trim();

  if (!name || !brand || !category || !objective || !budget) {
    return NextResponse.json({ error: "Complete every campaign field." }, { status: 400 });
  }

  const profile = categoryProfiles[category] ?? categoryProfiles.Skincare;
  const reach = Math.round(budgetInLakhs(budget) * profile.reachPerLakh);
  return NextResponse.json({
    campaign: {
      id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${crypto.randomUUID().slice(0, 8)}`,
      name,
      brand,
      category,
      objective,
      progress: 8,
      budget,
      creators: profile.creatorIds.length,
      creatorIds: profile.creatorIds,
      reach: formatReach(reach),
      color: profile.color,
      status: "Live",
    },
  });
}
