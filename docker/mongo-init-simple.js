// This script initializes MongoDB with basic users and collections
// Simple version without replica set configuration

print("Starting simplified MongoDB initialization...");

// Set up admin user
try {
  print("Setting up admin user...");
  const adminDb = db.getSiblingDB('admin');
  
  // Check if user already exists to avoid duplicate user error
  const adminUsers = adminDb.getUsers();
  const adminExists = adminUsers.users.some(user => user.user === 'admin');
  
  if (!adminExists) {
    adminDb.createUser({
      user: 'admin',
      pwd: 'password',
      roles: [{ role: 'root', db: 'admin' }]
    });
    print("Admin user created successfully.");
  } else {
    print("Admin user already exists.");
  }
} catch (userErr) {
  print("Error setting up admin user: " + userErr);
}

// Set up application database and user
try {
  print("Setting up application database and user...");
  const appDb = db.getSiblingDB('delivery-app');
  
  // Check if user already exists
  const appUsers = appDb.getUsers();
  const appUserExists = appUsers.users.some(user => user.user === 'app_user');
  
  if (!appUserExists) {
    appDb.createUser({
      user: 'app_user',
      pwd: 'app_password',
      roles: [{ role: 'readWrite', db: 'delivery-app' }]
    });
    print("Application user created successfully.");
  } else {
    print("Application user already exists.");
  }
  
  // Create initial collections if they don't exist
  if (!appDb.getCollectionNames().includes('users')) {
    appDb.createCollection('users');
    print("Created users collection.");
  }
  
  if (!appDb.getCollectionNames().includes('shipments')) {
    appDb.createCollection('shipments');
    print("Created shipments collection.");
  }
  
  if (!appDb.getCollectionNames().includes('trucks')) {
    appDb.createCollection('trucks');
    print("Created trucks collection.");
  }
  
} catch (appUserErr) {
  print("Error setting up application user: " + appUserErr);
}

print("MongoDB initialization completed successfully."); 