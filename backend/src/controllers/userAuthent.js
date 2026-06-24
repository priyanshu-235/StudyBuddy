const redisClient = require("../config/redis");
const User =  require("../models/user")
const Problem = require("../models/problem");
const validate = require('../utils/validator');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const Submission = require("../models/submission")


const register = async (req,res)=>{
    
    try{
        // validate the data;

      validate(req.body); 
      const {firstName, emailId, password}  = req.body;

      req.body.password = await bcrypt.hash(password, 10);
      req.body.role = 'user'
    //
    
     const user =  await User.create(req.body);
     const token =  jwt.sign({_id:user._id , emailId:emailId, role:'user'},process.env.JWT_KEY,{expiresIn: 60*60});
     const reply = {
        firstName: user.firstName,
        emailId: user.emailId,
        _id: user._id,
        role:user.role,
    }
    
     res.cookie('token',token,{maxAge: 60*60*1000});
     res.status(201).json({
        user:reply,
        message:"Loggin Successfully"
    })
    }
    catch(err){
        res.status(400).send("Error: "+err);
    }
}


const login = async (req,res)=>{
    
    try{
        const {emailId, password} = req.body;


        if(!emailId)
            throw new Error("Invalid Credentials");
        if(!password)
            throw new Error("Invalid Credentials");

        const user = await User.findOne({emailId});
        if(!user)
            throw new Error("User doesn't exist")
  
        
        const match = await bcrypt.compare(password,user.password);

        if(!match)
            throw new Error("Invalid Credentials");

        const reply = {
            firstName: user.firstName,
            emailId: user.emailId,
            _id: user._id,
            role:user.role,
        }

        const token =  jwt.sign({_id:user._id , emailId:emailId, role:user.role},process.env.JWT_KEY,{expiresIn: 60*60});
        res.cookie('token',token,{maxAge: 60*60*1000});
        res.status(201).json({
            user:reply,
            message:"Loggin Successfully"
        })
    }
    catch(err){
        res.status(401).send("Error: "+err);
    }
}


// logOut feature

const logout = async(req,res)=>{

    try{
        const {token} = req.cookies;
        const payload = jwt.decode(token);


        await redisClient.set(`token:${token}`,'Blocked');
        await redisClient.expireAt(`token:${token}`,payload.exp);
    //    Token add kar dung Redis ke blockList
    //    Cookies ko clear kar dena.....

    res.cookie("token",null,{expires: new Date(Date.now())});
    res.send("Logged Out Succesfully");

    }
    catch(err){
       res.status(503).send("Error: "+err);
    }
}


const adminRegister = async(req,res)=>{
    try{
        // validate the data;
    //   if(req.result.role!='admin')
    //     throw new Error("Invalid Credentials");  
      validate(req.body); 
      const {firstName, emailId, password}  = req.body;

      req.body.password = await bcrypt.hash(password, 10);
    //
    
     const user =  await User.create(req.body);
     const token =  jwt.sign({_id:user._id , emailId:emailId, role:user.role},process.env.JWT_KEY,{expiresIn: 60*60});
     res.cookie('token',token,{maxAge: 60*60*1000});
     res.status(201).send("User Registered Successfully");
    }
    catch(err){
        res.status(400).send("Error: "+err);
    }
}

const deleteProfile = async(req,res)=>{
  
    try{
       const userId = req.result._id;
      
    // userSchema delete
    await User.findByIdAndDelete(userId);

    // Submission se bhi delete karo...
    
    // await Submission.deleteMany({userId});
    
    res.status(200).send("Deleted Successfully");

    }
    catch(err){
      
        res.status(500).send("Internal Server Error");
    }
}

const getProfile = async (req, res) => {
    try {
        const userId = req.result._id;

        const user = await User.findById(userId)
            .select('-password')
            .populate({
                path: 'problemSolved',
                select: '_id title difficulty tags'
            });

        if (!user) {
            return res.status(404).send('User not found');
        }

        const totalProblems = await Problem.countDocuments();
        const totalSubmissions = await Submission.countDocuments({ userId });
        const acceptedSubmissions = await Submission.countDocuments({ userId, status: 'accepted' });

        const difficultyStats = { easy: 0, medium: 0, hard: 0 };
        user.problemSolved.forEach((problem) => {
            const key = problem.difficulty?.toLowerCase();
            if (key && difficultyStats[key] !== undefined) {
                difficultyStats[key]++;
            }
        });

        const recentSubmissions = await Submission.find({ userId })
            .sort({ createdAt: -1 })
            .limit(15)
            .populate('problemId', 'title difficulty');

        res.status(200).json({
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                emailId: user.emailId,
                age: user.age,
                role: user.role,
                memberSince: user.createdAt,
            },
            stats: {
                totalSolved: user.problemSolved.length,
                totalProblems,
                totalSubmissions,
                acceptedSubmissions,
                acceptanceRate: totalSubmissions
                    ? Math.round((acceptedSubmissions / totalSubmissions) * 100)
                    : 0,
                difficultyStats,
            },
            solvedProblems: user.problemSolved,
            recentSubmissions: recentSubmissions.map((submission) => ({
                _id: submission._id,
                status: submission.status,
                language: submission.language,
                runtime: submission.runtime,
                memory: submission.memory,
                testCasesPassed: submission.testCasesPassed,
                testCasesTotal: submission.testCasesTotal,
                createdAt: submission.createdAt,
                problem: submission.problemId
                    ? {
                        _id: submission.problemId._id,
                        title: submission.problemId.title,
                        difficulty: submission.problemId.difficulty,
                    }
                    : null,
            })),
        });
    } catch (err) {
        res.status(500).send('Internal Server Error');
    }
};


module.exports = {register, login, logout, adminRegister, deleteProfile, getProfile};