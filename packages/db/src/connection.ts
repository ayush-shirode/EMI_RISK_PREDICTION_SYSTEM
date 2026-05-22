import mongoose from 'mongoose';

export async function connectDB(uri: string): Promise<typeof mongoose> {
  if (mongoose.connection.readyState >= 1) {
    return mongoose;
  }
  
  console.log('[packages/db] Connecting to MongoDB...');
  return mongoose.connect(uri);
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    console.log('[packages/db] Disconnecting from MongoDB...');
    await mongoose.disconnect();
  }
}
