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


        app.get('/posts', async (req, res) => {
            const userId = req.query.id;
            const query = { patient: userId };
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


        //patch api for updating donors field in post
        app.patch('/update-donors', async (req, res) => {
            const id = req.query.id;
            const purpose = req.query.purpose;
            const donor = req.body.donor;
            const query = { _id: ObjectId(id) };
            const post = await postsCollection.findOne(query);
            let donors;
            if ((purpose === 'delete') || (purpose === 'add')) {
                donors = post.donors.filter(prevDonar => prevDonar.donorId != donor.donorId);
                if (purpose == "add") {
                    donors.push(donor);
                }
            }
            if (purpose === 'confirm') {
                donors = post.donors.map(prevDonar => {
                    const updatedDonor = prevDonar;
                    if (prevDonar.status === 'shortlisted') {
                        updatedDonor.status = 'confirmed';
                    }
                    return updatedDonor;
                })
                console.log(donors);
            }
            const updateDoc = {
                $set: {
                    donors
                },
            };
            const result = await postsCollection.updateOne(query, updateDoc);
            res.send([result, donor]);
        })


        //patch api for updating post status
        app.patch('/update-post-status', async (req, res) => {
            const id = req.query.id;
            const status = req.query.status;
            const query = { _id: ObjectId(id) };
            const post = await postsCollection.findOne(query);
            const updateDoc = {
                $set: {
                    status
                },
            };
            const result = await postsCollection.updateOne(query, updateDoc);
            res.send(result);
        })


        //patch api for updating users status and last donation date
        app.patch('/update-users-status', async (req, res) => {
            const id = req.query.id;
            const status = req.query.status;
            const query = { _id: ObjectId(id) };
            const post = await postsCollection.findOne(query);
            const confirmedDonors = post.donors.filter(donor => donor.status === 'confirmed');
            const date = new Date();
            let year = date.getFullYear();
            let month = date.getMonth() + 1;
            let dt = date.getDate();

            if (dt < 10) {
                dt = '0' + dt;
            }
            if (month < 10) {
                month = '0' + month;
            }

            const currentDate = year + '-' + month + '-' + dt;
            for (donor of confirmedDonors) {
                const statusChangeQuery = { _id: ObjectId(donor.donorId) };
                const updateDoc = {
                    $set: {
                        status,
                        donationTime : currentDate
                    },
                };
                const result = await usersCollection.updateOne(statusChangeQuery, updateDoc);

            }
            console.log("hi");
            res.send('update user status and donation time api');
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
