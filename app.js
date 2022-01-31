import express from "express"
import cors from "cors"
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv"
import dayjs from 'dayjs';
import joi from "joi"

dotenv.config();
dayjs().format()
const server = express();
server.use(express.json());
server.use(cors());

const participantSchema = joi.object({
    name: joi.string().required()
})

const messagesSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().required()
})



server.post("/participants", async (request, response) => {
    let mongoClient
    const participantName = request.body;
    const validation = participantSchema.validate(participantName, {abortEarly:true});
    
    if(validation.error){
        response.status(422).send(validation.error.details)
        return;
    }
    
    
    try{
        mongoClient = new MongoClient(process.env.MONGO_URI)
        await mongoClient.connect();
        const batepapouol = mongoClient.db("batepapouol");
        const participantsCollection = batepapouol.collection('participants');
        const messagesCollection = batepapouol.collection('messages');
    
        const participants = await participantsCollection.find({}).toArray();
        const participantNameInUse = participants.find(person => person.name === participantName.name)
    
        if(participantNameInUse){
            response.status(409).send("Nome em uso")
            return;
        }
    
        await participantsCollection.insertOne({...request.body, lastStatus: Date.now()});
        await messagesCollection.insertOne({from: request.body.name, to: 'Todos', text: 'entra na sala...', type: 'status', time: `${dayjs().hour()}:${dayjs().minute()}:${dayjs().second()}'`})

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
    
        const batepapouol = mongoClient.db("batepapouol");
        const participantsCollection = batepapouol.collection('participants');
        const participants = await participantsCollection.find({}).toArray();
    
    
        response.send(participants);
        mongoClient.close();

    } catch {

        response.sendStatus(500)
        mongoClient.close();
    }

})

server.post("/messages", async (request, response) => {
    let mongoClient
    let messageReceived = request.body;
    const validation = messagesSchema.validate(messageReceived, {abortEarly:true});
    const messageFrom = request.headers.user;
    
    if(messageReceived.to !== "Todos"){
        messageReceived = {...request.body, type: "private_message"}
    }
    
    if(validation.error){
        response.status(422).send(validation.error.details)
        return;
    }
    
    if(messageReceived.type !== "private_message" && messageReceived.type !== "message"){
        response.status(422).send("Tipo da mensagem inválido");
        return;
    }
    
    try{
        mongoClient = new MongoClient(process.env.MONGO_URI)
        await mongoClient.connect();
        const batepapouol = mongoClient.db("batepapouol");
        const participantsCollection = batepapouol.collection('participants');
        const messagesCollection = batepapouol.collection('messages');
        
        const participants = await participantsCollection.find({}).toArray();
        const participantName = participants.find(person => person.name === messageFrom);
        
        if(participantName){

            if(messageReceived.type === "private_message"){
                await messagesCollection.insertOne({from: messageFrom, to: messageReceived.to, text: messageReceived.text, type: messageReceived.type, time: `${dayjs().hour()}:${dayjs().minute()}:${dayjs().second()}'`})  
            }else{
                await messagesCollection.insertOne({from: messageFrom, to: 'Todos', text: messageReceived.text, type: messageReceived.type, time: `${dayjs().hour()}:${dayjs().minute()}:${dayjs().second()}'`}) 
            }

        }
    

        response.sendStatus(201);
        mongoClient.close()

    }catch{
        response.sendStatus(500)
        mongoClient.close();
    }
})

server.get("/messages", async (request, response) => {
    
    let mongoClient
    const limit = parseInt(request.query.limit);
    const messageFrom = request.headers.user;
    
    try{
        mongoClient = new MongoClient(process.env.MONGO_URI)
        await mongoClient.connect();
    
        const batepapouol = mongoClient.db("batepapouol");
        const participantsCollection = batepapouol.collection('participants');
        const participants = await participantsCollection.find({}).toArray();
        const messagesCollection = batepapouol.collection('messages');
        const messages = await messagesCollection.find({}).toArray()
        const userMessages = messages.filter((userCanSee) => {

            if(userCanSee.to === "Todos" || userCanSee.from === messageFrom || userCanSee.to === messageFrom){
                return userCanSee
            }
            
        })

        if(userMessages.length < limit){
            response.send(userMessages);
            return;
        }else if(userMessages.length > limit){
            response.send(userMessages.slice((userMessages.length-limit),userMessages.length))
            return
        }

        response.send(userMessages)

        mongoClient.close();

    } catch {

        response.sendStatus(500)
        mongoClient.close();
    }

})

server.post("/status", async (request, response) => {
    let mongoClient

    const user = request.headers.user;

    try{

        mongoClient = new MongoClient(process.env.MONGO_URI)
        await mongoClient.connect();
        const batepapouol = mongoClient.db("batepapouol");
        const participantsCollection = batepapouol.collection('participants');
        const userExist = await participantsCollection.findOne({name : user})

        if(!userExist){
            response.sendStatus(404);
            mongoClient.close()
            return;
        }
        
        await participantsCollection.updateOne({ 
			name: userExist.name 
		}, { $set: {lastStatus: Date.now()} })
        
        response.sendStatus(200);
        mongoClient.close()

    } catch {
        response.sendStatus(500);
        mongoClient.close();
    }
})


server.listen(5000, () => console.log("Servidor iniciado em http://localhost:5000"));