import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";

dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

const uri = process.env.DATABASE_URL;

console.log("Testing connection to:", uri.replace(/:.+@/, ":****@"));

async function testConnection() {
    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log("✅ Successfully connected to MongoDB!");
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error("❌ Connection failed:");
        console.error(error);
        process.exit(1);
    }
}

testConnection();
