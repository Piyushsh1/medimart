// MongoDB initialization script for MediMart
db = db.getSiblingDB('medimart');

// Create collections
db.createCollection('users');
db.createCollection('pharmacies');
db.createCollection('medicines');
db.createCollection('carts');
db.createCollection('orders');

// Create indexes for better performance
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });
db.pharmacies.createIndex({ "id": 1 }, { unique: true });
db.medicines.createIndex({ "id": 1 }, { unique: true });
db.medicines.createIndex({ "pharmacy_id": 1 });
db.carts.createIndex({ "user_id": 1 }, { unique: true });
db.orders.createIndex({ "id": 1 }, { unique: true });
db.orders.createIndex({ "user_id": 1 });
db.orders.createIndex({ "created_at": -1 });

print('MediMart database initialized successfully!');

