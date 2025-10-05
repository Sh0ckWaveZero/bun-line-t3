import { db } from "../src/lib/database/db";

async function fixSessionsIndex() {
  try {
    console.log("🔧 Checking sessions collection...");

    // ลบ sessions ที่ duplicate
    const duplicates = await db.session.groupBy({
      by: ["userId"],
      _count: {
        userId: true,
      },
      having: {
        userId: {
          _count: {
            gt: 1,
          },
        },
      },
    });

    console.log(`Found ${duplicates.length} duplicate userIds`);

    for (const dup of duplicates) {
      const sessions = await db.session.findMany({
        where: { userId: dup.userId },
        orderBy: { expires: "desc" },
      });

      // Keep latest, delete others
      for (let i = 1; i < sessions.length; i++) {
        const session = sessions[i];
        if (session) {
          console.log(`Deleting old session: ${session.id}`);
          await db.session.delete({
            where: { id: session.id },
          });
        }
      }
    }

    console.log("✅ Sessions cleaned up successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixSessionsIndex();
