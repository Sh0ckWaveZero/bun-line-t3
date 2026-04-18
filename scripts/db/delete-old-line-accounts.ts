/**
 * Delete old LINE Login accounts (before linking channels)
 *
 * ใช้หลังจาก Link LINE Login channel กับ LINE Official Account
 * เพื่อให้ user login ใหม่ด้วย userId ที่ถูกต้อง
 */

import { db } from "../src/lib/database/db";

interface Account {
  id: string;
  userId: string;
  accountId: string;
}

async function main() {
  // userId เก่าที่ต้องการลบ
  const oldUserIds = [
    "U2b569682d48c37664b6d0b92c2179a7f",
    // เพิ่มได้ถ้ามีหลาย user
  ];

  console.log("🗑️  Deleting old LINE Login accounts...\n");

  for (const oldAccountId of oldUserIds) {
    console.log(`\n📍 Checking: ${oldAccountId}`);

    // 1. ตรวจสอบ account
    const account = (await db.account.findFirst({
      where: {
        providerId: "line",
        accountId: oldAccountId,
      },
    })) as Account | null;

    if (!account) {
      console.log(`  ⚠️  No account found - skip`);
      continue;
    }

    console.log(`  ✅ Found account: ${account.id} (userId: ${account.userId})`);

    // 2. ตรวจสอบ sessions ที่เกี่ยวข้อง
    const sessions = await db.session.findMany({
      where: { userId: account.userId },
      select: { id: true, expiresAt: true },
    });

    console.log(`  📊 Related sessions: ${sessions.length}`);

    if (sessions.length > 0) {
      console.log(`  🗑️  Deleting ${sessions.length} sessions...`);
      await db.session.deleteMany({
        where: { userId: account.userId },
      });
    }

    // 3. ลบ account
    console.log(`  🗑️  Deleting account...`);
    await db.account.delete({
      where: { id: account.id },
    });

    console.log(`  ✅ Deleted account ${account.id}`);
  }

  console.log("\n✅ Deletion completed!\n");
  console.log("💡 Next steps:");
  console.log("   1. Ask user to logout from web UI");
  console.log("   2. User login again with LINE");
  console.log("   3. Better-auth will create new account with correct userId");
  console.log("   4. DCA data will match automatically");
}

main()
  .then(() => {
    console.log("\n✅ Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
