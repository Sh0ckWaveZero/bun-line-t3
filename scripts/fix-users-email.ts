import { db } from '../src/lib/database/db';

async function fixUsersEmail() {
  try {
    console.log('🔧 Finding users with null email...');
    
    const usersWithNullEmail = await db.user.findMany({
      where: { email: null },
    });

    console.log(`Found ${usersWithNullEmail.length} users with null email`);

    for (const user of usersWithNullEmail) {
      // Generate unique email based on user ID
      const uniqueEmail = `user-${user.id}@line-bot.local`;
      console.log(`Updating user ${user.id} with email: ${uniqueEmail}`);
      
      await db.user.update({
        where: { id: user.id },
        data: { email: uniqueEmail },
      });
    }

    console.log('✅ Users updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixUsersEmail();
