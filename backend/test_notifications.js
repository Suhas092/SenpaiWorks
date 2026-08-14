const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTest() {
  try {
    console.log("Starting notification test...");
    
    // Get all users to send notifications to everyone
    const users = await prisma.user.findMany({ select: { email: true } });
    
    if (users.length === 0) {
      console.log("No users found in the database. Cannot send test notifications.");
      return;
    }
    
    console.log(`Found ${users.length} users. Sending test broadcasts...`);
    
    const categories = ['Studio', 'Orders', 'Community', 'Store', 'News'];
    
    for (const cat of categories) {
      const title = `[TEST] ${cat === 'Studio' ? 'All' : cat} Category Notification`;
      const message = `This is an automated test broadcast for the ${cat === 'Studio' ? 'All' : cat} category.`;
      
      // Follow the same logic as server.js
      let notifType = cat === 'Studio' ? 'admin_broadcast' : `admin_broadcast_${cat}`;
      if (cat === 'Community') {
        notifType = 'post_reply'; // Use a community type so it triggers the avatar logic
      }
      
      const actorAvatar = cat === 'Community' ? 'https://ui-avatars.com/api/?name=Senpai+User&background=random' : null;
      
      const inserts = users.map(u => ({
        userEmail: u.email,
        type: notifType,
        title,
        message,
        icon: '🔔',
        link: '/profile.html',
        actorAvatar: actorAvatar
      }));
      
      await prisma.notification.createMany({ data: inserts });
      console.log(`✅ Sent to ${cat} category.`);
    }
    
    console.log("All test notifications sent successfully!");
  } catch (err) {
    console.error("Error during test:", err);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
