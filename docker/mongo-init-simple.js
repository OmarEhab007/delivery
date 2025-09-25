// This script initializes MongoDB with basic users and collections
// Simple version without replica set configuration. Values are driven from
// environment variables that are provided by docker-compose.prod.yml.

print('Starting simplified MongoDB initialization...');

function usersListContains(usersResult, username) {
  if (!usersResult) {
    return false;
  }

  if (Array.isArray(usersResult)) {
    return usersResult.some((user) => user.user === username);
  }

  if (Array.isArray(usersResult.users)) {
    return usersResult.users.some((user) => user.user === username);
  }

  return false;
}

const rootUsername = process.env.MONGO_INITDB_ROOT_USERNAME || 'admin';
const rootPassword = process.env.MONGO_INITDB_ROOT_PASSWORD || 'password';

try {
  print(`Ensuring admin user "${rootUsername}" exists...`);
  const adminDb = db.getSiblingDB('admin');
  const adminUsers = adminDb.getUsers();
  const adminExists = usersListContains(adminUsers, rootUsername);

  if (!adminExists) {
    adminDb.createUser({
      user: rootUsername,
      pwd: rootPassword,
      roles: [{ role: 'root', db: 'admin' }],
    });
    print('Admin user created successfully.');
  } else {
    print('Admin user already exists.');
  }
} catch (userErr) {
  print(`Error ensuring admin user: ${userErr}`);
}

const appDbName = process.env.APP_DB_NAME || 'delivery-app';
const appDbUser = process.env.APP_DB_USER || 'app_user';
const appDbPassword = process.env.APP_DB_PASSWORD || 'app_password';

try {
  print(`Ensuring application database "${appDbName}" and user exist...`);
  const appDb = db.getSiblingDB(appDbName);

  const appUsers = appDb.getUsers();
  const appUserExists = usersListContains(appUsers, appDbUser);

  if (!appUserExists) {
    appDb.createUser({
      user: appDbUser,
      pwd: appDbPassword,
      roles: [{ role: 'readWrite', db: appDbName }],
    });
    print('Application user created successfully.');
  } else {
    print('Application user already exists.');
  }

  // Create initial collections if they don't exist
  const existingCollections = appDb.getCollectionNames();

  if (!existingCollections.includes('users')) {
    appDb.createCollection('users');
    print('Created users collection.');
  }

  if (!existingCollections.includes('shipments')) {
    appDb.createCollection('shipments');
    print('Created shipments collection.');
  }

  if (!existingCollections.includes('trucks')) {
    appDb.createCollection('trucks');
    print('Created trucks collection.');
  }
} catch (appUserErr) {
  print(`Error setting up application user: ${appUserErr}`);
}

print('MongoDB initialization completed successfully.');
