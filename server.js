const express=require('express');
require('dotenv').config();

const mongoose=require('mongoose');
const Document=require('./models/Document');
const User = require('./models/User');

const connectionString= process.env.MONGO_URI;

mongoose.connect(connectionString).then(()=>{console.log("Connected");}).catch((err)=>{console.log("error",err);});

const app= express();
app.use(express.static(__dirname + "/src"));

const port= process.env.PORT || 3000;


const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser=require('cookie-parser');

app.use(cookieParser());
app.use(express.json());


app.get('/',(req,res)=>{
    res.sendFile(__dirname + "/src/login.html");
});

app.post('/document',auth,async (req,res)=>{
    try{
        const {title,content} = req.body;
        if (!title || title.trim() === "") {
            return res.status(400).json({
                message: "Title is required"
            });
        }
        const owner = req.userId;

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

app.get('/document/:id',auth, async (req,res)=>{
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
app.put("/document/:id",auth,async(req,res)=>{
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

//authentication

//middleware for userId
function auth(req,res,next){
    try{
    const token=req.cookies.token;
    if(!token) return res.status(401).json({message:"Please login"});
    const decoded=jwt.verify(token,process.env.SECRETE_KEY);
    req.userId=decoded.userId;
    next();//passes same req and res objects to the handler called this auth
    }
    catch(error){
        return res.status(401).json({message:"Invalid or expired token"});
    }
}

app.use(express.urlencoded({ extended: true }));

app.get('/register',(req,res)=>{
    res.sendFile(__dirname+"/src/register.html");
});
app.get('/login',(req,res)=>{
    res.sendFile(__dirname+"/src/login.html");
});

app.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Missing required fields!!" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "Email already exists!!" });
        }

        const hashedPassword = await bcrypt.hash(password, 8);

        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });

        await newUser.save();

        return res.status(201).json({ message: "Registration Successful!!" });
    }
    catch (err) {
        return res.status(500).json({message:"Server Error. Try again!!"});
    }
});
//login handler
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Missing required fields!!" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "Email not found!!" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Incorrect details!!" });
        }

        //creating cookie with jwt token
        const user_id=user._id;
        const token = jwt.sign(
            {userId: user_id},
            process.env.SECRETE_KEY
        );
        return res.cookie("token",token,{httpOnly: true}).status(200).json({ message: "Login successful!!" });
    }
    catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Server Error. Try again!!" });
    }
});

app.get("/documents",auth,async(req,res)=>{
    try{
        const userId= req.userId;
        const documents= await Document.find({owner:userId});
        return res.status(200).json({documents});
    }
    catch(error){
        return res.status(500).json({message:"Server Error!!"});
    }
});
server.listen(port,()=>{
    console.log({message:"Server is running"});
});
