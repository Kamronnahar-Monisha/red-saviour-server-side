const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const app = express();
const port = process.env.PORT || 5000;

//middle wires added
app.use(cors());
app.use(express.json());


//mongodb connection uri and client
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.PASSWORD}@cluster0.nomds.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


// async function for CRUD operation
const run = async () => {
    try {
        await client.connect();
        const usersCollection = client.db('red-saviour').collection('users');
        const postsCollection = client.db('red-saviour').collection('posts');


        //get api for user
        app.get('/users', async (req, res) => {
            const email = req.query.email;
            const id = req.query.id;
            let query;
            if (email) {
                query = { email };
            }
            else {
                query = { _id: ObjectId(id) };
            }
            const user = await usersCollection.findOne(query);
            res.send(user);
        })


        app.get('/posts',async (req, res)=>{
            const userId = req.query.id;
            const query = {patient : userId};
            const cursor = await postsCollection.find(query);
            const posts = await cursor.toArray();
            res.send(posts);
        })


        //get api for posts list of same blood type
        app.get('/posts-list-of-same-blood-type', async (req, res) => {
            const bloodType = req.query.bloodType;
            const id = req.query.id;
            const query = { bloodType };
            const cursor = await postsCollection.find(query);
            let posts = await cursor.toArray();
            posts = posts.filter(post => post.patient != id);
            console.log(posts);
            console.log(id);
            res.send(posts);
        })


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

        //post api for post
        app.post('/post', async (req, res) => {
            const post = req.body;
            const result = await postsCollection.insertOne(post);
            res.send(result);
        });


         //patch api for updating donar field in post
        app.patch('/update-donors', async (req, res) => {
            const id = req.query.id;
            const deletePost = req.query.delete;
            const donor = req.body.donor;
            const query = { _id: ObjectId(id) };
            const post = await postsCollection.findOne(query);
            const donors = post.donors.filter(prevDonar=>prevDonar.donorId != donor.donorId);
            if(!deletePost){
                donors.push(donor);
            }
            const updateDoc = {
                $set: {
                    donors
                },
            };
            const result = await postsCollection.updateOne(query, updateDoc);
            res.send([result,donor]);
        })



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
