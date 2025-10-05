import { db } from "../src/lib/database/db";

async function checkIndexes() {
  try {
    console.log("🔍 Checking database indexes...\n");

    // Get raw MongoDB connection
    const collections = [
      "users",
      "sessions",
      "accounts",
      "health_activities",
      "health_metrics",
    ];

    for (const collName of collections) {
      console.log(`\n📦 ${collName}:`);
      try {
        const result = await db.$runCommandRaw({
          listIndexes: collName,
        });
        console.log(JSON.stringify(result, null, 2));
      } catch (e: any) {
        console.log(`  Collection may not exist: ${e.message}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkIndexes();
