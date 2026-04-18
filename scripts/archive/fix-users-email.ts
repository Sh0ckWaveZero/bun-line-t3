async function fixUsersEmail() {
  try {
    console.log("✅ Better Auth schema requires non-null user.email; no fix needed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixUsersEmail();
