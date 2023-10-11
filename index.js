const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const fs = require('fs');
const { error } = require('console');
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

// Admin routes
//admin signup
app.post('/admin/signup', (req, res) => {
  let admin = req.body;
  fs.readFile('Admins.json','utf-8',(err,data)=>{
    data = JSON.parse(data);
    const exists = data.find(a=>a.username===admin.username);
    if(exists){
      res.status(403).json({"message":"admin already exists!"});
    }
    else{
      token = generateJwt(admin);
      data.push(admin);
      fs.writeFile("Admins.json",JSON.stringify(data),(err)=>{
        if(err) throw err;
      });
      res.json({"message":"admin signup successfull",token});
    }
  });
});

//admin login
app.post('/admin/login', (req, res) => {
  let admin = req.headers;
  fs.readFile('Admins.json','utf-8',(err,data)=>{
    data = JSON.parse(data);
    const exists = data.find(a=>a.username===admin.username && a.password===admin.password);

    if(exists){
      token = generateJwt(admin);
      res.json({"message":"user login successfull",token});
    }
    else{
      res.status(403);
    }
  });
});

//add courses
app.post('/admin/courses',authenticateJwt, (req, res) => {
  let course = req.body;
  fs.readFile("Courses.json","utf-8",(err,data)=>{
    if(err) throw err;
    data = JSON.parse(data);
    data.push({...course,id:data.length+1});
    fs.writeFile("Courses.json",JSON.stringify(data),(err)=>{
      if(err) throw err;
    })
  });
  res.json({"message":"course successfully created","courseId":course.id});
});

//update courses
app.put('/admin/courses/:courseId',authenticateJwt, (req, res) => {
  let id = parseInt(req.params.courseId);
  fs.readFile("Courses.json","utf-8",(err,data)=>{
    data = JSON.parse(data);
    let exists = data.find(c=>(id===c.id));
    if(exists){
      let index = data.indexOf(exists);
      data[index] = req.body;
      fs.writeFile("Courses.json",JSON.stringify(data),(err)=>{
        if(err) throw err;
      });
      res.json({"messsage":"Course updated successfully"});
    }
    else{
      res.status(403).json({"message":"failed"});
    }
  });
});

app.get('/admin/courses',authenticateJwt, (req, res) => {
  fs.readFile("Courses.json","utf-8",(err,data)=>{
    res.json({courses :JSON.parse(data)});
  });
});

// User routes
app.post('/users/signup', (req, res) => {
  let user = req.body;
  fs.readFile("Users.json","utf-8",(err,data)=>{
    data = JSON.parse(data);
    let existingUser = data.find(u=>(user.username===u.username));
    if(existingUser){
      res.status(403).json({"message":"user already exists"});
    }
    else{
      data.push(user);
      fs.writeFile("Users.json",JSON.stringify(data),(err)=>{
        if(err) throwerr;
      });
      let token = generateJwt(user);
      res.json({"message":"user signup successfull",token});
    }
  });
});

app.post('/users/login', (req, res) => {
  let {username,password} = req.headers;
  fs.readFile("Users.json","utf-8",(err,data)=>{
    data = JSON.parse(data);
    let existingUser = data.find(u=>(username===u.username && password===u.password));
    if(existingUser){
      let token = generateJwt(existingUser);
      res.json({"message":"user login successfull",token});
    }
    else{
      res.status(403).json({ message: 'User authentication failed' });
    }
  });
});

app.get('/users/courses',authenticateJwt, (req, res) => {
  fs.readFile("Courses.json","utf-8",(err,data)=>{
    if(err) throw err;
    data = JSON.parse(data);
    let courses = data.filter(c=>c.published);
    res.json({publishedCourses:courses});
  })
});

app.post('/users/courses/:courseId',authenticateJwt, (req, res) => {
  let id = parseInt(req.params.courseId);
  fs.readFile("Courses.json","utf-8",(err,data)=>{
    data = JSON.parse(data);
    let course = data.find(c=>c.id===id && c.published);
    if(course){
      fs.readFile("Users.json","utf-8",(err,data1)=>{
        data1 = JSON.parse(data1);
        let user = data1.find(u=>u.username===req.user.username);
        if(user){
          if(!user.purchasedCourses){
            let index = data1.indexOf(user);
            data1[index].purchasedCourses=[]
            data1[index].purchasedCourses.push(course);
          }
          fs.writeFile("Users.json",JSON.stringify(data1),(err)=>{
          });
        }
      });
      res.json({"message" :"purchase successfull"})
    }
  });
});

app.get('/users/purchasedCourses',authenticateJwt, (req, res) => {
  fs.readFile("Users.json","utf-8",(err,data)=>{
    if(err) throw err;
    data = JSON.parse(data);
    let user = data.find(u=>u.username===req.user.username);
    if(user && user.purchasedCourses){
      res.json({"purchased courses":user.purchasedCourses});
    }
    else{
      res.status(403).send("No purchased courses");
    }
  })
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
