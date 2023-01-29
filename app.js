const express = require("express");
const m = require("mongoose");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const app = express();
m.set("strictQuery", true);

m.connect(process.env.DB)
    .then(v => console.log("connected to db"))
    .catch((e) => console.log("failed to connect to db")) 
app.use(morgan("tiny"))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
const userSchema = m.Schema({
    key: {
        type: String,
        min: 8,
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

app.get("/", async(req, res) => {

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
            console.log("new user => "+req.body);
            res.send("valid")

        }
        else {
            if (user.expireDate.getTime() < Date.now() ) {
                await User.deleteOne({_id:user._id})
                console.log("Expired Key => "+req.body);

                res.json({"error": "Expired Key"})
            }
            if ( user.deviceID !== req.body.deviceID) {
                console.log("This Key Is Used => "+req.body);
                res.json({"error": "This Key Is Used"})
            }
            
            else {
                console.log("registerd user => "+req.body);
                
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





