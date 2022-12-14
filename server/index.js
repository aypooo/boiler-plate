const express = require('express')
const app = express()
const port = 5000
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const config = require('./config/key')
const { auth } = require('./middleware/auth')
const { User } = require('./models/User')
// const cors = require('cors');

// app.use(cors({ origin: ["http://localhost:3000", "http://localhost:3000/"] }))
// require('dotenv').config();

//application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))
//application/json
app.use(bodyParser.json())
app.use(cookieParser())
// app.use((req, res) => {
//     res.header("Access-Control-Allow-Origin", "*")
// })


const mongoose = require('mongoose')
mongoose.connect(config.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // useCreateIndex: true,
    // useFindAndModify: false
}).then(() => console.log('MongoDB Conneted...'))
    .catch(err => console.log(err))


app.get('/', (req, res) => res.send('Hello World!'))

app.get('/api/hello', (req, res) => res.send('Hello World!~~ '))

app.post('/api/users/register', (req, res) => {
    //회원가입 할 때 필요한 정보들을 client에서 가져오면 그것들을 데이터 베이스에 넣어준다. 

    const user = new User(req.body)

    user.save((err, userInfo) => {
        if (err) return res.json({ success: false, err })
        return res.status(200).json({
            success: true
        })
    })
})

app.post("/api/users/login", (req, res) => {

    //요청된 이메일을 데이터베이스에 있는지 찾는다. 
    User.findOne({ email: req.body.email }, (err, user) => {
        if (!user)
            return res.json({
                loginSuccess: false,
                message: "Auth failed, email not found"
            });

        user.comparePassword(req.body.password, (err, isMatch) => {
            if (!isMatch)
                return res.json({ loginSuccess: false, message: "Wrong password" });
            //비밀번호까지 맞다면 토큰 생성
            user.generateToken((err, user) => {
                if (err) return res.status(400).send(err);
                //토큰을 저장한다. 쿠키, 로컬스토리지...등등
                res.cookie("w_auth", user.token)
                    .status(200)
                    .json({ loginSuccess: true, userId: user._id });
            });
        });
    });
});
app.get("/api/users/auth", auth, (req, res) => {
    //미들웨어를 통과했다면 Authentication 이 true라는 말
    res.status(200).json({
        _id: req.user._id,
        isAdmin: req.user.role === 0 ? false : true,
        isAuth: true,
        email: req.user.email,
        name: req.user.ame,
        lastname: req.user.role,
        role: req.user.role,
        image: req.user.image
    })
})

app.get("/api/users/logout", auth, (req, res) => {
    User.findOneAndUpdate({ _id: req.user._id },
        { token: "" },
        (err, user) => {
            if (err) return res.json({ success: false, err });
            return res.status(200).send({
                success: true
            });
        });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

