// This script initializes MongoDB replica set
// when running in a Docker container

// Wait for MongoDB to start
print("Waiting for MongoDB to start...");
sleep(5000);

// Initiate replica set
try {
  print("Checking replica set status...");
  const status = rs.status();
  print("Replica set already initialized. Status: " + JSON.stringify(status));
} catch (err) {
  // If error, initiate replica set
  print("Initializing replica set...");
  const config = {
    _id: "rs0",
    members: [
      { _id: 0, host: "mongodb:27017" }
    ]
  };
  rs.initiate(config);
  
  // Wait for replica set initialization
  sleep(3000);
  const status = rs.status();
  print("Replica set initialized. Status: " + JSON.stringify(status));
}

// Set up admin user
print("Setting up admin user...");
const adminDb = db.getSiblingDB('admin');
adminDb.createUser({
  user: 'admin',
  pwd: 'password',
  roles: [{ role: 'root', db: 'admin' }]
});

// Set up application database and user
print("Setting up application database and user...");
const appDb = db.getSiblingDB('delivery-app');
appDb.createUser({
  user: 'app_user',
  pwd: 'app_password',
  roles: [{ role: 'readWrite', db: 'delivery-app' }]
});

print("MongoDB initialization completed successfully."); 