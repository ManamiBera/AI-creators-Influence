"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { getSession, signIn, signOut } from "next-auth/react";

type View = "overview" | "discover" | "campaigns" | "inbox" | "analytics" | "profile";
type IconName =
  | "grid"
  | "search"
  | "spark"
  | "megaphone"
  | "message"
  | "chart"
  | "bell"
  | "plus"
  | "arrow"
  | "heart"
  | "users"
  | "shield"
  | "bolt"
  | "chevron"
  | "close"
  | "send"
  | "check"
  | "calendar"
  | "wallet"
  | "target"
  | "play";

type Creator = {
  id: string;
  name: string;
  handle: string;
  initials: string;
  niche: string;
  location: string;
  followers: string;
  engagement: string;
  match: number;
  cost: string;
  tone: string;
  audience: string;
  authenticity: number;
  relevance: number;
  conversion: number;
  color: string;
  verified?: boolean;
  flagged?: boolean;
};

type UserSession = {
  name: string;
  email: string;
};

type Campaign = {
  id: string;
  ownerEmail?: string;
  name: string;
  brand: string;
  category: string;
  objective: string;
  progress: number;
  budget: string;
  creators: number;
  creatorIds?: string[];
  reach: string;
  color: string;
  status: "Live" | "Closing" | "Complete";
  createdAt?: string;
};

type ThreadMessage = {
  id: string;
  from: "brand" | "creator";
  text: string;
  time: string;
  senderEmail?: string;
  senderName?: string;
  createdAt?: string;
};

type Thread = {
  id: string;
  email: string;
  name: string;
  initials: string;
  time: string;
  text: string;
  unread: boolean;
  color: string;
  messages: ThreadMessage[];
};

const storageKeys = {
  profile: "influence_profile_v2",
};

function userStorageKey(key: string, email: string) {
  return `${key}:${email.trim().toLowerCase()}`;
}

const creators: Creator[] = [
  {
    id: "riya",
    name: "Riya Ray",
    handle: "@riyaglowdiary",
    initials: "RR",
    niche: "Skincare",
    location: "Mumbai",
    followers: "218K",
    engagement: "5.6%",
    match: 96,
    cost: "₹85K",
    tone: "Ingredient-first, credible, calm",
    audience: "Women 18–30 · Metro India",
    authenticity: 98,
    relevance: 96,
    conversion: 91,
    color: "coral",
    verified: true,
  },
  {
    id: "prisha",
    name: "Prisha Sen",
    handle: "@codewithprisha",
    initials: "PS",
    niche: "Tech",
    location: "Bengaluru",
    followers: "72K",
    engagement: "7.3%",
    match: 93,
    cost: "₹68K",
    tone: "Practical, crisp, trustworthy",
    audience: "Builders 20–34 · Tier 1",
    authenticity: 97,
    relevance: 94,
    conversion: 88,
    color: "violet",
    verified: true,
  },
  {
    id: "sana",
    name: "Sana Kapoor",
    handle: "@sipwithsana",
    initials: "SK",
    niche: "Food",
    location: "Ahmedabad",
    followers: "98K",
    engagement: "6.7%",
    match: 91,
    cost: "₹72K",
    tone: "Warm, visual, story-led",
    audience: "Foodies 18–35 · West India",
    authenticity: 96,
    relevance: 91,
    conversion: 87,
    color: "amber",
  },
  {
    id: "arjun",
    name: "Arjun Veer",
    handle: "@coacharjunfit",
    initials: "AV",
    niche: "Fitness",
    location: "Gurugram",
    followers: "412K",
    engagement: "4.9%",
    match: 89,
    cost: "₹1.3L",
    tone: "Energetic, direct, challenge-led",
    audience: "Young professionals 21–35",
    authenticity: 94,
    relevance: 90,
    conversion: 85,
    color: "cyan",
    verified: true,
  },
  {
    id: "naina",
    name: "Naina Bhat",
    handle: "@techwithnaina",
    initials: "NB",
    niche: "Tech",
    location: "Hyderabad",
    followers: "165K",
    engagement: "4.2%",
    match: 87,
    cost: "₹98K",
    tone: "Explanatory, honest, polished",
    audience: "Tech buyers 22–38 · Metro India",
    authenticity: 93,
    relevance: 89,
    conversion: 82,
    color: "blue",
  },
  {
    id: "ishita",
    name: "Ishita Kohli",
    handle: "@glowbyishita",
    initials: "IK",
    niche: "Skincare",
    location: "Delhi",
    followers: "680K",
    engagement: "1.1%",
    match: 61,
    cost: "₹1.75L",
    tone: "Trend-led, aspirational",
    audience: "Beauty followers 16–28",
    authenticity: 48,
    relevance: 82,
    conversion: 54,
    color: "pink",
    flagged: true,
  },
];

const navItems: { id: View; label: string; icon: IconName }[] = [
  { id: "overview", label: "Overview", icon: "grid" },
  { id: "discover", label: "Discover", icon: "search" },
  { id: "campaigns", label: "Campaigns", icon: "megaphone" },
  { id: "inbox", label: "Inbox", icon: "message" },
  { id: "analytics", label: "Analytics", icon: "chart" },
];

function initialsFor(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "IA";
}

function budgetInLakhs(value: string) {
  const amounts = (value.match(/[\d.]+/g) ?? []).map(Number).filter(Number.isFinite);
  if (!amounts.length) return 0;
  const average = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
  return value.includes("K") ? average / 100 : average;
}

function formatLakhs(value: number) {
  if (value < 1) return `₹${Math.max(1, Math.round(value * 100))}K`;
  return `₹${value.toFixed(value >= 10 ? 1 : 2).replace(/\.0+$/, "")}L`;
}

function campaignCreatorIds(campaign: Campaign) {
  return campaign.creatorIds ?? [];
}

function workspaceMetrics(campaigns: Campaign[]) {
  const budget = campaigns.reduce((sum, campaign) => sum + budgetInLakhs(campaign.budget), 0);
  const earnedMedia = campaigns.reduce((sum, campaign) => {
    const progressFactor = .65 + (campaign.progress / 100) * 1.25;
    return sum + budgetInLakhs(campaign.budget) * progressFactor;
  }, 0);
  const spend = campaigns.reduce((sum, campaign) => {
    const deliveryFactor = .3 + (campaign.progress / 100) * .55;
    return sum + budgetInLakhs(campaign.budget) * deliveryFactor;
  }, 0);
  const averageProgress = campaigns.length
    ? campaigns.reduce((sum, campaign) => sum + campaign.progress, 0) / campaigns.length
    : 0;
  return {
    budget,
    earnedMedia,
    roas: spend ? earnedMedia / spend : 0,
    averageProgress,
  };
}

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  const paths: Record<IconName, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    spark: <path d="m12 2 1.6 5.2L19 9l-5.4 1.8L12 16l-1.6-5.2L5 9l5.4-1.8L12 2Zm7 13 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z"/>,
    megaphone: <><path d="m3 11 16-6v14L3 13v-2Z"/><path d="M7 14v5a2 2 0 0 0 2 2h2l-1-5"/></>,
    message: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"/>,
    chart: <><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
    arrow: <><path d="M5 12h14"/><path d="m14 7 5 5-5 5"/></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
    bolt: <path d="m13 2-9 12h8l-1 8 9-12h-8l1-8Z"/>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    close: <><path d="m18 6-12 12"/><path d="m6 6 12 12"/></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    wallet: <><path d="M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v12H5a3 3 0 0 1-3-3V6"/><path d="M16 14h.01"/></>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
    play: <path d="m8 5 11 7-11 7V5Z"/>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function Avatar({ creator, small = false }: { creator: { initials: string; color: string }; small?: boolean }) {
  return <div className={`avatar avatar-${creator.color} ${small ? "avatar-small" : ""}`}>{creator.initials}</div>;
}

function MatchPill({ score }: { score: number }) {
  return <span className={`match-pill ${score < 70 ? "match-low" : ""}`}><Icon name="spark" size={13}/>{score}% match</span>;
}

function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: UserSession) => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const authenticate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes("@") || password.length < (mode === "signup" ? 8 : 6)) {
      setError(`Enter a valid email and a password of at least ${mode === "signup" ? 8 : 6} characters.`);
      return;
    }
    if (mode === "signup" && name.trim().length < 2) {
      setError("Enter your full name.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const registerResponse = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), email: cleanEmail, password }),
        });
        const registerResult = await registerResponse.json() as { error?: string };
        if (!registerResponse.ok) {
          setError(registerResult.error ?? "Account could not be created.");
          return;
        }
      }
      const result = await signIn("credentials", {
        email: cleanEmail,
        password,
        redirect: false,
      });
      if (!result?.ok) {
        setError(mode === "signup" ? "Account created, but sign-in failed. Try signing in." : "Incorrect email or password. Try again or use the demo account.");
        return;
      }
      const authSession = await getSession();
      const sessionEmail = authSession?.user?.email?.trim();
      if (!sessionEmail) {
        setError("The session could not be created. Please try again.");
        return;
      }
      onAuthenticated({
        email: sessionEmail,
        name: authSession?.user?.name?.trim() || sessionEmail.split("@")[0],
      });
    } catch {
      setError("Could not reach the sign-in service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return <main className="auth-shell">
    <section className="auth-story">
      <div className="brand auth-brand"><span className="brand-mark"><Icon name="spark" size={19}/></span><span>Influence<em>AI</em></span></div>
      <div className="auth-story-copy">
        <span className="auth-kicker"><i/> Creator intelligence platform</span>
        <h1>Find the signal.<br/><em>Move culture.</em></h1>
        <p>Discover credible creators, predict campaign fit, and prove the business impact of every collaboration.</p>
      </div>
      <div className="auth-signal" aria-hidden="true"><span/><span/><span/><i/><i/></div>
      <p className="auth-caption"><Icon name="shield" size={14}/> Explainable AI · Audience fraud detection · Outcome attribution</p>
    </section>
    <section className="auth-panel">
      <div className="auth-card">
        <div className="auth-mobile-logo"><span className="brand-mark"><Icon name="spark" size={18}/></span><strong>Influence AI</strong></div>
        <span className="eyebrow">Secure brand workspace</span>
        <h2>{mode === "signin" ? "Welcome back." : "Create your account."}</h2>
        <p>{mode === "signin" ? "Sign in to continue to creator intelligence." : "Use your work email to join the Influence workspace."}</p>
        <div className="auth-tabs"><button type="button" className={mode === "signin" ? "active" : ""} onClick={() => { setMode("signin"); setError(""); }}>Sign in</button><button type="button" className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setError(""); }}>Create account</button></div>
        <form onSubmit={authenticate} className="auth-form">
          {mode === "signup" && <label><span>Full name</span><input value={name} onChange={event => setName(event.target.value)} autoComplete="name" placeholder="Your name" maxLength={60}/></label>}
          <label><span>Work email</span><input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" placeholder="you@company.com"/></label>
          <label><span>Password</span><input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder={mode === "signup" ? "Minimum 8 characters" : "Your password"}/></label>
          {error && <div className="auth-error"><Icon name="shield" size={15}/>{error}</div>}
          <button className="primary-button wide auth-submit" disabled={loading}>{loading ? <><span className="button-spinner"/>{mode === "signup" ? "Creating account…" : "Checking account…"}</> : <>{mode === "signup" ? "Create account" : "Sign in to Influence"}<Icon name="arrow" size={16}/></>}</button>
        </form>
        <p className="auth-security"><Icon name="shield" size={13}/>Accounts are secured through Supabase; your chosen name appears throughout the workspace.</p>
      </div>
    </section>
  </main>;
}

function Overview({ onNewCampaign, onSelectCreator, onNavigate, userName, campaigns, outreachCount }: {
  onNewCampaign: () => void;
  onSelectCreator: (creator: Creator) => void;
  onNavigate: (view: View) => void;
  userName: string;
  campaigns: Campaign[];
  outreachCount: number;
}) {
  const [range, setRange] = useState<"30d" | "6m" | "12m">("6m");
  const metrics = useMemo(() => workspaceMetrics(campaigns), [campaigns]);
  const activeCampaigns = campaigns.filter(campaign => campaign.status !== "Complete");
  const featuredCampaign = activeCampaigns[0] ?? campaigns[0];
  const rangeData = {
    "30d": { multiplier: .24, change: 8.6, labels: ["W1", "W2", "W3", "W4"], path: "M0 188 C145 176 205 132 300 148 C410 166 505 70 760 58" },
    "6m": { multiplier: 1, change: 24.8, labels: ["Mar", "Apr", "May", "Jun", "Jul", "Aug"], path: "M0 182 C70 172 94 145 153 151 C220 158 228 110 305 126 C375 141 396 84 458 96 C520 109 555 55 610 68 C670 82 700 28 760 40" },
    "12m": { multiplier: 1.82, change: 41.3, labels: ["Sep", "Nov", "Jan", "Mar", "May", "Aug"], path: "M0 201 C85 192 115 170 175 178 C245 188 280 130 360 142 C440 154 476 95 560 110 C640 123 690 50 760 40" },
  }[range];
  const chartValue = metrics.earnedMedia * rangeData.multiplier;
  const stats = [
    { label: "Active campaigns", value: String(activeCampaigns.length).padStart(2, "0"), change: `${campaigns.length} total campaigns`, icon: "megaphone" as IconName, tone: "violet" },
    { label: "Workspace users", value: String(outreachCount + 1).padStart(2, "0"), change: "Registered accounts", icon: "users" as IconName, tone: "cyan" },
    { label: "Earned media value", value: formatLakhs(metrics.earnedMedia), change: `${Math.round(metrics.averageProgress)}% average delivery`, icon: "chart" as IconName, tone: "lime" },
    { label: "Average ROAS", value: `${metrics.roas.toFixed(1)}×`, change: `${formatLakhs(metrics.budget)} managed budget`, icon: "bolt" as IconName, tone: "coral" },
  ];

  return <>
    <section className="page-heading">
      <div>
        <div className="live-label"><span/> Live workspace · updates instantly</div>
        <h1>Good morning, {userName.split(" ")[0]}.</h1>
        <p>Here’s the signal behind your creator campaigns.</p>
      </div>
      <button className="primary-button" onClick={onNewCampaign}><Icon name="spark" size={17}/>New AI match</button>
    </section>

    <section className="stat-grid">
      {stats.map((stat) => <article className="stat-card" key={stat.label}>
        <div className={`stat-icon tone-${stat.tone}`}><Icon name={stat.icon}/></div>
        <div className="stat-copy"><p>{stat.label}</p><strong>{stat.value}</strong><span>{stat.change}</span></div>
      </article>)}
    </section>

    <section className="overview-grid">
      <article className="panel performance-card">
        <div className="panel-head">
          <div><span className="eyebrow">Performance pulse</span><h2>Campaign impact</h2></div>
          <select aria-label="Chart time range" value={range} onChange={event => setRange(event.target.value as "30d" | "6m" | "12m")}><option value="30d">Last 30 days</option><option value="6m">Last 6 months</option><option value="12m">Last 12 months</option></select>
        </div>
        <div className="chart-summary"><strong>{formatLakhs(chartValue)}</strong><span><b>↑ {rangeData.change}%</b> earned media value</span></div>
        <div className="area-chart" aria-label="Earned media value chart rising from March to August">
          <svg viewBox="0 0 760 230" preserveAspectRatio="none" role="img">
            <defs>
              <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d8ff61" stopOpacity=".28"/><stop offset="1" stopColor="#d8ff61" stopOpacity="0"/></linearGradient>
            </defs>
            <g className="grid-lines"><path d="M0 30H760M0 85H760M0 140H760M0 195H760"/></g>
            <path className="chart-fill" d={`${rangeData.path} L760 230 L0 230 Z`}/>
            <path className="chart-line" d={rangeData.path}/>
          </svg>
          <div className="chart-labels">{rangeData.labels.map(label => <span key={label}>{label}</span>)}</div>
        </div>
      </article>

      <article className="panel campaign-pulse">
        <div className="panel-head"><div><span className="eyebrow">Active campaign</span><h2>{featuredCampaign?.name ?? "Create your first campaign"}</h2></div>{featuredCampaign && <span className="status-live"><i/>{featuredCampaign.status}</span>}</div>
        <div className="campaign-brand"><div className="brand-orb">{featuredCampaign ? initialsFor(featuredCampaign.brand) : "IA"}</div><div><strong>{featuredCampaign?.brand ?? "Influence AI"}</strong><span>{featuredCampaign ? `${featuredCampaign.category} · Live workspace` : "Ready for a campaign brief"}</span></div></div>
        <div className="progress-wrap">
          <div className="progress-ring" style={{ background: `conic-gradient(var(--lime) 0 ${featuredCampaign?.progress ?? 0}%, #252b36 ${featuredCampaign?.progress ?? 0}% 100%)` }}><div><strong>{featuredCampaign?.progress ?? 0}%</strong><span>complete</span></div></div>
          <div className="progress-stats">
            <p><span>Budget used</span><strong>{featuredCampaign ? `${formatLakhs(budgetInLakhs(featuredCampaign.budget) * featuredCampaign.progress / 100)} / ${featuredCampaign.budget}` : "₹0 / ₹0"}</strong></p>
            <p><span>Creators live</span><strong>{featuredCampaign ? `${Math.max(1, Math.round(featuredCampaign.creators * featuredCampaign.progress / 100))} / ${featuredCampaign.creators}` : "0 / 0"}</strong></p>
            <p><span>Projected reach</span><strong>{featuredCampaign?.reach ?? "—"}</strong></p>
          </div>
        </div>
        <button className="secondary-button wide" onClick={() => onNavigate("campaigns")}>Open campaign <Icon name="arrow" size={16}/></button>
      </article>
    </section>

    <section className="lower-grid">
      <article className="panel shortlist-panel">
        <div className="panel-head">
          <div><span className="eyebrow">AI shortlist</span><h2>Best-fit creators</h2></div>
          <button className="text-button" onClick={() => onNavigate("discover")}>View all <Icon name="arrow" size={15}/></button>
        </div>
        <div className="creator-list">
          {creators.slice(0, 4).map((creator) => <button className="creator-row" key={creator.id} onClick={() => onSelectCreator(creator)}>
            <Avatar creator={creator}/>
            <div className="creator-main"><strong>{creator.name}{creator.verified && <span className="verify"><Icon name="check" size={10}/></span>}</strong><span>{creator.handle} · {creator.niche}</span></div>
            <div className="creator-metric"><span>Engagement</span><strong>{creator.engagement}</strong></div>
            <MatchPill score={creator.match}/>
            <Icon name="chevron" size={18}/>
          </button>)}
        </div>
      </article>

      <article className="panel insight-panel">
        <div className="insight-glow"/>
        <div className="insight-icon"><Icon name="spark"/></div>
        <span className="eyebrow">Influence AI</span>
        <h2>One useful signal.</h2>
        <p>Micro-creators in your skincare cohort are producing <strong>2.4× higher saves</strong> at 38% lower cost than macro accounts.</p>
        <div className="insight-proof"><Icon name="shield" size={18}/><span>Based on 14,280 verified posts</span></div>
        <button className="inverse-button" onClick={() => onNavigate("analytics")}>See the evidence <Icon name="arrow" size={15}/></button>
      </article>
    </section>
  </>;
}

function Discover({ onSelectCreator, favorites, toggleFavorite, search, onSearch }: {
  onSelectCreator: (creator: Creator) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  search: string;
  onSearch: (value: string) => void;
}) {
  const [filter, setFilter] = useState("All");
  const [highConfidenceOnly, setHighConfidenceOnly] = useState(false);
  const filtered = useMemo(() => creators.filter((creator) =>
    (filter === "All" || creator.niche === filter) &&
    (!highConfidenceOnly || creator.match >= 90) &&
    `${creator.name} ${creator.handle} ${creator.niche}`.toLowerCase().includes(search.toLowerCase())
  ), [filter, highConfidenceOnly, search]);
  return <>
    <section className="page-heading compact-heading">
      <div><span className="eyebrow">Creator graph</span><h1>Discover real influence.</h1><p>Ranked by audience truth, relevance, and predicted conversion—not vanity metrics.</p></div>
      <div className="trust-badge"><Icon name="shield" size={18}/><span><strong>12,480</strong> verified creators</span></div>
    </section>
    <label className="directory-search"><Icon name="search" size={17}/><input value={search} onChange={event => onSearch(event.target.value)} placeholder="Search by creator, handle, or niche…"/><span>{filtered.length} results</span></label>
    <div className="filter-row">
      <div className="filter-chips">{["All", "Skincare", "Tech", "Food", "Fitness"].map(item => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div>
      <button className={`secondary-button ${highConfidenceOnly ? "filter-active" : ""}`} onClick={() => setHighConfidenceOnly(current => !current)}><Icon name="target" size={16}/>{highConfidenceOnly ? "90%+ match only" : "High-confidence only"}</button>
    </div>
    <section className="creator-grid">
      {filtered.map((creator) => <article className="creator-card" key={creator.id}>
        <div className="creator-card-top">
          <Avatar creator={creator}/>
          <button className={`icon-button ${favorites.includes(creator.id) ? "is-favorite" : ""}`} aria-label={`Favorite ${creator.name}`} onClick={() => toggleFavorite(creator.id)}><Icon name="heart" size={17}/></button>
        </div>
        <div className="creator-title"><div><h3>{creator.name}{creator.verified && <span className="verify"><Icon name="check" size={10}/></span>}</h3><p>{creator.handle} · {creator.location}</p></div><MatchPill score={creator.match}/></div>
        <div className="tag-line"><span>{creator.niche}</span><span>Authentic audience</span></div>
        <div className="creator-stats"><div><span>Followers</span><strong>{creator.followers}</strong></div><div><span>Engagement</span><strong>{creator.engagement}</strong></div><div><span>Est. fee</span><strong>{creator.cost}</strong></div></div>
        {creator.flagged && <div className="risk-note"><Icon name="shield" size={15}/>Engagement anomaly detected</div>}
        <button className="card-action" onClick={() => onSelectCreator(creator)}>View intelligence <Icon name="arrow" size={15}/></button>
      </article>)}
    </section>
    {!filtered.length && <section className="panel empty-state"><Icon name="search" size={24}/><h2>No creators found</h2><p>Try a different name, niche, or confidence filter.</p><button className="secondary-button" onClick={() => { onSearch(""); setFilter("All"); setHighConfidenceOnly(false); }}>Clear filters</button></section>}
  </>;
}

function Campaigns({ onNewCampaign, campaigns, onOpenCampaign }: { onNewCampaign: () => void; campaigns: Campaign[]; onOpenCampaign: (campaign: Campaign) => void }) {
  return <>
    <section className="page-heading compact-heading"><div><span className="eyebrow">Campaign command</span><h1>From brief to business impact.</h1><p>Every creator, deliverable, payment, and outcome in one view.</p></div><button className="primary-button" onClick={onNewCampaign}><Icon name="plus" size={17}/>Create campaign</button></section>
    <section className="campaign-grid">
      {campaigns.map((campaign) => <article className="campaign-card" key={campaign.id}>
        <div className="campaign-card-head"><div className="campaign-mark" style={{ background: campaign.color }}>{campaign.brand.split(" ").map(x => x[0]).join("")}</div><span className={`campaign-status status-${campaign.status.toLowerCase()}`}><i/>{campaign.status}</span></div>
        <span className="eyebrow">{campaign.brand} · {campaign.category}</span><h2>{campaign.name}</h2>
        <div className="campaign-progress"><div><span>Progress</span><strong>{campaign.progress}%</strong></div><div className="progress-bar"><i style={{ width: `${campaign.progress}%`, background: campaign.color }}/></div></div>
        <div className="campaign-numbers"><div><Icon name="wallet" size={16}/><span>Budget</span><strong>{campaign.budget}</strong></div><div><Icon name="users" size={16}/><span>Creators</span><strong>{campaign.creators}</strong></div><div><Icon name="target" size={16}/><span>Reach</span><strong>{campaign.reach}</strong></div></div>
        <button className="card-action" onClick={() => onOpenCampaign(campaign)}>Open workspace <Icon name="arrow" size={15}/></button>
      </article>)}
    </section>
  </>;
}

function LiveOverview({ userName, campaigns, users, onNewCampaign, onNavigate, onMessageUser }: { userName: string; campaigns: Campaign[]; users: Thread[]; onNewCampaign: () => void; onNavigate: (view: View) => void; onMessageUser: (user: Thread) => void }) {
  const activeCampaigns = campaigns.filter(campaign => campaign.status !== "Complete");
  const assignedUsers = new Set(campaigns.flatMap(campaign => campaignCreatorIds(campaign))).size;
  const averageProgress = campaigns.length ? Math.round(campaigns.reduce((sum, campaign) => sum + campaign.progress, 0) / campaigns.length) : 0;
  const stats = [
    { label: "Active campaigns", value: String(activeCampaigns.length).padStart(2, "0"), change: `${campaigns.length} created in the workspace`, icon: "megaphone" as IconName, tone: "violet" },
    { label: "Workspace users", value: String(users.length + 1).padStart(2, "0"), change: "Real registered accounts", icon: "users" as IconName, tone: "cyan" },
    { label: "Assigned users", value: String(assignedUsers).padStart(2, "0"), change: "Across live campaigns", icon: "check" as IconName, tone: "lime" },
    { label: "Average progress", value: `${averageProgress}%`, change: "Calculated from live campaigns", icon: "chart" as IconName, tone: "coral" },
  ];
  return <>
    <section className="page-heading"><div><div className="live-label"><span/> Live Supabase workspace</div><h1>Good morning, {userName.split(" ")[0]}.</h1><p>Everything below is calculated from registered users and campaigns your team created.</p></div><button className="primary-button" onClick={onNewCampaign}><Icon name="plus" size={17}/>Create campaign</button></section>
    <section className="stat-grid">{stats.map(stat => <article className="stat-card" key={stat.label}><div className={`stat-icon tone-${stat.tone}`}><Icon name={stat.icon}/></div><div className="stat-copy"><p>{stat.label}</p><strong>{stat.value}</strong><span>{stat.change}</span></div></article>)}</section>
    <section className="lower-grid">
      <article className="panel shortlist-panel"><div className="panel-head"><div><span className="eyebrow">Latest activity</span><h2>Real campaigns</h2></div><button className="text-button" onClick={() => onNavigate("campaigns")}>View all <Icon name="arrow" size={15}/></button></div><div className="creator-list">{campaigns.slice(0, 4).map(campaign => <button className="creator-row" key={campaign.id} onClick={() => onNavigate("campaigns")}><div className="campaign-mark" style={{background:campaign.color}}>{initialsFor(campaign.brand)}</div><div className="creator-main"><strong>{campaign.name}</strong><span>{campaign.brand} · {campaign.category}</span></div><div className="creator-metric"><span>Members</span><strong>{campaign.creators}</strong></div><span className={`campaign-status status-${campaign.status.toLowerCase()}`}><i/>{campaign.status}</span><Icon name="chevron" size={18}/></button>)}{!campaigns.length && <div className="dynamic-empty"><Icon name="megaphone" size={25}/><strong>No campaigns yet</strong><span>Create the first campaign—nothing is pre-filled.</span></div>}</div></article>
      <article className="panel shortlist-panel"><div className="panel-head"><div><span className="eyebrow">Team directory</span><h2>Registered users</h2></div><button className="text-button" onClick={() => onNavigate("discover")}>Discover <Icon name="arrow" size={15}/></button></div><div className="creator-list">{users.slice(0, 4).map(user => <button className="creator-row" key={user.id} onClick={() => onMessageUser(user)}><Avatar creator={user}/><div className="creator-main"><strong>{user.name}</strong><span>{user.email}</span></div><span className="profile-verified"><Icon name="check" size={12}/>Registered</span><Icon name="chevron" size={18}/></button>)}{!users.length && <div className="dynamic-empty"><Icon name="users" size={25}/><strong>No other users yet</strong><span>New sign-ups will appear automatically.</span></div>}</div></article>
    </section>
  </>;
}

function UserDiscover({ users, search, onSearch, onMessage }: { users: Thread[]; search: string; onSearch: (value: string) => void; onMessage: (user: Thread) => void }) {
  const filtered = users.filter(user => `${user.name} ${user.email}`.toLowerCase().includes(search.toLowerCase()));
  return <>
    <section className="page-heading compact-heading"><div><span className="eyebrow">Live account directory</span><h1>Discover workspace users.</h1><p>Every profile below belongs to a real registered Influence account.</p></div><div className="trust-badge"><Icon name="shield" size={18}/><span><strong>{users.length}</strong> registered users</span></div></section>
    <label className="directory-search"><Icon name="search" size={17}/><input value={search} onChange={event => onSearch(event.target.value)} placeholder="Search by name or email…"/><span>{filtered.length} results</span></label>
    <section className="creator-grid">{filtered.map(user => <article className="creator-card user-account-card" key={user.id}><div className="creator-card-top"><Avatar creator={user}/><span className="profile-verified"><Icon name="check" size={12}/>Registered</span></div><div className="creator-title"><div><h3>{user.name}</h3><p>{user.email}</p></div></div><div className="tag-line"><span>Influence user</span><span>Available in app</span></div><button className="card-action" onClick={() => onMessage(user)}>Message in app <Icon name="message" size={15}/></button></article>)}</section>
    {!filtered.length && <section className="panel empty-state"><Icon name="users" size={24}/><h2>No registered users found</h2><p>Try another name or ask the person to create an account.</p><button className="secondary-button" onClick={() => onSearch("")}>Clear search</button></section>}
  </>;
}

function LiveCampaigns({ onNewCampaign, campaigns, onOpenCampaign }: { onNewCampaign: () => void; campaigns: Campaign[]; onOpenCampaign: (campaign: Campaign) => void }) {
  return <>
    <section className="page-heading compact-heading"><div><span className="eyebrow">Live campaign workspace</span><h1>Your team’s campaigns.</h1><p>Only campaigns actually created in this app appear here.</p></div><button className="primary-button" onClick={onNewCampaign}><Icon name="plus" size={17}/>Create campaign</button></section>
    <section className="campaign-grid">{campaigns.map(campaign => <article className="campaign-card" key={campaign.id}><div className="campaign-card-head"><div className="campaign-mark" style={{background:campaign.color}}>{initialsFor(campaign.brand)}</div><span className={`campaign-status status-${campaign.status.toLowerCase()}`}><i/>{campaign.status}</span></div><span className="eyebrow">{campaign.brand} · {campaign.category}</span><h2>{campaign.name}</h2><div className="campaign-progress"><div><span>Progress</span><strong>{campaign.progress}%</strong></div><div className="progress-bar"><i style={{width:`${campaign.progress}%`,background:campaign.color}}/></div></div><div className="campaign-numbers"><div><Icon name="wallet" size={16}/><span>Budget</span><strong>{campaign.budget}</strong></div><div><Icon name="users" size={16}/><span>Assigned</span><strong>{campaign.creators}</strong></div><div><Icon name="shield" size={16}/><span>Created by</span><strong>{campaign.ownerEmail?.split("@")[0] ?? "User"}</strong></div></div><button className="card-action" onClick={() => onOpenCampaign(campaign)}>Open workspace <Icon name="arrow" size={15}/></button></article>)}</section>
    {!campaigns.length && <section className="panel empty-state"><Icon name="megaphone" size={28}/><h2>No campaigns yet</h2><p>Create a real campaign and then assign registered users to it.</p><button className="primary-button" onClick={onNewCampaign}><Icon name="plus" size={16}/>Create first campaign</button></section>}
  </>;
}

function Inbox({ threads, currentUser, onSend, onReceive, onMarkRead, activeThreadId }: { threads: Thread[]; currentUser: UserSession; onSend: (threadId: string, text: string) => Promise<boolean>; onReceive: (threadId: string, messages: ThreadMessage[]) => void; onMarkRead: (threadId: string) => void; activeThreadId?: string | null }) {
  const [activeId, setActiveId] = useState<string | null>(activeThreadId ?? threads[0]?.id ?? null);
  const [draft, setDraft] = useState("");
  const [directorySearch, setDirectorySearch] = useState("");
  const [sending, setSending] = useState(false);
  const [chatState, setChatState] = useState<"connecting" | "live" | "error">("connecting");
  const receiveEffectEvent = useEffectEvent(onReceive);

  const activeThread = threads.find(thread => thread.id === activeId) ?? threads[0] ?? null;
  const resolvedThreadId = activeThread?.id ?? "";
  const recipientEmail = activeThread?.email ?? "";

  useEffect(() => {
    if (!resolvedThreadId || !recipientEmail) return;
    let mounted = true;
    const load = async (firstLoad = false) => {
      if (firstLoad) setChatState("connecting");
      try {
        const response = await fetch(`/api/chat?recipientEmail=${encodeURIComponent(recipientEmail)}`, { cache: "no-store" });
        const payload = await response.json() as { messages?: ThreadMessage[] };
        if (!mounted) return;
        if (!response.ok) {
          setChatState("error");
          return;
        }
        receiveEffectEvent(resolvedThreadId, payload.messages ?? []);
        setChatState("live");
      } catch {
        if (mounted) setChatState("error");
      }
    };
    void load(true);
    const poll = window.setInterval(() => void load(false), 1500);

    return () => {
      mounted = false;
      window.clearInterval(poll);
    };
  }, [resolvedThreadId, recipientEmail]);

  const selectThread = (threadId: string) => {
    setActiveId(threadId);
    onMarkRead(threadId);
  };
  const send = async () => {
    if (!activeThread || !draft.trim() || sending) return;
    setSending(true);
    const sent = await onSend(activeThread.id, draft.trim());
    if (sent) setDraft("");
    setSending(false);
  };
  const filteredThreads = threads.filter(thread => `${thread.name} ${thread.email}`.toLowerCase().includes(directorySearch.toLowerCase()));

  return <>
    <section className="page-heading compact-heading"><div><span className="eyebrow">Influence chat</span><h1>One workspace. Real conversations.</h1><p>Find registered Influence users and message them directly inside the app.</p></div><span className={`workspace-saved chat-${chatState}`}><i/>{chatState === "live" ? "Live across browsers" : chatState === "connecting" ? "Connecting live chat…" : "Chat connection issue"}</span></section>
    <section className="inbox-shell panel">
      <div className="thread-list">
        <div className="thread-list-head"><h2>People</h2><span>{threads.length} users</span></div>
        <label className="user-search"><Icon name="search" size={15}/><input value={directorySearch} onChange={event => setDirectorySearch(event.target.value)} placeholder="Find a user…"/></label>
        {filteredThreads.map(thread => <button className={`thread-item ${activeThread?.id === thread.id ? "active" : ""}`} key={thread.id} onClick={() => selectThread(thread.id)}>
          <Avatar creator={{ initials: thread.initials, color: thread.color }} small/>
          <div><strong>{thread.name}{thread.unread && <i/>}</strong><span>{thread.text || thread.email}</span></div><time>{thread.time}</time>
        </button>)}
        {!filteredThreads.length && <div className="user-directory-empty"><Icon name="users" size={22}/><strong>No users found</strong><span>Ask them to create an account first.</span></div>}
      </div>
      {activeThread ? <div className="conversation">
        <div className="conversation-head"><Avatar creator={{ initials: activeThread.initials, color: activeThread.color }} small/><div><strong>{activeThread.name}</strong><span>{activeThread.email} · {chatState === "live" ? "Live now" : "Connecting"}</span></div></div>
        <div className="messages-stage">
          <div className="date-chip">Today</div>
          {activeThread.messages.map(message => { const outgoing = message.senderEmail ? message.senderEmail.toLowerCase() === currentUser.email.toLowerCase() : message.from === "brand"; return <div className={`message-bubble ${outgoing ? "outgoing" : "incoming"}`} key={message.id}>{message.senderName && <b className="message-sender">{outgoing ? "You" : message.senderName}</b>}{message.text}<span>{message.time}</span></div>; })}
          {!activeThread.messages.length && <div className="conversation-empty"><Icon name="message" size={24}/><strong>Start a conversation</strong><span>Your messages with {activeThread.name} will appear here on both devices.</span></div>}
        </div>
        <div className="message-compose"><input aria-label="Message" value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === "Enter") void send(); }} placeholder={`Message ${activeThread.name.split(" ")[0]}…`}/><button className="send-button" aria-label="Send message" disabled={sending} onClick={() => void send()}>{sending ? <span className="button-spinner"/> : <Icon name="send" size={17}/>}</button></div>
      </div> : <div className="conversation no-user-selected"><Icon name="users" size={30}/><strong>No other registered users yet</strong><span>Create another account, then refresh this page.</span></div>}
    </section>
  </>;
}

function Analytics({ campaigns }: { campaigns: Campaign[] }) {
  const [rangeIndex, setRangeIndex] = useState(1);
  const metrics = useMemo(() => workspaceMetrics(campaigns), [campaigns]);
  const ranges = [
    { label: "Last 30 days", multiplier: .22, change: 8.4 },
    { label: "Last 6 months", multiplier: 1, change: 31.2 },
    { label: "Last 12 months", multiplier: 1.76, change: 48.7 },
  ];
  const range = ranges[rangeIndex];
  const revenue = metrics.earnedMedia * 1.35 * range.multiplier;
  const averageAuthenticity = creators.reduce((sum, creator) => sum + creator.authenticity, 0) / creators.length;
  const qualified = Math.round(Math.min(96, averageAuthenticity + metrics.averageProgress * .05));
  const highIntent = Math.round(qualified * .71);
  const relevant = qualified - highIntent;
  const suspect = 100 - qualified;
  const cpe = Math.max(.8, 2.45 - metrics.averageProgress * .008);
  const channels = [
    { n: "App campaigns", share: .47, c: "#d8ff61" },
    { n: "Creator links", share: .35, c: "#8b7cff" },
    { n: "Referral codes", share: .12, c: "#55d9cd" },
    { n: "Other", share: .06, c: "#ff8b72" },
  ];
  const uplift = Math.round(8 + metrics.averageProgress * .14);
  return <>
    <section className="page-heading compact-heading"><div><span className="eyebrow">Decision intelligence</span><h1>Prove what influenced growth.</h1><p>Metrics recalculate from campaign delivery, budget, and audience quality.</p></div><button className="secondary-button" onClick={() => setRangeIndex(current => (current + 1) % ranges.length)} aria-label="Change analytics date range"><Icon name="calendar" size={16}/>{range.label}</button></section>
    <section className="analytics-summary"><article><span>Creator-attributed revenue</span><strong>{formatLakhs(revenue)}</strong><small>↑ {range.change}%</small></article><article><span>Cost per engagement</span><strong>₹{cpe.toFixed(2)}</strong><small>↓ {(metrics.averageProgress * .22).toFixed(1)}%</small></article><article><span>Qualified audience</span><strong>{qualified}%</strong><small>{creators.length} profiles verified</small></article></section>
    <section className="analytics-grid">
      <article className="panel channel-chart"><div className="panel-head"><div><span className="eyebrow">Attribution</span><h2>Revenue by channel</h2></div></div><div className="bar-chart">
        {channels.map(row => <div className="bar-row" key={row.n}><span>{row.n}</span><div><i style={{width:`${Math.round(row.share / channels[0].share * 100)}%`,background:row.c}}/></div><strong>{formatLakhs(revenue * row.share)}</strong></div>)}
      </div></article>
      <article className="panel audience-card"><div className="panel-head"><div><span className="eyebrow">Audience truth</span><h2>Quality mix</h2></div></div><div className="donut-wrap"><div className="quality-donut" style={{background:`conic-gradient(var(--lime) 0 ${highIntent}%, var(--violet) ${highIntent}% ${qualified}%, #2c3340 ${qualified}% 100%)`}}><div><strong>{qualified}%</strong><span>qualified</span></div></div><div className="donut-legend"><p><i className="lime"/><span>High-intent audience</span><strong>{highIntent}%</strong></p><p><i className="violet"/><span>Relevant audience</span><strong>{relevant}%</strong></p><p><i className="muted"/><span>Low quality / suspect</span><strong>{suspect}%</strong></p></div></div></article>
    </section>
    <section className="panel experiment-card"><div><span className="eyebrow">Learning engine</span><h2>Your campaigns are getting smarter.</h2><p>Based on {campaigns.length} campaigns at {Math.round(metrics.averageProgress)}% average delivery, educational hooks and creator-led demonstrations are the strongest-performing pattern.</p></div><div className="learning-score"><strong>+{uplift}%</strong><span>predicted uplift next campaign</span></div></section>
  </>;
}

function ProfilePage({ session, campaigns, threads, onSave, onSignOut }: { session: UserSession; campaigns: Campaign[]; threads: Thread[]; onSave: (message: string) => void; onSignOut: () => void }) {
  const [profile, setProfile] = useState({ brand: `${session.name.split(" ")[0]} Creator Studio`, role: "Campaign Lead", chatAlerts: true, weeklyReport: true });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(userStorageKey(storageKeys.profile, session.email));
    if (!stored) return;
    try {
      const storedProfile = JSON.parse(stored) as { brand?: string; role?: string; chatAlerts?: boolean; weeklyReport?: boolean };
      // Hydrate device-specific preferences after the profile page mounts.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfile(current => ({
        brand: storedProfile.brand || current.brand,
        role: storedProfile.role || current.role,
        chatAlerts: typeof storedProfile.chatAlerts === "boolean" ? storedProfile.chatAlerts : current.chatAlerts,
        weeklyReport: typeof storedProfile.weeklyReport === "boolean" ? storedProfile.weeklyReport : current.weeklyReport,
      }));
    } catch {
      localStorage.removeItem(userStorageKey(storageKeys.profile, session.email));
    }
  }, [session.email]);

  const saveProfile = () => {
    localStorage.setItem(userStorageKey(storageKeys.profile, session.email), JSON.stringify(profile));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
    onSave("Profile and notification preferences saved.");
  };

  const activeCampaigns = campaigns.filter(campaign => campaign.status !== "Complete").length;
  return <>
    <section className="page-heading compact-heading"><div><span className="eyebrow">Account & workspace</span><h1>Your profile.</h1><p>Manage the identity, workspace details, and notifications connected to this account.</p></div><span className="workspace-saved"><Icon name="shield" size={14}/>Supabase account</span></section>
    <section className="profile-layout">
      <article className="panel profile-identity-card">
        <div className="profile-avatar-large">{initialsFor(session.name)}</div>
        <div><span className="eyebrow">Signed-in identity</span><h2>{session.name}</h2><p>{session.email}</p><span className="profile-verified"><Icon name="check" size={13}/>Authenticated account</span></div>
      </article>
      <article className="panel profile-stats">
        <div><span>Active campaigns</span><strong>{activeCampaigns}</strong><small>{campaigns.length} total</small></div>
        <div><span>App contacts</span><strong>{threads.length}</strong><small>{threads.filter(thread => thread.unread).length} unread</small></div>
        <div><span>Workspace users</span><strong>{threads.length + 1}</strong><small>registered accounts</small></div>
      </article>
      <article className="panel profile-settings">
        <div className="panel-head"><div><span className="eyebrow">Workspace profile</span><h2>How your team sees you</h2></div></div>
        <div className="profile-form-grid"><label><span>Display name</span><input value={session.name} readOnly/><small>Synced from your authenticated account</small></label><label><span>Account email</span><input value={session.email} readOnly/><small>Used to separate your saved workspace</small></label><label><span>Brand / workspace</span><input value={profile.brand} onChange={event => setProfile(current => ({ ...current, brand: event.target.value }))} maxLength={60}/></label><label><span>Role</span><input value={profile.role} onChange={event => setProfile(current => ({ ...current, role: event.target.value }))} maxLength={60}/></label></div>
      </article>
      <article className="panel profile-preferences">
        <div className="panel-head"><div><span className="eyebrow">Preferences</span><h2>Stay in the loop</h2></div></div>
        <label className="preference-row"><span><strong>In-app chat alerts</strong><small>Notify me when another user replies inside Influence.</small></span><input type="checkbox" checked={profile.chatAlerts} onChange={event => setProfile(current => ({ ...current, chatAlerts: event.target.checked }))}/><i/></label>
        <label className="preference-row"><span><strong>Weekly performance report</strong><small>Summarise campaign delivery and attributed impact.</small></span><input type="checkbox" checked={profile.weeklyReport} onChange={event => setProfile(current => ({ ...current, weeklyReport: event.target.checked }))}/><i/></label>
        <div className="profile-actions"><button className="secondary-button profile-signout" onClick={onSignOut}>Sign out</button><button className="primary-button" onClick={saveProfile}><Icon name={saved ? "check" : "arrow"} size={16}/>{saved ? "Saved" : "Save profile"}</button></div>
      </article>
    </section>
  </>;
}

function CreatorDrawer({ creator, campaigns, onClose, isFavorite, toggleFavorite, onSend, onToggleAssignment }: {
  creator: Creator;
  campaigns: Campaign[];
  onClose: () => void;
  isFavorite: boolean;
  toggleFavorite: () => void;
  onSend: (creator: Creator) => void;
  onToggleAssignment: (campaignId: string, creatorId: string) => void;
}) {
  const [drafted, setDrafted] = useState(false);
  const scores = [{name:"Audience authenticity",value:creator.authenticity},{name:"Brief relevance",value:creator.relevance},{name:"Conversion signal",value:creator.conversion}];
  return <div className="drawer-layer" role="dialog" aria-modal="true" aria-label={`${creator.name} intelligence profile`}>
    <button className="drawer-scrim" onClick={onClose} aria-label="Close creator profile"/>
    <aside className="creator-drawer">
      <div className="drawer-head"><span>Creator intelligence</span><button className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close" size={18}/></button></div>
      <div className="profile-hero"><Avatar creator={creator}/><div><h2>{creator.name}{creator.verified && <span className="verify"><Icon name="check" size={10}/></span>}</h2><p>{creator.handle} · {creator.location}</p></div><button className={`icon-button ${isFavorite ? "is-favorite" : ""}`} onClick={toggleFavorite}><Icon name="heart" size={18}/></button></div>
      <div className="profile-match"><div><MatchPill score={creator.match}/><span>Recommended for Monsoon Reset</span></div><strong>{creator.cost}<small>estimated fee</small></strong></div>
      {creator.flagged && <div className="warning-card"><Icon name="shield"/><div><strong>Audience anomaly detected</strong><span>Follower growth and engagement are inconsistent with peer benchmarks.</span></div></div>}
      <div className="score-section"><span className="eyebrow">Why this match</span>{scores.map(score => <div className="score-row" key={score.name}><div><span>{score.name}</span><strong>{score.value}%</strong></div><div><i style={{width:`${score.value}%`}}/></div></div>)}</div>
      <div className="profile-facts"><div><span>Followers</span><strong>{creator.followers}</strong></div><div><span>Engagement</span><strong>{creator.engagement}</strong></div><div><span>Primary niche</span><strong>{creator.niche}</strong></div><div><span>Audience</span><strong>{creator.audience}</strong></div></div>
      <div className="tone-card"><span className="eyebrow">Content signature</span><p>{creator.tone}</p></div>
      <div className="creator-assignment"><span className="eyebrow">Campaign assignments</span>{campaigns.filter(campaign => campaign.status !== "Complete").map(campaign => { const assigned = campaignCreatorIds(campaign).includes(creator.id); return <div key={campaign.id}><span><strong>{campaign.name}</strong><small>{campaign.brand}</small></span><button className={assigned ? "remove-assignment" : ""} onClick={() => onToggleAssignment(campaign.id, creator.id)}>{assigned ? "Remove" : "Assign"}</button></div>; })}</div>
      {drafted ? <div className="draft-card"><div><span className="eyebrow">AI outreach draft</span><button onClick={() => setDrafted(false)}>Edit</button></div><p>Hi {creator.name.split(" ")[0]}, your {creator.niche.toLowerCase()} storytelling and strong audience trust make you a standout fit for Luma Skin’s Monsoon Reset. We’d love to collaborate on a creator-led launch…</p><button className="primary-button wide" onClick={() => onSend(creator)}><Icon name="message" size={16}/>Open in-app chat</button></div> : <button className="primary-button wide drawer-cta" onClick={() => setDrafted(true)}><Icon name="spark" size={17}/>Draft in-app message</button>}
    </aside>
  </div>;
}

function NewCampaignModal({ onClose, onComplete }: { onClose: () => void; onComplete: (campaign: Campaign) => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("Technology");
  const [budget, setBudget] = useState("₹50K – ₹1L");
  const [objective, setObjective] = useState("");
  const createCampaign = async () => {
    setError("");
    if (!name.trim() || !brand.trim() || !objective.trim()) {
      setError("Campaign name, brand, and objective are required.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, brand, category, budget, objective }) });
      const payload = await response.json() as { campaign?: Campaign; error?: string };
      if (!response.ok || !payload.campaign) throw new Error(payload.error ?? "Campaign could not be created.");
      onComplete(payload.campaign);
    } catch (campaignError) {
      setError(campaignError instanceof Error ? campaignError.message : "Campaign could not be created.");
      setSaving(false);
    }
  };
  return <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Create campaign"><button className="drawer-scrim" onClick={onClose} aria-label="Close"/><div className="match-modal"><div className="modal-head"><div className="modal-icon"><Icon name="megaphone"/></div><div><span className="eyebrow">Real campaign</span><h2>Create a workspace campaign.</h2></div><button className="icon-button" onClick={onClose}><Icon name="close" size={18}/></button></div><div className="brief-form"><div className="form-grid"><label><span>Campaign name</span><input value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Product launch"/></label><label><span>Brand</span><input value={brand} onChange={event => setBrand(event.target.value)} placeholder="Brand name"/></label></div><div className="form-grid"><label><span>Category</span><select value={category} onChange={event => setCategory(event.target.value)}><option>Technology</option><option>Skincare</option><option>Fitness</option><option>Food</option><option>Travel</option><option>Other</option></select></label><label><span>Budget</span><select value={budget} onChange={event => setBudget(event.target.value)}><option>₹50K – ₹1L</option><option>₹1L – ₹3L</option><option>₹3L – ₹5L</option><option>₹5L+</option></select></label></div><label><span>Campaign objective</span><textarea value={objective} onChange={event => setObjective(event.target.value)} placeholder="What should this campaign achieve?"/></label>{error && <div className="auth-error"><Icon name="shield" size={15}/>{error}</div>}<div className="ai-note"><Icon name="shield" size={17}/><span>This campaign will be saved in Supabase and visible to the workspace.</span></div><button className="primary-button wide" disabled={saving} onClick={() => void createCampaign()}>{saving ? <><span className="button-spinner"/>Saving campaign…</> : <><Icon name="plus" size={17}/>Create campaign</>}</button></div></div></div>;
}

function LiveCampaignWorkspace({ campaign, users, onClose, onAdvance, onToggleUser, onMessageUser }: { campaign: Campaign; users: Thread[]; onClose: () => void; onAdvance: (campaignId: string) => Promise<void>; onToggleUser: (campaignId: string, userEmail: string) => Promise<void>; onMessageUser: (user: Thread) => void }) {
  const assignedEmails = campaignCreatorIds(campaign);
  const assignedUsers = users.filter(user => assignedEmails.includes(user.email));
  const availableUsers = users.filter(user => !assignedEmails.includes(user.email));
  return <div className="modal-layer" role="dialog" aria-modal="true" aria-label={`${campaign.name} campaign workspace`}><button className="drawer-scrim" onClick={onClose} aria-label="Close"/><div className="campaign-modal"><div className="modal-head"><div className="campaign-mark" style={{background:campaign.color}}>{initialsFor(campaign.brand)}</div><div><span className="eyebrow">Live campaign workspace</span><h2>{campaign.name}</h2></div><button className="icon-button" onClick={onClose}><Icon name="close" size={18}/></button></div><div className="campaign-modal-summary"><div><span>Status</span><strong>{campaign.status}</strong></div><div><span>Budget</span><strong>{campaign.budget}</strong></div><div><span>Created by</span><strong>{campaign.ownerEmail ?? "Workspace user"}</strong></div></div><div className="campaign-objective"><span className="eyebrow">Campaign objective</span><p>{campaign.objective}</p></div><div className="campaign-progress modal-progress"><div><span>Delivery progress</span><strong>{campaign.progress}%</strong></div><div className="progress-bar"><i style={{width:`${campaign.progress}%`,background:campaign.color}}/></div></div><div className="campaign-work-grid"><div><div className="assignment-heading"><span className="eyebrow">Assigned users · {assignedUsers.length}</span></div>{assignedUsers.length ? assignedUsers.map(user => <div className="mini-creator creator-manage-row" key={user.id}><Avatar creator={user} small/><div><strong>{user.name}</strong><span>{user.email}</span></div><div><button aria-label={`Chat with ${user.name}`} onClick={() => onMessageUser(user)}><Icon name="message" size={13}/></button><button className="remove-creator" aria-label={`Remove ${user.name}`} onClick={() => void onToggleUser(campaign.id, user.email)}><Icon name="close" size={13}/></button></div></div>) : <p className="assignment-empty">No registered users assigned yet.</p>}<span className="eyebrow available-label">Available registered users</span>{availableUsers.map(user => <div className="mini-creator creator-manage-row" key={user.id}><Avatar creator={user} small/><div><strong>{user.name}</strong><span>{user.email}</span></div><button className="assign-creator" onClick={() => void onToggleUser(campaign.id, user.email)}><Icon name="plus" size={13}/>Assign</button></div>)}</div><div><span className="eyebrow">Milestones</span>{["Campaign created","Team assigned","Work in progress","Campaign complete"].map((step,index) => { const done = campaign.progress >= [0,25,50,100][index]; return <div className={`milestone ${done ? "done" : ""}`} key={step}><span>{done ? <Icon name="check" size={12}/> : index + 1}</span><strong>{step}</strong></div>; })}</div></div><button className="primary-button wide" onClick={() => void onAdvance(campaign.id)} disabled={campaign.progress >= 100}><Icon name={campaign.progress >= 100 ? "check" : "arrow"} size={16}/>{campaign.progress >= 100 ? "Campaign complete" : "Advance campaign by 25%"}</button></div></div>;
}

function LiveCommandPalette({ onClose, onNavigate, onSelectUser, onSelectCampaign, campaigns, users }: { onClose: () => void; onNavigate: (view: View) => void; onSelectUser: (user: Thread) => void; onSelectCampaign: (campaign: Campaign) => void; campaigns: Campaign[]; users: Thread[] }) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const matchingViews = navItems.filter(item => item.label.toLowerCase().includes(normalized));
  const matchingUsers = users.filter(user => `${user.name} ${user.email}`.toLowerCase().includes(normalized)).slice(0, normalized ? 4 : 2);
  const matchingCampaigns = campaigns.filter(campaign => `${campaign.name} ${campaign.brand} ${campaign.category}`.toLowerCase().includes(normalized)).slice(0, normalized ? 4 : 2);
  const hasResults = matchingViews.length + matchingUsers.length + matchingCampaigns.length > 0;
  return <div className="modal-layer command-layer" role="dialog" aria-modal="true" aria-label="Quick navigation"><button className="drawer-scrim" onClick={onClose} aria-label="Close"/><div className="command-palette"><div className="command-input"><Icon name="search"/><input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Search views, users, campaigns…"/><kbd>ESC</kbd></div>{matchingViews.length > 0 && <><span className="command-label">Jump to</span>{matchingViews.map(item => <button key={item.id} onClick={() => {onNavigate(item.id);onClose();}}><span><Icon name={item.icon}/>{item.label}</span><Icon name="arrow" size={15}/></button>)}</>}{matchingUsers.length > 0 && <><span className="command-label">Registered users</span>{matchingUsers.map(user => <button key={user.id} onClick={() => {onSelectUser(user);onClose();}}><span><Avatar creator={user} small/>{user.name} · {user.email}</span><Icon name="arrow" size={15}/></button>)}</>}{matchingCampaigns.length > 0 && <><span className="command-label">Campaigns</span>{matchingCampaigns.map(campaign => <button key={campaign.id} onClick={() => {onNavigate("campaigns");onSelectCampaign(campaign);onClose();}}><span><Icon name="megaphone" size={16}/>{campaign.name} · {campaign.brand}</span><Icon name="arrow" size={15}/></button>)}</>}{!hasResults && <div className="command-empty">No matching views, users, or campaigns.</div>}</div></div>;
}

function Matchmaker({ onClose, onComplete }: { onClose: () => void; onComplete: (campaign: Campaign) => void }) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [name, setName] = useState("Monsoon Reset · Phase 2");
  const [brand, setBrand] = useState("Luma Skin");
  const [category, setCategory] = useState("Skincare");
  const [budget, setBudget] = useState("₹1L – ₹3L");
  const [objective, setObjective] = useState("Drive high-intent trials for a humidity-proof sunscreen among women 18–30 in metro India.");
  const run = async () => {
    setError("");
    if (!name.trim() || !brand.trim() || !objective.trim()) {
      setError("Campaign name, brand, and objective are required.");
      return;
    }
    setRunning(true);
    setProgress(18);
    const steps = [43, 71, 100];
    steps.forEach((value, index) => window.setTimeout(() => setProgress(value), 450 * (index + 1)));
    try {
      const [response] = await Promise.all([
        fetch("/api/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), brand: brand.trim(), category, objective: objective.trim(), budget }),
        }),
        new Promise(resolve => window.setTimeout(resolve, 1500)),
      ]);
      const result = await response.json() as { campaign?: Campaign; error?: string };
      if (!response.ok || !result.campaign) throw new Error(result.error ?? "Matching failed.");
      setProgress(100);
      window.setTimeout(() => onComplete(result.campaign as Campaign), 260);
    } catch (matchError) {
      setRunning(false);
      setProgress(0);
      setError(matchError instanceof Error ? matchError.message : "Matching failed. Please try again.");
    }
  };
  return <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Create an AI campaign match"><button className="drawer-scrim" onClick={onClose} aria-label="Close"/><div className="match-modal">
    <div className="modal-head"><div className="modal-icon"><Icon name="spark"/></div><div><span className="eyebrow">Influence AI matchmaker</span><h2>Turn a brief into a shortlist.</h2></div><button className="icon-button" onClick={onClose}><Icon name="close" size={18}/></button></div>
    {running ? <div className="matching-state"><div className="scan-orb"><Icon name="spark" size={28}/><i/></div><h3>Reading the signal…</h3><p>{progress < 43 ? "Understanding campaign intent" : progress < 71 ? "Verifying audience quality" : progress < 100 ? "Predicting creator fit" : "Shortlist ready"}</p><div className="scan-progress"><i style={{width:`${progress}%`}}/></div><span>{progress}% · scoring 12,480 creators</span></div> : <div className="brief-form">
      <div className="form-grid"><label><span>Campaign name</span><input value={name} onChange={event => setName(event.target.value)}/></label><label><span>Brand</span><input value={brand} onChange={event => setBrand(event.target.value)}/></label></div>
      <div className="form-grid"><label><span>Category</span><select value={category} onChange={event => setCategory(event.target.value)}><option>Skincare</option><option>Technology</option><option>Fitness</option><option>Food</option></select></label><label><span>Budget</span><select value={budget} onChange={event => setBudget(event.target.value)}><option>₹50K – ₹1L</option><option>₹1L – ₹3L</option><option>₹3L – ₹5L</option></select></label></div>
      <label><span>What outcome matters?</span><textarea value={objective} onChange={event => setObjective(event.target.value)}/></label>
      {error && <div className="auth-error"><Icon name="shield" size={15}/>{error}</div>}
      <div className="ai-note"><Icon name="shield" size={17}/><span>Influence scores content fit, audience truth, predicted conversion, and budget efficiency.</span></div>
      <button className="primary-button wide" onClick={run}><Icon name="spark" size={17}/>Find best-fit creators</button>
    </div>}
  </div></div>;
}

function CampaignWorkspace({ campaign, onClose, onAdvance, onToggleCreator, onMessageCreator }: { campaign: Campaign; onClose: () => void; onAdvance: (campaignId: string) => void; onToggleCreator: (campaignId: string, creatorId: string) => void; onMessageCreator: (creator: Creator) => void }) {
  const assignedIds = campaignCreatorIds(campaign);
  const assignedCreators = assignedIds.map(id => creators.find(creator => creator.id === id)).filter((creator): creator is Creator => Boolean(creator));
  const availableCreators = creators.filter(creator => !assignedIds.includes(creator.id));
  return <div className="modal-layer" role="dialog" aria-modal="true" aria-label={`${campaign.name} campaign workspace`}><button className="drawer-scrim" onClick={onClose} aria-label="Close"/><div className="campaign-modal">
    <div className="modal-head"><div className="campaign-mark" style={{background: campaign.color}}>{campaign.brand.split(" ").map(part => part[0]).join("").slice(0,2)}</div><div><span className="eyebrow">Campaign workspace</span><h2>{campaign.name}</h2></div><button className="icon-button" onClick={onClose}><Icon name="close" size={18}/></button></div>
    <div className="campaign-modal-summary"><div><span>Status</span><strong>{campaign.status}</strong></div><div><span>Budget</span><strong>{campaign.budget}</strong></div><div><span>Projected reach</span><strong>{campaign.reach}</strong></div></div>
    <div className="campaign-objective"><span className="eyebrow">Campaign objective</span><p>{campaign.objective}</p></div>
    <div className="campaign-progress modal-progress"><div><span>Delivery progress</span><strong>{campaign.progress}%</strong></div><div className="progress-bar"><i style={{width:`${campaign.progress}%`,background:campaign.color}}/></div></div>
    <div className="campaign-work-grid"><div><div className="assignment-heading"><span className="eyebrow">Assigned creators · {assignedCreators.length}</span></div>{assignedCreators.length ? assignedCreators.map(creator => <div className="mini-creator creator-manage-row" key={creator.id}><Avatar creator={creator} small/><div><strong>{creator.name}</strong><span>{creator.niche} · {creator.match}% match</span></div><div><button aria-label={`Chat with ${creator.name}`} onClick={() => onMessageCreator(creator)}><Icon name="message" size={13}/></button><button className="remove-creator" aria-label={`Remove ${creator.name} from campaign`} onClick={() => onToggleCreator(campaign.id, creator.id)}><Icon name="close" size={13}/></button></div></div>) : <p className="assignment-empty">No creators assigned yet.</p>}<span className="eyebrow available-label">Available creators</span>{availableCreators.map(creator => <div className="mini-creator creator-manage-row" key={creator.id}><Avatar creator={creator} small/><div><strong>{creator.name}</strong><span>{creator.niche} · {creator.match}% match</span></div><button className="assign-creator" onClick={() => onToggleCreator(campaign.id, creator.id)}><Icon name="plus" size={13}/>Assign</button></div>)}</div><div><span className="eyebrow">Milestones</span>{["Brief approved","Creators shortlisted","Outreach active","Content live"].map((step,index) => { const done = campaign.progress >= [5,25,55,85][index]; return <div className={`milestone ${done ? "done" : ""}`} key={step}><span>{done ? <Icon name="check" size={12}/> : index + 1}</span><strong>{step}</strong></div>; })}</div></div>
    <button className="primary-button wide" onClick={() => onAdvance(campaign.id)} disabled={campaign.progress >= 100}><Icon name={campaign.progress >= 100 ? "check" : "arrow"} size={16}/>{campaign.progress >= 100 ? "Campaign complete" : "Advance to next milestone"}</button>
  </div></div>;
}

function CommandPalette({ onClose, onNavigate, onSelectCreator, onSelectCampaign, campaigns }: { onClose: () => void; onNavigate: (view: View) => void; onSelectCreator: (creator: Creator) => void; onSelectCampaign: (campaign: Campaign) => void; campaigns: Campaign[] }) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const matchingViews = navItems.filter(item => item.label.toLowerCase().includes(normalized));
  const matchingCreators = creators.filter(creator => `${creator.name} ${creator.handle} ${creator.niche}`.toLowerCase().includes(normalized)).slice(0, normalized ? 4 : 2);
  const matchingCampaigns = campaigns.filter(campaign => `${campaign.name} ${campaign.brand} ${campaign.category}`.toLowerCase().includes(normalized)).slice(0, normalized ? 4 : 2);
  const hasResults = matchingViews.length + matchingCreators.length + matchingCampaigns.length > 0;
  return <div className="modal-layer command-layer" role="dialog" aria-modal="true" aria-label="Quick navigation"><button className="drawer-scrim" onClick={onClose} aria-label="Close"/><div className="command-palette"><div className="command-input"><Icon name="search"/><input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Search views, creators, campaigns…"/><kbd>ESC</kbd></div>
    {matchingViews.length > 0 && <><span className="command-label">Jump to</span>{matchingViews.map(item => <button key={item.id} onClick={() => {onNavigate(item.id);onClose();}}><span><Icon name={item.icon}/>{item.label}</span><Icon name="arrow" size={15}/></button>)}</>}
    {matchingCreators.length > 0 && <><span className="command-label">Creators</span>{matchingCreators.map(creator => <button key={creator.id} onClick={() => { onNavigate("discover"); onSelectCreator(creator); onClose(); }}><span><Avatar creator={creator} small/>{creator.name} · {creator.niche}</span><Icon name="arrow" size={15}/></button>)}</>}
    {matchingCampaigns.length > 0 && <><span className="command-label">Campaigns</span>{matchingCampaigns.map(campaign => <button key={campaign.id} onClick={() => { onNavigate("campaigns"); onSelectCampaign(campaign); onClose(); }}><span><Icon name="megaphone" size={16}/>{campaign.name} · {campaign.brand}</span><Icon name="arrow" size={15}/></button>)}</>}
    {!hasResults && <div className="command-empty">No matching views, creators, or campaigns.</div>}
  </div></div>;
}

void Overview;
void Discover;
void Campaigns;
void CreatorDrawer;
void Matchmaker;
void CampaignWorkspace;
void CommandPalette;

export default function InfluenceApp() {
  const [authChecked, setAuthChecked] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [view, setView] = useState<View>("overview");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [matcherOpen, setMatcherOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [chatTarget, setChatTarget] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      try {
        const authSession = await getSession();
        const email = authSession?.user?.email?.trim();
        if (email) {
          const user = {
            email,
            name: authSession?.user?.name?.trim() || email.split("@")[0],
          };
          if (active) setSession(user);
        }
      } catch {
        setSession(null);
      } finally {
        if (active) {
          setAuthChecked(true);
        }
      }
    };
    void hydrate();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!session) return;
    let mounted = true;
    const loadUsers = async () => {
      try {
        const response = await fetch("/api/users", { cache: "no-store" });
        const payload = await response.json() as { users?: Array<{ id: string; name: string; email: string; initials: string; color: string }> };
        if (!mounted || !response.ok) return;
        setThreads(current => (payload.users ?? []).map(user => {
          const existing = current.find(thread => thread.id === user.id);
          return {
            ...user,
            time: existing?.time ?? "",
            text: existing?.text ?? "",
            unread: existing?.unread ?? false,
            messages: existing?.messages ?? [],
          };
        }));
      } catch {
        // The Inbox shows an empty state until the directory is reachable again.
      }
    };
    void loadUsers();
    const poll = window.setInterval(() => void loadUsers(), 10000);
    return () => {
      mounted = false;
      window.clearInterval(poll);
    };
  }, [session]);

  useEffect(() => {
    if (!session) return;
    let mounted = true;
    const loadCampaigns = async () => {
      try {
        const response = await fetch("/api/campaigns", { cache: "no-store" });
        const payload = await response.json() as { campaigns?: Campaign[] };
        if (mounted && response.ok) setCampaigns(payload.campaigns ?? []);
      } catch {
        // The campaign list retries automatically.
      }
    };
    void loadCampaigns();
    const poll = window.setInterval(() => void loadCampaigns(), 10000);
    return () => {
      mounted = false;
      window.clearInterval(poll);
    };
  }, [session]);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCommandOpen(true); }
      if (event.key === "Escape") { setCommandOpen(false); setSelectedCampaign(null); setMatcherOpen(false); setNotificationsOpen(false); }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  };
  const navigate = (next: View) => { setView(next); setSearch(""); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const openUserChat = (user: Thread) => {
    setSelectedCampaign(null);
    setChatTarget(user.id);
    navigate("inbox");
    notify(`In-app chat with ${user.name} is open.`);
  };
  const receiveMessages = (threadId: string, incoming: ThreadMessage[]) => {
    if (!incoming.length) return;
    setThreads(current => current.map(thread => {
      if (thread.id !== threadId) return thread;
      const known = new Set(thread.messages.map(message => message.id));
      const fresh = incoming.filter(message => !known.has(message.id));
      if (!fresh.length) return thread;
      const last = fresh[fresh.length - 1];
      return { ...thread, text: last.text, time: last.time, unread: Boolean(last.senderEmail && last.senderEmail.toLowerCase() !== session?.email.toLowerCase()), messages: [...thread.messages, ...fresh] };
    }));
  };
  const sendMessage = async (threadId: string, text: string) => {
    const recipient = threads.find(thread => thread.id === threadId);
    if (!recipient) {
      notify("Choose a registered user first.");
      return false;
    }
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipientEmail: recipient.email, text }) });
      const payload = await response.json() as { message?: ThreadMessage; error?: string };
      if (response.ok && payload.message) {
        receiveMessages(threadId, [payload.message]);
        return true;
      }
      notify(payload.error ?? "Message could not be sent.");
      return false;
    } catch {
      notify("Chat is temporarily unreachable. Try again.");
      return false;
    }
  };
  const markRead = (threadId: string) => setThreads(current => current.map(thread => thread.id === threadId ? { ...thread, unread: false } : thread));
  const completeMatch = (campaign: Campaign) => {
    setCampaigns(current => [campaign, ...current.filter(item => item.id !== campaign.id)]);
    setMatcherOpen(false);
    navigate("campaigns");
    notify(`${campaign.name} was created and saved to Supabase.`);
  };
  const advanceCampaign = async (campaignId: string) => {
    const response = await fetch("/api/campaigns", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: campaignId, action: "advance" }) });
    const payload = await response.json() as { campaign?: Campaign; error?: string };
    if (!response.ok || !payload.campaign) {
      notify(payload.error ?? "Campaign could not be updated.");
      return;
    }
    setCampaigns(current => current.map(campaign => campaign.id === campaignId ? payload.campaign as Campaign : campaign));
    setSelectedCampaign(payload.campaign);
    notify("Campaign progress updated for the whole workspace.");
  };
  const toggleCampaignUser = async (campaignId: string, userEmail: string) => {
    const response = await fetch("/api/campaigns", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: campaignId, action: "toggle-user", userEmail }) });
    const payload = await response.json() as { campaign?: Campaign; error?: string };
    if (!response.ok || !payload.campaign) {
      notify(payload.error ?? "Assignment could not be updated.");
      return;
    }
    setCampaigns(current => current.map(campaign => campaign.id === campaignId ? payload.campaign as Campaign : campaign));
    setSelectedCampaign(payload.campaign);
    notify("Campaign assignment updated for the whole workspace.");
  };
  const logout = async () => {
    await signOut({ redirect: false });
    setSession(null);
    setCampaigns([]);
    setThreads([]);
    setChatTarget(null);
    setView("overview");
  };
  const currentLabel = view === "profile" ? "Profile" : navItems.find(item => item.id === view)?.label ?? "Overview";
  const unreadCount = threads.filter(thread => thread.unread).length;
  const userInitials = session ? initialsFor(session.name) : "IA";

  if (!authChecked) return <main className="auth-loading"><span className="brand-mark"><Icon name="spark" size={22}/></span><strong>Influence AI</strong><i/></main>;
  if (!session) return <AuthScreen onAuthenticated={user => { setSession(user); setAuthChecked(true); }}/>

  return <main className="app-shell">
    <aside className="sidebar">
      <button className="brand" onClick={() => navigate("overview")}><span className="brand-mark"><Icon name="spark" size={19}/></span><span>Influence<em>AI</em></span></button>
      <nav aria-label="Primary navigation">{navItems.map(item => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => navigate(item.id)}><Icon name={item.icon}/><span>{item.label}</span>{item.id === "inbox" && unreadCount > 0 && <b>{unreadCount}</b>}</button>)}</nav>
      <div className="sidebar-spacer"/>
      <div className="demo-card"><span className="demo-icon"><Icon name="check" size={16}/></span><strong>Live workspace</strong><p>Users, campaigns, assignments, and messages are connected to Supabase.</p><span className="demo-status"><i/>Session active</span></div>
      <button className={`profile-button ${view === "profile" ? "active" : ""}`} onClick={() => navigate("profile")}><span>{userInitials}</span><div><strong>{session.name}</strong><small>{session.email}</small></div><Icon name="chevron" size={15}/></button>
    </aside>

    <div className="workspace">
      <header className="topbar"><div className="mobile-brand"><span className="brand-mark"><Icon name="spark" size={17}/></span><strong>Influence</strong></div><div className="breadcrumb"><span>Workspace</span><Icon name="chevron" size={13}/><strong>{currentLabel}</strong></div><button className="search-command" onClick={() => setCommandOpen(true)}><Icon name="search" size={17}/><span>Search users, campaigns…</span><kbd>⌘ K</kbd></button><div className="top-actions"><button className="icon-button notification" aria-label="Notifications" onClick={() => setNotificationsOpen(current => !current)}><Icon name="bell" size={18}/>{unreadCount > 0 && <i/>}</button><button className="help-button" onClick={() => notify("Create a campaign, assign a registered user, and coordinate in Inbox.")}>?</button><button className={`top-profile ${view === "profile" ? "active" : ""}`} aria-label="Open profile" onClick={() => navigate("profile")}>{userInitials}</button></div></header>
      <div className="page-content">
        {view === "overview" && <LiveOverview onNewCampaign={() => setMatcherOpen(true)} onNavigate={navigate} onMessageUser={openUserChat} userName={session.name} campaigns={campaigns} users={threads}/>} 
        {view === "discover" && <UserDiscover users={threads} search={search} onSearch={setSearch} onMessage={openUserChat}/>} 
        {view === "campaigns" && <LiveCampaigns onNewCampaign={() => setMatcherOpen(true)} campaigns={campaigns} onOpenCampaign={setSelectedCampaign}/>} 
        {view === "inbox" && <Inbox key={chatTarget ?? "inbox"} activeThreadId={chatTarget} threads={threads} currentUser={session} onSend={sendMessage} onReceive={receiveMessages} onMarkRead={markRead}/>} 
        {view === "analytics" && <Analytics campaigns={campaigns}/>} 
        {view === "profile" && <ProfilePage session={session} campaigns={campaigns} threads={threads} onSave={notify} onSignOut={logout}/>} 
      </div>
    </div>

    <nav className="mobile-nav" aria-label="Mobile navigation">{navItems.map(item => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => navigate(item.id)}><Icon name={item.icon} size={19}/><span>{item.label === "Campaigns" ? "Campaign" : item.label}</span></button>)}</nav>
    {selectedCampaign && <LiveCampaignWorkspace campaign={selectedCampaign} users={threads} onClose={() => setSelectedCampaign(null)} onAdvance={advanceCampaign} onToggleUser={toggleCampaignUser} onMessageUser={openUserChat}/>} 
    {matcherOpen && <NewCampaignModal onClose={() => setMatcherOpen(false)} onComplete={completeMatch}/>} 
    {commandOpen && <LiveCommandPalette onClose={() => setCommandOpen(false)} onNavigate={navigate} onSelectUser={openUserChat} onSelectCampaign={setSelectedCampaign} campaigns={campaigns} users={threads}/>} 
    {notificationsOpen && <div className="notification-panel"><div><strong>Notifications</strong><button onClick={() => { setThreads(current => current.map(thread => ({...thread,unread:false}))); setNotificationsOpen(false); }}>Mark all read</button></div><p><span className="tone-lime"><Icon name="message" size={15}/></span><b>{unreadCount || "No"} unread user {unreadCount === 1 ? "message" : "messages"}</b><small>Your inbox is synced with this workspace.</small></p><p><span className="tone-violet"><Icon name="megaphone" size={15}/></span><b>{campaigns.filter(campaign => campaign.status === "Live").length} campaigns are live</b><small>Open Campaigns to update milestones.</small></p></div>}
    {toast && <div className="toast"><span><Icon name="check" size={15}/></span>{toast}</div>}
  </main>;
}
