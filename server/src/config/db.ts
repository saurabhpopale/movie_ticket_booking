import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState >= 1) {
      return;
    }

    let mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      if (!mongod) {
        console.log('⚡ No MONGODB_URI found in env. Starting MongoDB Memory Server...');
        mongod = await MongoMemoryServer.create();
        console.log(`✅ In-memory MongoDB started at: ${mongod.getUri()}`);
      }
      mongoUri = mongod.getUri();
    }

    await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected to: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
  } catch (error) {
    console.error('Error disconnecting MongoDB:', error);
  }
};
