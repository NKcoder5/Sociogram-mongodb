import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log('✅ MongoDB connected successfully...');
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
        
        if (!process.env.DATABASE_URL) {
            console.error('🚨 DATABASE_URL environment variable is not set!');
        }
        
        console.log('⚠️  Server will continue without database connection');
    }
}

export default connectDB;