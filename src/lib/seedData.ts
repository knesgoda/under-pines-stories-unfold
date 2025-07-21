// Seed data for testing Under Pines locally
import { userStorage, postStorage } from './localStorage';

export const createSeedData = () => {
  // Check if we already have users
  const existingUsers = userStorage.getAll();
  if (existingUsers.length > 0) {
    return; // Data already exists
  }

  // Create test users
  const testUser1 = userStorage.create({
    username: 'demo',
    displayName: 'Demo User',
    email: 'demo@example.com',
    bio: 'Welcome to Under Pines! This is a demo account to test the social features.',
  });

  const testUser2 = userStorage.create({
    username: 'nature_lover',
    displayName: 'Nature Lover',
    email: 'nature@example.com',
    bio: 'Forest enthusiast and photographer. Love connecting with like-minded people!',
  });

  const testUser3 = userStorage.create({
    username: 'pine_explorer',
    displayName: 'Pine Explorer',
    email: 'explorer@example.com',
    bio: 'Adventure seeker exploring the great outdoors.',
  });

  // Create some test posts
  postStorage.create({
    userId: testUser2.id,
    content: "Just discovered this amazing platform! Love the nature-inspired design and privacy-first approach. Looking forward to connecting with fellow outdoor enthusiasts! 🌲",
  });

  postStorage.create({
    userId: testUser3.id,
    content: "Had an incredible hike through the pine forests today. There's something magical about being surrounded by these ancient trees. The quiet, the fresh air, the sense of connection to nature... Under Pines really captures that feeling!",
  });

  postStorage.create({
    userId: testUser1.id,
    content: "Welcome to Under Pines! 🎉 This is a demo of our Phase 1 features:\n\n✅ User authentication\n✅ Profile creation\n✅ Simple posting\n✅ Friend management\n\nEverything is stored locally for testing. Try creating your own account and connecting with others!",
  });

  console.log('Seed data created successfully!');
};