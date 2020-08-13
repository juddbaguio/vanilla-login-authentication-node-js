const express = require('express');

if(process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const bodyParser = require('body-parser');
const { render } = require('ejs');
const app = express();
const methodOverride = require('method-override');

//Middlewares and Configs
app.set('view-engine', 'ejs')
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.json());
app.use(session({secret: 'node_practice', resave: true, saveUninitialized: true}));
app.use(methodOverride('_method'))

// Test Users Database
const Users = require('./models/users');


// GET Routes
app.get('/', isNotAuthenticated, (req,res) => {
    res.render('index.ejs', {views: 0})
})

app.get('/login', isNotAuthenticated, (req,res) => {
    res.render('login.ejs')
})

app.get('/register', isNotAuthenticated, (req,res) => {
    res.render('register.ejs')
})

app.get('/home', isAuthenticated, (req,res) => {
    res.render('success.ejs', {user: req.session.user.name})
})


// POST Routes
app.post('/register', async (req,res,next) => {
    const password = await bcrypt.hash(req.body.password, 10);
    try {
        if (!await Users.findOne({email: req.body.email}).exec()){
            const user = new Users({...req.body, password: password})
            user.save((err,doc) => {
                if(err) console.log(err)
                console.log('User registered Successfully')
                res.redirect('/login')
            })
        }else{
            res.render('fail.ejs')
        }
    } catch (error) {
        console.log(error)
        res.redirect('/register')
    }
}, (req,res) => res.redirect('/home'))

app.post('/login', async (req,res) => {
    const loginDetails = req.body
    const user = await Users.findOne({email: loginDetails.email}).exec();
    try {
        if (user) {
            if(await bcrypt.compare(loginDetails.password,user.password)) {
                req.session.user = user
                res.redirect('/home')
            }
        }
    } catch (error) {
        console.log(error)
    }
})

app.delete('/logout', (req,res) => {
    req.session.destroy();
    res.redirect('/')
})

// Authentication
function isAuthenticated(req,res,next) {
    if(req.session.user){
        next()
    }else{
        res.redirect('/login')
    }
}

function isNotAuthenticated(req,res,next) {
    if(req.session.user) {
        res.redirect('/home')
    }else {
        next()
    }
}

//Database Connection
mongoose.connect(process.env.DB_URI, {useNewUrlParser: true, useUnifiedTopology: true}, ()=> {
    console.log('DB Connected')
})

// Connectivity
app.listen(3000, () => {
    console.log('Connected')
})