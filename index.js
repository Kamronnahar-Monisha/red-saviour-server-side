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
        const reportsCollection = client.db('red-saviour').collection('reports');
        const notificationsCollection = client.db('red-saviour').collection('notifications');


        app.get('/make-posts-and-donors-upToDate', async (req, res) => {
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
            const PostCursor = await postsCollection.find();
            const posts = await PostCursor.toArray();
            for (const post of posts) {
                if (currentDate > post.donationDate) {
                    const query = { _id: ObjectId(post._id) };
                    const updateDoc = {
                        $set: {
                            status: 'closed'
                        },
                    };
                    const result = await postsCollection.updateOne(query, updateDoc);
                }
            }
            // console.log(posts);
            const UserCursor = await usersCollection.find();
            const users = await UserCursor.toArray();
            for (const user of users) {
                const lastConfirmedDate = new Date(user.donationTime);
                const difference_In_day = (date.getTime() - lastConfirmedDate.getTime()) / (1000 * 3600 * 24);
                if (difference_In_day > 90) {
                    const query = { _id: ObjectId(user._id) };
                    const updateDoc = {
                        $set: {
                            status: 'available'
                        },
                    }
                    const result = await usersCollection.updateOne(query, updateDoc);
                }
            }
            res.send({ acknowledgement: true });
        })



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

        //get api for user by dyn
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send(user);
        })

        //get api for user by dyn
        app.get('/post/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const post = await postsCollection.findOne(query);
            res.send(post);
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

        //post api for report
        app.post('/report', async (req, res) => {
            const report = req.body;
            const result = await reportsCollection.insertOne(report);
            res.send(result);
        });

        //get api for reports on specific type
        app.get('/reports', async (req, res) => {
            const type = req.query.type;
            const query = { type };
            const cursor = await reportsCollection.find(query);
            const reports = await cursor.toArray();
            res.send(reports);
        })


        //patch api for changing resole value of report
        app.patch('/report', async (req, res) => {
            const id = req.query.id;
            const query = { _id: ObjectId(id) };
            const updateDoc = {
                $set: {
                    resolve: true
                },
            };
            const result = await reportsCollection.updateOne(query, updateDoc);
            res.send(result);
        })

        //delete api for single report
        app.delete('/report', async (req, res) => {
            const id = req.query.id;
            const query = { _id: ObjectId(id) };
            const result = await reportsCollection.deleteOne(query);
            res.send(result);
        })


        //get api for all notification of a specific user id
        app.get('/notifications', async (req, res) => {
            const id = req.query.id;
            const query = { donorId : id };
            const cursor = await notificationsCollection.find(query);
            const notifications = await cursor.toArray();
            res.send(notifications);
        })

        //delete api for single report
        app.delete('/post', async (req, res) => {
            const id = req.query.id;
            const query = { _id: ObjectId(id) };
            const result = await postsCollection.deleteOne(query);
            res.send(result);
        })



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



        //patch api for updating donors field in post
        app.patch('/update-donor-feedback', async (req, res) => {
            const id = req.query.id;
            const feedbacks = req.body.data;
            console.log(feedbacks);
            const query = { _id: ObjectId(id) };
            const post = await postsCollection.findOne(query);
            const donors = [];
            for (const donor of post.donors) {
                const temporaryDonor = donor;
                const feedback = feedbacks[donor.donorId];
                if (feedback) {
                    temporaryDonor.feedback = feedback;
                }
                else {
                    temporaryDonor.feedback = "";
                }
                donors.push(temporaryDonor);
            }
            console.log(donors);
            const updateDoc = {
                $set: {
                    donors
                },
            };
            const result = await postsCollection.updateOne(query, updateDoc);
            res.send(result);
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


        //patch api for updating user status
        app.patch('/update-user-status', async (req, res) => {
            const id = req.query.id;
            const status = req.query.status;
            const query = { _id: ObjectId(id) };
            const user = await usersCollection.findOne(query);
            const updateDoc = {
                $set: {
                    status
                },
            };
            const result = await usersCollection.updateOne(query, updateDoc);
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
                //adding notification
                const notification ={
                    postId : id,
                    donationDate : currentDate,
                    donorId : donor.donorId
                }
                const notificationResult = await notificationsCollection.insertOne(notification);
                //changing status
                const statusChangeQuery = { _id: ObjectId(donor.donorId) };
                const updateDoc = {
                    $set: {
                        status,
                        donationTime: currentDate,
                        donatedPost: id
                    },
                };
                const result = await usersCollection.updateOne(statusChangeQuery, updateDoc);

            }
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
