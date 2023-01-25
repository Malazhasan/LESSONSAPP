const express = require("express");
const m = require("mongoose");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const https = require("https")
const pcloud = require("pcloud-sdk-js");
const { ApiRequest, createClient, ApiMethod, oauth } = require("pcloud-sdk-js");
const token = process.env.TOKEN;

const client = pcloud.createClient(token);


const app = express();
m.set("strictQuery", true);

m.connect("mongodb+srv://malazAdmin:malazAdmin@appdb.c8ohgxc.mongodb.net/UserDB")
    .then(v => console.log("connected to db"))
    .catch((e) => console.log("failed to connect to db"))
app.use(morgan("tiny"))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

const userSchema = m.Schema({
    key: {
        type: String,
        required: true,
        min: 8,
        unique:true
    },
    registerDate: {
        type: Date,
        default: null
    },
    expireDate: {
        type: Date,
        default: null
    },
    deviceID: {
        type: String
        , //required: true,
        default: null
    }
})

const User = m.model('User', userSchema);

app.get("/", (req, res) => {

res.send("What are you doing here!!!???")

}) 

app.post('/api', async (req, res) => {
    if (!req.body || !req.body.key || !req.body.deviceID||!req.body.key.length|| !req.body.deviceID.length) {
        res.json({ "error": "invalid body request" });
        return
    }
    const user = await User.findOne({ key: req.body.key });
    if (user) {
        if (user.expireDate === null || user.registerDate === null || user.deviceID === null) {
            const register = new Date(Date.now());
            let year = register.getFullYear();
            let month = register.getMonth() + 1;
            if (month === 12) {
                year++;
                month = 0;
            }
            const day = register.getDate();
            const expire = new Date(year, month, day)
            user.expireDate = expire;
            user.registerDate = register;
            user.deviceID = req.body.deviceID
            await user.save()
            res.send("valid")

        }
        else {
            if (user.expireDate.getTime() < Date.now() ) {
                await User.deleteOne({_id:user._id})
                res.json({"error": "Expired Key"})
            }
            if ( user.deviceID !== req.body.deviceID) {
                res.json({"error": "This Key Is Used"})
            }
            
            else {
                res.send("valid")
            }


        }

    }

    else {
        res.json({"error":"Key is invalid"});}



})

app.listen(process.env.PORT||3000, () => {
    console.log("server running ")
})






/*  const result = https.get("https://my.pcloud.com/oauth2/authorize?client_id=GbAAXvWMnq5&&response_type=token", (cloud_response) => {
     console.log(cloud_response.statusCode);
     console.log(cloud_response.statusMessage);
     cloud_response.on("data", (data) => {
         console.log(data);
         res.send(data)
     })
 }) */

/*    const user=new User({
   key:"999",
   
})
await user.save();
res.send("saved")  */