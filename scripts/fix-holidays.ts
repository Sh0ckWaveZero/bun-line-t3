import { db } from "../src/lib/database/db";

async function fixHolidays() {
  try {
    console.log("🔧 Finding duplicate holidays...");

    const holidays = await db.publicHoliday.findMany({
      orderBy: [
        { date: "asc" },
        { createdAt: "desc" }, // Keep newest
      ],
    });

    const seen = new Set<string>();
    const toDelete: string[] = [];

    for (const holiday of holidays) {
      if (seen.has(holiday.date)) {
        toDelete.push(holiday.id);
        console.log(
          `Will delete duplicate: ${holiday.date} - ${holiday.nameThai}`,
        );
      } else {
        seen.add(holiday.date);
      }
    }

    console.log(`\nDeleting ${toDelete.length} duplicates...`);

    for (const id of toDelete) {
      await db.publicHoliday.delete({ where: { id } });
    }

    console.log("✅ Holidays cleaned up");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixHolidays();
