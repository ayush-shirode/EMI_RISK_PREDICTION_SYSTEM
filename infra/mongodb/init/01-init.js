// Runs once when MongoDB container first starts
db = db.getSiblingDB('emi_system');

db.createCollection('predictions');
db.createCollection('spend_trends');
db.createCollection('suggestions');
db.createCollection('alert_logs');

db.predictions.createIndex({ user_id: 1, created_at: -1 });
db.predictions.createIndex({ prediction_id: 1 }, { unique: true });
db.spend_trends.createIndex({ user_id: 1, period: -1 });
db.suggestions.createIndex({ user_id: 1, dismissed: 1 });
db.alert_logs.createIndex({ user_id: 1, status: 1, created_at: -1 });

print('MongoDB emi_system database initialised');
