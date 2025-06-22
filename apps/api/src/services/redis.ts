import { createClient } from "redis";

const client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
export const RedisClient = async() =>{
    try {
        console.log("Connecting to Redis");
        if(!client.isOpen){
            await client.connect();
        }
        console.log("Connected to Redis");
        return client;
    } catch (error) {
        console.error((error as Error).message);
        throw error;
    }
}