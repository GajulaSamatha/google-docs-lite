const express=require('express');
require('dotenv').config();

const mongoose=require('mongoose');
const Document=require('./models/Document');

const connectionString= process.env.MONGO_URI;

mongoose.connect(connectionString).then(()=>{console.log("Connected");}).catch((err)=>{console.log("error",err);});

const app= express();
app.use(express.static(__dirname + "/src"));

const port= process.env.PORT || 3000;



app.get('/',(req,res)=>{
    res.sendFile(__dirname + "/index.html");
});

app.get('/test',(req,res)=>{
   res.send("test route working");
});

app.use(express.json());

app.post('/document',async (req,res)=>{
    try{
        const {title,content,owner} = req.body;
        if(!owner) {
            return res.status(400).json({message:"Owner is required."});
        }

        const newDoc=new Document({
            title,content,owner
        });
        await newDoc.save();
        return res.status(201).json({message:"Successful", newDoc});
    }
    catch(err){
        return res.status(500).json({message:"something went wrong."});
    }
});

app.get('/document/:id', async (req,res)=>{
    try{
        const id=req.params.id;
        if(!id) return res.status(400).json({message:"Error"});
        const doc = await Document.findById(id);

        if(!doc) return res.status(404).json({message:"Error"});
        return res.status(200).json(doc);
    }
    catch(err){
        return res.status(500).json({message:"Error"});
    }
});

//auto-save
app.put("/document/:id",async(req,res)=>{
    try{
        const id=req.params.id;
        const {title,content} =req.body;
        if(!id) return res.status(400).json({message:"Id required."});

        const updated_doc={};
        if(title!==undefined) updated_doc.title=title;
        if(content!=undefined) updated_doc.content=content;

        const doc=await Document.findByIdAndUpdate(id,updated_doc,{new:true});

        if(!doc) return res.status(404).json({message:"Not Found."});
        return res.status(200).json(doc);
    }
    catch(err){
        return res.status(500).json({message:"server error"});
    }
});



//import http
const http=require('http');

//create a http server
const server= http.createServer(app);

//import only server constructor library
const {Server}= require("socket.io");

//create a socket server object along with prevention of cors error
const socketObject = new Server(server, {
  cors: {
    origin: "*"
  }
});

//socket.io is event driven
//When a new client connects, Socket.io listens for the connection event and then creates that socket—you don’t manually instantiate it.
socketObject.on("connection",(socket)=>{
    console.log(socket.id);
    //event listener for message
    socket.on("message",(data)=>{
        //update data in mongodb document
    });

    //event listener for join-document
    socket.on("join-document",(documentId)=>{
        if(!documentId) return;
        socket.join(documentId);

    });

    //load initial content
    socket.on("load-document", async(docId) => {

        try {

            if(!docId)
                return socket.emit("bad-request","Bad request");

            const doc = await Document.findById(docId);

            if(!doc)
                return socket.emit("not-found","Not found!");

            socket.emit("load-content", doc.content);

        }
        catch(err){
            socket.emit("server-error","");
        }
    });
    //When user edits document:
    socket.on("send-changes",(data)=>{

        const { docId, content } = data;

        socket.to(docId).emit("receive-changes", content);

    });
    //auto-save
    socket.on("auto-save", async(data) => {

        try {

            const { docId, content } = data;

            if(!docId)
                return socket.emit("bad-request","");

            const doc = await Document.findByIdAndUpdate(
                docId,
                { content },
                { new:true }
            );

            if(!doc)
                return socket.emit("not-found","");

        }
        catch(error){
            return socket.emit("server-error","");
        }

    });
});
server.listen(port,()=>{
    console.log({message:"Server is running"});
});
