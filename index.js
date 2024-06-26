const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster1.m4sihj5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

function verifyJwt(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized user' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (error, decoded) {
        if (error) {
            return res.status(401).send({ message: 'Unauthorized user' });
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        const serviceCollection = client.db('LoveLens').collection('services')
        const reviewCollection = client.db('LoveLens').collection('reviews')

        app.post("/jwt", async (req, res) => {
            const user = req.body;
            console.log(user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
            res.send({ token });
            console.log(token);
        })

        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query).limit(3);
            const services = await cursor.toArray();
            res.send(services);

        })

        app.get('/allServices', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);

        })

        app.get(`/services/:id`, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const service = await serviceCollection.findOne(query);
            res.send(service);
        })

        app.get('/myReviews', verifyJwt, async (req, res) => {

            const decoded = req.decoded;
            if (decoded.email !== req.query.email) {
                res.status(403).send({ message: 'Forbidden User' })
            }
            let query = {};

            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = reviewCollection.find(query);
            const myReviews = await cursor.toArray();
            res.send(myReviews);
        })

        app.get('/reviews/:title', async (req, res) => {
            const title = req.params.title;
            const query = { title: title };
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        })

        app.get('/addReview/:title', async (req, res) => {
            const title = req.params.title;
            const query = { title: title }
            const addReview = await serviceCollection.findOne(query)
            res.send(addReview);
        })

        app.get('/updateReview/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await reviewCollection.findOne(query)
            res.send(result)
        })


        // reviews api

        app.post('/reviews', async (req, res) => {
            const query = req.body;
            const result = await reviewCollection.insertOne(query);
            res.send(result);
        })

        app.delete('/myReviews/:id', verifyJwt, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await reviewCollection.deleteOne(query)
            res.send(result);
        })

        app.patch('/updateReview/:id', verifyJwt, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedReview = req.body;
            const review = {
                $set: {
                    review_title: updatedReview.review_title,
                    review: updatedReview.review
                }
            }
            const result = await reviewCollection.updateOne(filter, review);
            res.send(result);
        })

    } finally {

    }
}
run().catch(error => console.error(error));


app.get('/', (req, res) => {
    res.send('love lens is running successfully')
})

app.listen(port, () => {
    console.log(`love lens is running on port ${port}`);
})