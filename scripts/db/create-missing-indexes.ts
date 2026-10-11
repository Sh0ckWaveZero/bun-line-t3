import { db } from "../../src/lib/database/db";
import { asRawDb } from "../lib/mongo-raw-db";

// สคริปต์ mongo-era — เหตุผลที่ต้อง cast อยู่ใน scripts/lib/mongo-raw-db.ts
const rawDb = asRawDb(db);

async function createMissingIndexes() {
  try {
    console.log("🔧 Creating missing indexes...\n");

    // Create users email index (allow null but unique non-null values)
    console.log("Creating users_email_key index...");
    try {
      await rawDb.$runCommandRaw({
        createIndexes: "users",
        indexes: [
          {
            key: { email: 1 },
            name: "users_email_key",
            unique: true,
            sparse: true, // Allow multiple null values
          },
        ],
      });
      console.log("✅ users_email_key created");
    } catch (e: any) {
      console.log(`  ${e.message}`);
    }

    // Create health activities indexes
    console.log("\nCreating health_activities indexes...");
    try {
      await rawDb.$runCommandRaw({
        createIndexes: "health_activities",
        indexes: [
          {
            key: { user_id: 1, date: 1 },
            name: "health_activities_user_id_date_idx",
          },
          {
            key: { user_id: 1, activity_type: 1 },
            name: "health_activities_user_id_activity_type_idx",
          },
        ],
      });
      console.log("✅ health_activities indexes created");
    } catch (e: any) {
      console.log(`  ${e.message}`);
    }

    // Create health metrics indexes
    console.log("\nCreating health_metrics indexes...");
    try {
      await rawDb.$runCommandRaw({
        createIndexes: "health_metrics",
        indexes: [
          {
            key: { user_id: 1, date: 1 },
            name: "health_metrics_user_id_date_key",
            unique: true,
          },
        ],
      });
      console.log("✅ health_metrics indexes created");
    } catch (e: any) {
      console.log(`  ${e.message}`);
    }

    console.log("\n✅ All indexes created successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

createMissingIndexes();
