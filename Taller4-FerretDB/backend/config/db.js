import { MongoClient } from 'mongodb';

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
let dbInstance = null;

export async function connectDB() {
    try {
        await client.connect();
        console.log("> Conectado exitosamente a FerretDB");
        dbInstance = client.db("chat_db");
    } catch (error) {
        console.error("> Error al conectar a la base de datos:", error);
        throw error; 
    }
}

export const getDb = () => {
    if (!dbInstance) {
        throw new Error("Base de datos no inicializada. Llama a connectDB primero.");
    }
    return dbInstance;
};