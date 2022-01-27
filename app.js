import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb";
import dotenv from "dotenv"
import dayjs from 'dayjs';

dotenv.config();
dayjs().format()
const server = express();

server.use(express.json());
server.use(cors());

server.post("/participants", async (request, response) => {
    let mongoClient

    try{
        mongoClient = new MongoClient(process.env.MONGO_URI)
        await mongoClient.connect();

        const example = mongoClient.db("exemplo");
        const contactsCollection = example.collection('contatos');

        const participantName = request.body.name;
    
        if(participantName === ''){
            response.status(422).send("Todos os campos são obrigatórios!")
            return;
        }
        
        const contacts = await contactsCollection.find({}).toArray();
        const participantNameInUse = contacts.find(person => person.name === participantName)
    
        if(participantNameInUse){
            response.status(409).send("Nome em uso")
            return;
        }
    
        await contactsCollection.insertMany([
            {...request.body, lastStatus: Date.now()},
            {from: request.body.name, to: 'Todos', text: 'entra na sala...', type: 'status', time: `${dayjs().hour()}:${dayjs().minute()}:${dayjs().second()}'`} 
        ]);

        response.sendStatus(201);
        mongoClient.close()

    }catch{
        response.sendStatus(500)
        mongoClient.close();
    }
})

server.get("/participants", async (request, response) => {
    let mongoClient

    try{
        mongoClient = new MongoClient(process.env.MONGO_URI)
        await mongoClient.connect();
    
        const example = mongoClient.db("exemplo");
        const contactsCollection = example.collection('contatos');
        const contacts = await contactsCollection.find({}).toArray();
    
    
        response.send(contacts);
        mongoClient.close();

    } catch {

        response.sendStatus(500)
        mongoClient.close();
    }

})

server.post("/messages", (request, response) => {
    response.send("ok");
})

server.get("/messages", (request, response) => {
    response.send("ok");
})

server.post("/status", (request, response) => {
    response.send("ok");
})


server.listen(5000, () => console.log("Servidor iniciado em http://localhost:5000"));