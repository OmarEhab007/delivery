# Admin User Initialization

The delivery app automatically creates an admin user during the first run if no admin user exists in the database.

## Default Admin Credentials

The default admin credentials are set using environment variables. If these environment variables are not defined, the system will use the following default values:

- **Email**: admin@deliveryapp.com
- **Password**: admin123456
- **Name**: Admin User
- **Phone**: 1234567890

## Customizing Admin Credentials

To customize the default admin credentials, set the following environment variables in your `.env` file:

```
ADMIN_NAME=Custom Admin Name
ADMIN_EMAIL=custom@example.com
ADMIN_PASSWORD=secure_password_here
ADMIN_PHONE=9876543210
```

## Security Recommendations

For security reasons, it's strongly recommended to:

1. Use a strong, unique password for the admin account
2. Change the default admin credentials immediately after the first login
3. Delete or change the default admin account if it was created with default credentials

## Manual Admin Creation

If you need to manually create an admin user, you can run the following script:

```bash
node src/scripts/createAdminUser.js
```

This script will check if an admin user already exists, and if not, create one using the environment variables or default values. 