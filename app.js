import express from "express"
import cors from "cors"

const server = express();

server.use(express.json());
server.use(cors());

server.post("/participants", (request, response) => {
    response.send("ok");
})

server.get("/participants", (request, response) => {
    response.send("ok");
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


server.listen(4000, () => console.log("Servidor iniciado em http://localhost:4000"));