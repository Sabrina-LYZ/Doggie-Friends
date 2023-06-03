import express from 'express'
import mongoose from 'mongoose'
import sanitize from 'mongo-sanitize';
import {User,Dog} from './db.mjs'
import session from 'express-session';

import dotenv from 'dotenv'
dotenv.config()

import passport from 'passport'
import LocalStrategy from 'passport-local'
import GoogleStrategy from 'passport-google-oauth20'

const app = express()

app.set('view engine','hbs'); 

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb',extended: true}));

import path from 'path';
import url from 'url';
import fs from 'fs'
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, 'public')));

//session 
const sessionOptions = {
	secret: 'session secret',
	resave: false,
	saveUninitialized: false
};
app.use(session(sessionOptions));

console.log("Connecting to database...")
let dbconf;
if (process.env.NODE_ENV === 'PRODUCTION') {
 const fn = path.join(__dirname, 'config.json');
 const data = fs.readFileSync(fn);
 const conf = JSON.parse(data);
 dbconf = conf.dbconf;
} else {
 // if we're not in PRODUCTION mode, then use
 dbconf = 'mongodb://127.0.0.1:27017/doggie';
}

try{
    await mongoose.connect(dbconf)
    console.log('Successfully connected to databse')
}
catch(err){
    console.log("ERROR",err)
}

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()))//create a local login strategy

// passport.serializeUser(function(user, cb) {
//     process.nextTick(function() {
//       cb(null, { _id: req.user._id, username: req.user.username });
//     });
//   });
  
//   passport.deserializeUser(function(user, cb) {
//     process.nextTick(function() {
//       return cb(null, user);
//     });
//   });


passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


passport.use(new GoogleStrategy({
clientID: process.env.CLIENT_ID,
clientSecret: process.env.CLIENT_SECRET,
callbackURL: "http://linserv1.cims.nyu.edu:26692/auth/google/secrets"},
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id,username:profile.displayName}, function (err, user) {
      return cb(err, user);
    });
  }
));

let name
// middleware for authentication
async function checkAuthenticated(req, res,next){
    if (req.isAuthenticated()) { 
        name = req.user.username
    }
    else{
        name = undefined
        console.log('no authenticated');
    }
    next()
}

app.get('/',checkAuthenticated,(req,res)=>{
    res.render('home',{name:name})
})

// ----------------------------- FIND DOGS -----------------------------
app.get('/dogs',checkAuthenticated,async (req,res)=>{
    const foundDog = await Dog.find({})
    res.render('dogs',{dogs:foundDog, name:name})
})

let foundDog
app.get('/dog/:slug',async (req,res)=>{
    foundDog = await Dog.find({slug:req.params.slug})
    res.render('dog')   
    //res.render('dog',{dog:foundDog,name:name})
})

app.get('/api/getDog',(req,res)=>{
    if(foundDog){
        // try{
        //     const image = foundDog[0]['dogImage']
        //     const imageURL = foundDog[0]['dogImage'].toString('base64')
        //     //foundDog.imageURL = imageURL
        //     //console.log(foundDog)
        //     console.log('sucess')
        //     res.send({'dogName':foundDog.dogName, 
        //     'dogBreed':foundDog.dogBreed, 
        //     'dogAge':foundDog.dogBreed, 
        //     'dogGender':foundDog.dogGender, 
        //     'dogSkills':foundDog.dogSkills, 
        //     'dogIntro':foundDog.dogIntro,
        //     'imageURL':imageURL})
        // }
        // catch{
        //     console.log('fail')
        //     res.send(foundDog)
        // }
        res.send(foundDog)
        
    }
    else{res.redirect('/dogs')}
})

// ---------------------------- ADD DOGS, valid only for authenticated ---------------------------- 
app.get('/add',(req,res)=>{
    if(req.isAuthenticated()){
        res.render('add',{name:name})
    }
    else{
        res.redirect('login')
    }
});

const imageMimeTypes = ['image/jpeg','image/png','images/gif']
app.post('/add',async (req,res)=>{
    try{
        const dog = new Dog({
            dogName:sanitize(req.body.dogName),
            dogBreed:sanitize(req.body.dogBreed),
            dogAge:sanitize(req.body.dogAge),
            dogGender:sanitize(req.body.dogGender),
            dogSkills:sanitize(req.body.dogSkills),
            dogIntro:sanitize(req.body.dogIntro),
            user:req.user.id
        })
        saveCover(dog, req.body.cover)
        await dog.save()
        res.redirect('/dogs')
    }
    catch(err){res.render('add',{message:'Invalid input!'})}
});

function saveCover(dog,coverEncoded){
    if(coverEncoded){
        const cover = JSON.parse(coverEncoded)
        if(cover && imageMimeTypes.includes(cover.type)){
            dog.dogImage = new Buffer.from(cover.data,'base64')
            dog.dogImageType = cover.type
        }
    }
}

app.get('/user/:username',async (req,res)=>{
    if (req.isAuthenticated()) { 
        try{
            const userid = req.user.id
            const foundDogs = await Dog.find({user:userid})

            res.render('dogs',{dogs:foundDogs,name:name})
        }
        catch(err){
            res.status(404)
            res.send(err)
        }    
    }
    else{
        res.redirect('/login')
    }
})

//authnticate by local strategy
//https://www.geeksforgeeks.org/node-js-authentication-using-passportjs-and-passport-local-mongoose/
app.get('/login',checkAuthenticated,(req,res)=>{
    res.render('login')
})
app.post('/login',(req,res)=>{
    if (!req.body.username || !req.body.password ) {
        res.render('login', {message: "User information was not given" })
    }
    else{
        const user = new User({
            username:req.body.username,
            password:req.body.password
        })
        req.login(user,function(err){
            if(err){
                console.log(err)
                res.render('login',{message:'Your login information is not valid'})
            }else{
                passport.authenticate('local', function(err, user, info){
                    if (err) {
                        console.log('err')
                        res.render('login',{message: err });
                    }
                    else {
                        if (!user) {
                            console.log('in !user')
                            return res.render('login',{message: "username or password incorrect" });
                        }
                        else {
                            console.log('login successfully')
                            return res.redirect('/')
                        }
                    }
                    
                })(req, res)
            }
        })
    }
})

app.get('/signup',(req,res)=>{
    res.render('signup');
})

app.post('/signup',(req,res)=>{
    const username = sanitize(req.body.username);
    const password = sanitize(req.body.password);
    const email = sanitize(req.body.email);

    User.register(new User({username:username,email:email}),password,function(err,user){
        if(err){
            console.log(err)
            res.render('signup',{message:'Your registration information is not valid'})
        }else{
            passport.authenticate('local')(req,res,function(){
                console.log('sign up successfully')
                res.redirect('/')
            })
        }
    });
})


app.post("/logout", (req,res) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        name = undefined
        res.redirect('/');
      });
    console.log(`-------> User Logged out`)
})

// authentication by google

app.get('/auth/google', 
    passport.authenticate('google',{scope:["profile"]}
))

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    console.log('auth',req.session.passport.user)
    res.redirect('/');
});

app.listen(process.env.PORT ?? 3000, ()=>{
    console.log('Server started; type CTRL+C to shut down')
})
