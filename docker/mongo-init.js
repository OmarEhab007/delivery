// This script initializes MongoDB replica set
// when running in a Docker container

// Wait for MongoDB to start
print('Waiting for MongoDB to start...');
sleep(5000);

// Initiate replica set
try {
  print('Checking replica set status...');
  const status = rs.status();
  print(`Replica set already initialized. Status: ${JSON.stringify(status)}`);
} catch (err) {
  // If error, initiate replica set
  print('Initializing replica set...');
  try {
    const config = {
      _id: 'rs0',
      members: [{ _id: 0, host: 'mongodb:27017' }],
    };
    rs.initiate(config);

    // Wait for replica set initialization
    sleep(5000);
    const status = rs.status();
    print(`Replica set initialized. Status: ${JSON.stringify(status)}`);
  } catch (initErr) {
    print(`Error initializing replica set: ${initErr}`);
  }
}

// Wait for primary
print('Waiting for replica set to elect primary...');
sleep(3000);

// Set up admin user
try {
  print('Setting up admin user...');
  const adminDb = db.getSiblingDB('admin');

  // Check if user already exists to avoid duplicate user error
  const adminUsers = adminDb.getUsers();
  const adminExists = adminUsers.users.some((user) => user.user === 'admin');

  if (!adminExists) {
    adminDb.createUser({
      user: 'admin',
      pwd: 'password',
      roles: [{ role: 'root', db: 'admin' }],
    });
    print('Admin user created successfully.');
  } else {
    print('Admin user already exists.');
  }
} catch (userErr) {
  print(`Error setting up admin user: ${userErr}`);
}

// Set up application database and user
try {
  print('Setting up application database and user...');
  const appDb = db.getSiblingDB('delivery-app');

  // Check if user already exists
  const appUsers = appDb.getUsers();
  const appUserExists = appUsers.users.some((user) => user.user === 'app_user');

  if (!appUserExists) {
    appDb.createUser({
      user: 'app_user',
      pwd: 'app_password',
      roles: [{ role: 'readWrite', db: 'delivery-app' }],
    });
    print('Application user created successfully.');
  } else {
    print('Application user already exists.');
  }
} catch (appUserErr) {
  print(`Error setting up application user: ${appUserErr}`);
}

print('MongoDB initialization completed successfully.');
