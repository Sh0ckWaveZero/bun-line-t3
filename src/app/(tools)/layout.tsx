import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tools | LINE Bot Dashboard",
  description: "Utility tools and generators",
};

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
