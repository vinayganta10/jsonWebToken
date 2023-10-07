const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json());

const secretKey = "secr1tkey"

const generateJwt = (user)=>{
  let payload = {"username":user.username};
  return jwt.sign(payload,secretKey,{expiresIn:'1h'});
}

const authenticateJwt = (req,res,next)=>{
  const authHeader = req.headers.authorization;
  if(authHeader){
    const token = authHeader.split(' ')[1]; 
    jwt.verify(token,secretKey,(err,user)=>{
      if(err){
        res.status(403).json({"message":"unauthorized"});
      }
      req.user = user;
      next();
    });
  }
  else{
    res.status(401);
  }
}

let ADMINS = [];
let USERS = [];
let COURSES = [];

// Admin routes
app.post('/admin/signup', (req, res) => {
  let admin = req.body;
  const exists = ADMINS.find(a=>a.username===admin.username);
  if(exists){
    res.status(403).json({"message":"admin already exists!"});
  }
  else{
    token = generateJwt(admin);
    ADMINS.push(admin);
    res.json({"message":"admin signup successfull",token});
  }
});

app.post('/admin/login', (req, res) => {
  let admin = req.headers;
  const exists = ADMINS.find(a=>a.username===admin.username && a.password===admin.password);

  if(exists){
    token = generateJwt(admin);
    res.json({"message":"user login successfull",token});
  }
  else{
    res.status(403);
  }
});

app.post('/admin/courses',authenticateJwt, (req, res) => {
  let course = req.body;
  COURSES.push({...course,id:COURSES.length+1});
  res.json({"message":"course successfully created","courseId":course.id});
});

app.put('/admin/courses/:courseId',authenticateJwt, (req, res) => {
  let id = parseInt(req.params.courseId);
  console.log(req.user.username);
  let exists = COURSES.find(c=>(id===c.id && c.published));
  if(exists){
    Object.assign(exists,req.body);
    res.json({"messsage":"Course updated successfully"});
  }
  else{
    res.status(403).json({"message":"failed"});
  }
});

app.get('/admin/courses',authenticateJwt, (req, res) => {
  res.json({courses :COURSES});
});

// User routes
app.post('/users/signup', (req, res) => {
  let user = req.body;
  let existingUser = USERS.find(u=>{user.username===u.username});
  if(existingUser){
    res.status(403).json({"message":"user already exists"});
  }
  else{
    let token = generateJwt(user);
    USERS.push(user);
    res.json({"message":"user signup successfull",token});
  }
});

app.post('/users/login', (req, res) => {
  let user = req.headers;
  let existingUser = USERS.find(u=>{user.username===u.username && user.password===u.password});
  if(existingUser){
    let token = generateJwt(user);
    res.json({"message":"user login successfull",token});
  }
  else{
    res.json(403);
  }
});

app.get('/users/courses',authenticateJwt, (req, res) => {
  let publishedCourses = COURSES.filter(c=>c.published);
  res.json({courses:publishedCourses});
});

app.post('/users/courses/:courseId',authenticateJwt, (req, res) => {
  let id = parseInt(req.params.courseId);
  let course = COURSES.find(c=>(c.id===id && c.published));
  if(course){
    let user = USERS.find(u=>(u.username===req.user.username));
    if(user){
      user.purchasedCourses.push(course);
      res.json({"message":"Book successfully purchased"});
    }
  }
  else{
    res.status(403).json({"message":"course id not valid"});
  }
});

app.get('/users/purchasedCourses',authenticateJwt, (req, res) => {
  const user = USERS.find(u=>(u.username===req.user.username));
  if(user && user.purchasedCourses){
    res.json({purchasedCourses:user.purchasedCourses});
  }
  else{
    res.status(403).json({messgae:"user did not purchase any books"});
  }
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
