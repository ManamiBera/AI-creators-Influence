import type { Metadata } from "next";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://creators-influence.vercel.app/";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Creators Influence",
  description:
    "AI-powered creator intelligence for finding credible partners, launching campaigns, and proving business impact.",
  openGraph: {
    title: "Creators Influence",
    description:
      "Find the creators who move people—and prove the impact they create.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Influence — Find the signal. Move culture." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Creators Influence",
    description:
      "Find the creators who move people—and prove the impact they create.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
