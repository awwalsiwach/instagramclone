const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model("User");
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require("../config/key");
const requireLogin = require('../middleware/requireLogin');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

// const transporter = nodemailer.createTransport(sendgridTransport({
//     auth:{
//         api_key:""
//     }
// }))

var transporter = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: "c19317d4da7a71",
        pass: "9d45fd6ee03e86"
    }
});


router.post('/signup', (req, res) => {
    const { name, email, password, pic } = req.body;
    if (!name || !email || !password) {
        res.status(422).json({ error: "Please add all the fields" });
    }
    User.findOne({ email: email })
        .then((savedUser) => {
            if (savedUser) {
                return res.status(422).json({ error: "User already exist with this email" })
            }
            bcrypt.hash(password, 12)
                .then(hashedpassword => {

                    const user = new User({
                        name,
                        email,
                        password: hashedpassword,
                        pic
                    })

                    user.save()
                        .then(user => {
                            transporter.sendMail({
                                to: user.email,
                                from: "no-reply@instaclone.com",
                                subject: "signup successful",
                                html: "<h1>Welcome to Instagram Clone</h1>"
                            })
                            res.json({ message: "Saved successfully" })
                        })
                        .catch(err => {
                            console.log(err);
                        })
                })
        })
        .catch(err => {
            console.log(err);
        })
})

router.post('/signin', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(422).json({ error: "input email or password" });
    }
    User.findOne({ email: email })
        .then(savedUser => {
            if (!savedUser) {
                return res.status(422).json({ error: "Invalid email or password" });
            }
            bcrypt.compare(password, savedUser.password)
                .then(doMatch => {
                    if (doMatch) {
                        // res.json({ message: "Signed in successful" })
                        const token = jwt.sign({ _id: savedUser._id }, JWT_SECRET);
                        const { _id, name, email, followers, following, pic } = savedUser;
                        res.json({ token, user: { _id, name, email, followers, following, pic } });
                    }
                    else {
                        return res.status(422).json({ error: "Invalid email or password" });
                    }
                })
                .catch(err => {
                    console.log(err);
                })
        })
})

router.post('/reset-password', (req, res) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
        }
        const token = buffer.toString("hex");
        User.findOne({ email: req.body.email })
            .then(user => {
                if (!user) {
                    return res.status(422).json({ error: "User dont exist with this email" });
                }
                user.resetToken = token
                user.expireToken = Date.now() + 600000
                user.save().then((result) => {
                    transporter.sendMail({
                        to: user.email,
                        from: "no-reply@instaclone.com",
                        subject: "password reset",
                        html: `<p>You requested for password reset</p>
                        <h5>Click on this <a href="http://localhost:3000/reset/${token}"> link</a> to reset password.</h5>`
                    })
                    res.json({ message: "check your email" })
                })
            })
    })
})

router.post('/new-password', (req, res) => {
    const NewPassword = req.body.password
    const sentToken = req.body.token
    User.findOne({ resetToken: sentToken, expireToken: { $gt: Date.now() } })
        .then(user => {
            if (!user) {
                return res.status(422).json({ error: "Try again session expired" })
            }
            bcrypt.hash(NewPassword, 12).then(hashedPassword => {
                user.password = hashedPassword
                user.resetToken = undefined
                user.expireToken = undefined
                user.save().then((saveduser) => {
                    res.json({ message: "Password update successfully" })
                })
            })
        }).catch(err => {
            console.log(err);
        })
})


module.exports = router;