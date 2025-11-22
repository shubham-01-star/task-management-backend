import mongoose from 'mongoose';

const connectDB = async () => {
  console.log('Entering connectDB function');
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in environment variables.');
    }
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected...');
  } catch (err) {
    // We explicitly cast err to an Error type for proper message access
    console.error((err as Error).message); 
    process.exit(1);
  }
};

export default connectDB;