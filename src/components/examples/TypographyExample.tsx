/**
 * 📝 Typography Usage Examples
 * แสดงตัวอย่างการใช้งาน Global Typography System
 */

"use client";

import React from "react";
import { useTypography } from "@/hooks/useTypography";

export const TypographyExample: React.FC = () => {
  const typography = useTypography();

  return (
    <div className="space-y-8 p-6">
      <div>
        <h2
          className={`${typography.classes.h2} ${typography.base.primary} mb-4`}
        >
          🎨 Global Typography System
        </h2>
        <p
          className={`${typography.classes.body} ${typography.base.secondary}`}
        >
          ระบบ Typography แบบรวมศูนย์ที่รองรับ light/dark theme
        </p>
      </div>

      {/* 📝 Base Typography */}
      <section>
        <h3
          className={`${typography.classes.h3} ${typography.base.primary} mb-3`}
        >
          Base Typography
        </h3>
        <div className="space-y-2">
          <p className={typography.base.primary}>Primary text (หลัก)</p>
          <p className={typography.base.secondary}>Secondary text (รอง)</p>
          <p className={typography.base.muted}>Muted text (จาง)</p>
          <p className={typography.base.subtle}>Subtle text (นุ่ม)</p>
        </div>
      </section>

      {/* 🚨 Status Typography */}
      <section>
        <h3
          className={`${typography.classes.h3} ${typography.base.primary} mb-3`}
        >
          Status Typography
        </h3>
        <div className="space-y-2">
          <p className={typography.status.success}>✅ Success message</p>
          <p className={typography.status.warning}>⚠️ Warning message</p>
          <p className={typography.status.error}>❌ Error message</p>
          <p className={typography.status.info}>ℹ️ Info message</p>
        </div>
      </section>

      {/* 🃏 Card Typography */}
      <section>
        <h3
          className={`${typography.classes.h3} ${typography.base.primary} mb-3`}
        >
          Card Typography Examples
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Blue Card */}
          <div className="rounded-lg border border-blue-200 bg-linear-to-br from-blue-50 to-blue-100 p-4 dark:border-blue-700 dark:from-blue-900/30 dark:to-blue-800/30">
            <h4
              className={`${typography.classes.cardHeader} ${typography.getCardClass("blue", "header")}`}
            >
              Blue Card Header
            </h4>
            <p
              className={`${typography.classes.cardNumber} ${typography.getCardClass("blue", "number")}`}
            >
              123
            </p>
            <p
              className={`${typography.classes.cardSubtext} ${typography.getCardClass("blue", "subtext")} mt-1`}
            >
              Blue subtext
            </p>
          </div>

          {/* Teal Card */}
          <div className="rounded-lg border border-teal-200 bg-linear-to-br from-teal-50 to-teal-100 p-4 dark:border-teal-700 dark:from-teal-900/30 dark:to-teal-800/30">
            <h4
              className={`${typography.classes.cardHeader} ${typography.getCardClass("teal", "header")}`}
            >
              Teal Card Header
            </h4>
            <p
              className={`${typography.classes.cardNumber} ${typography.getCardClass("teal", "number")}`}
            >
              456
            </p>
            <p
              className={`${typography.classes.cardSubtext} ${typography.getCardClass("teal", "subtext")} mt-1`}
            >
              Teal subtext
            </p>
          </div>

          {/* Emerald Card */}
          <div className="rounded-lg border border-emerald-200 bg-linear-to-br from-emerald-50 to-emerald-100 p-4 dark:border-emerald-700 dark:from-emerald-900/30 dark:to-emerald-800/30">
            <h4
              className={`${typography.classes.cardHeader} ${typography.getCardClass("emerald", "header")}`}
            >
              Emerald Card Header
            </h4>
            <p
              className={`${typography.classes.cardNumber} ${typography.getCardClass("emerald", "number")}`}
            >
              789
            </p>
            <p
              className={`${typography.classes.cardSubtext} ${typography.getCardClass("emerald", "subtext")} mt-1`}
            >
              Emerald subtext
            </p>
          </div>
        </div>
      </section>

      {/* 📚 Usage Guide */}
      <section>
        <h3
          className={`${typography.classes.h3} ${typography.base.primary} mb-3`}
        >
          วิธีใช้งาน (Usage)
        </h3>
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <pre
            className={`${typography.classes.small} ${typography.base.muted}`}
          >
            {`// 1. Import hook
const typography = useTypography();

// 2. Use base typography
<p className={typography.base.primary}>Primary text</p>

// 3. Use card typography
<h3 className={typography.getCardClass('blue', 'header')}>
  Card Header
</h3>

// 4. Use status typography
<p className={typography.status.success}>Success!</p>

// 5. Use typography classes
<h1 className={typography.classes.h1}>Heading</h1>`}
          </pre>
        </div>
      </section>

      <div className="border-t pt-4">
        <p className={`${typography.classes.small} ${typography.base.muted}`}>
          📱 Current theme:{" "}
          <strong>{typography.isDark ? "Dark" : "Light"}</strong>
        </p>
      </div>
    </div>
  );
};

export default TypographyExample;
