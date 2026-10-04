// src/components/ui/modern-color-demo.tsx
"use client";

import { ModernColorDemoBookColors } from "@/components/ui/modern-color-demo-book-colors";
import { ModernColorDemoBookThemeCards } from "@/components/ui/modern-color-demo-book-theme-cards";
import { ModernColorDemoColorFamilies } from "@/components/ui/modern-color-demo-color-families";
import { ModernColorDemoDashboardCards } from "@/components/ui/modern-color-demo-dashboard-cards";
import { ModernColorDemoFooter } from "@/components/ui/modern-color-demo-footer";
import { ModernColorDemoHeader } from "@/components/ui/modern-color-demo-header";
import { ModernColorDemoInteractive } from "@/components/ui/modern-color-demo-interactive";
import { ModernColorDemoTextShowcase } from "@/components/ui/modern-color-demo-text-showcase";

/**
 * 🎨 Modern Color Scheme Demo Component
 * แสดงตัวอย่างสีใหม่ที่โมเดิร์นและสวยงาม
 */
export function ModernColorDemo() {
  return (
    <div className="bg-gradient-bg-light dark:bg-gradient-bg-dark min-h-screen p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* 🎯 Header */}
        <ModernColorDemoHeader />

        {/* 🔥 Gradient Cards - Main Dashboard Style */}
        <ModernColorDemoDashboardCards />

        {/* 🎨 Individual Color Showcase */}
        <ModernColorDemoColorFamilies />

        {/* 📚 Book Colors Section */}
        <ModernColorDemoBookColors />

        {/* 📖 Book Theme Demo Cards */}
        <ModernColorDemoBookThemeCards />

        {/* 🌟 Interactive Elements */}
        <ModernColorDemoInteractive />

        {/* 🔤 Ultra Dark Text Colors Showcase */}
        <ModernColorDemoTextShowcase />

        {/* 🔮 Footer */}
        <ModernColorDemoFooter />
      </div>
    </div>
  );
}

export default ModernColorDemo;
