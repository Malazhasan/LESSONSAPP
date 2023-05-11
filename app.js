const express = require("express");
var {nanoid} =require('nanoid');
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
const tSchema=m.Schema({
    token:String
})
const User = m.model('User', userSchema);
const Token=m.model("Token",tSchema);
app.get("/", async (req, res) => {
    console.log("all thing fine ");
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
            let month = register.getMonth()+2 ;
            
           
            if (month === 12) {
                year++;
                month = 0;
            }
            if (month === 13) {
                year++;
                month = 1;
            }
           
            const day = register.getDate();
            const expire = new Date(year, month, day)
            user.expireDate = expire;
            user.registerDate = register;
            user.deviceID = req.body.deviceID

            await user.save()
            const key=nanoid(8);
            await User.insertMany({key}).catch(e=>console.log(e))
            res.send(c)

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
                
                res.send(await Token.findOne())

            }


        }

    }

    else {
        res.json({"error":"Key is invalid"});}

})

app.get("/private/pkeys",async(req,res)=>{
if(req.query.auth&&req.query.auth===process.env.auth){
    const list=await User.find({deviceID:null}).select("key -_id")
    res.send(list) 
}
else res.send("invalid request")

})
app.post("/private/setToken",async(req,res)=>{
    if(!req.body||!req.body.newToken||!req.query.auth||req.query.auth!==process.env.auth){
        console.log(req.query);
        res.status(404).send("invalid requset")
    }
    else{
      
        const doc= await Token.findOne();
        doc.token=req.body.newToken;
        await doc.save()
        res.send("successfully updated")
    }
})

app.listen(process.env.PORT||3000, () => {
    console.log("server running ")
})




