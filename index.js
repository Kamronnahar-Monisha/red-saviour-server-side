const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');


const app = express();
const port = process.env.PORT || 5000;

//middle wires added
app.use(cors());
app.use(express.json());


//mongodb connection uri and client
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.PASSWORD}@cluster0.nomds.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


// async function for CRUD operation
const run = async () => {
    try {
        const usersCollection = client.db('red-saviour').collection('users');


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

    }
    finally {

    }
}
run().catch(console.dir);



//root api 
app.get('/', (req, res) => {
    res.send('Welcome to red-saviour server side');
})

app.listen(port, () => {
    console.log(`server side is listing at port ${port}`);
})
