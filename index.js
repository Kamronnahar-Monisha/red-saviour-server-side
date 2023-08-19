const express = require('express');
const cors = require('cors');
require('dotenv').config();


const app = express();
const port = process.env.PORT || 5000;

//middle wires added
app.use(cors());
app.use(express.json());


//post api for adding a user
app.post('/users', async (req, res) => {
    const user = req.body;
    const email = user.email;
    const query = { email };
    const userFindResult = await usersCollection.findOne(query);
    if (!userFindResult) {
        const result = await usersCollection.insertOne(user);
        res.send(result);
    }
    else {
        res.send({});
    }
});



//root api 
app.get('/', (req, res) => {
    res.send('Welcome to red-saviour server side');
})

app.listen(port, () => {
    console.log(`server side is listing at port ${port}`);
})
