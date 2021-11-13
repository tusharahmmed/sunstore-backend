const express = require('express');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());
require('dotenv').config()





// database connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.a7zq8.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// database api
async function run() {
    try {
        await client.connect();

        // database name and colloections
        const database = client.db("sunstore");
        const usersCollection = database.collection("users")
        const productsCollection = database.collection("products");
        const ordersCollection = database.collection("orders");
        const reviewCollection = database.collection("reviews");



        /**
         * Handle User
         */

        // save user to database
        app.post('/users', async (req, res) => {
            const user = req.body;

            const result = await usersCollection.insertOne(user);

            if (result.insertedId) {
                res.json(result);
            }
        })

        // save user after google sign in
        app.put('/users', async (req, res) => {
            const user = req.body;

            const filter = { email: user.email };
            // this option instructs the method to create a document if no documents match the filter
            const options = { upsert: true };
            // create a document that sets the plot of the movie
            const updateDoc = {
                $set: user,
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);

            res.json(result);

        })

        // update admin role
        app.put('/user/admin', async (req, res) => {

            const email = req.body.email;
            // create a filter
            const filter = { email: email };
            // this option instructs the method to create a document if no documents match the filter
            const options = { upsert: false };
            // create a document that sets the plot of the movie
            const updateDoc = {
                $set: {
                    role: 'admin'
                },
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);

            res.json(result);
        })

        // check if user is admin
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;

            let isAdmin = false;
            const user = await usersCollection.findOne({ email: email });
            if (user?.role) {
                isAdmin = true;
            }

            res.json({ admin: isAdmin });
        })


        /**
         * Handle Product
         */

        // add single product
        app.post('/products/add', async (req, res) => {
            const data = req.body;
            const result = await productsCollection.insertOne(data);

            if (result.insertedId) {
                res.json(result)
            }
        })

        // get products form db
        app.get('/products', async (req, res) => {

            const admin = req.query?.admin;

            console.log(admin)

            let number;

            number = parseInt(req.query.n);

            // default number
            if (!number) {
                number = 10;
            }

            // if admin call
            if(admin){
                number = 50;
            }

            const cursor = productsCollection.find({});
            const products = await cursor.limit(number).toArray();

            res.json(products);
        })

        // get single product
        app.get('/product/:id', async (req, res) => {
            const id = req.params.id;

            const query = { _id: ObjectId(id) };
            const product = await productsCollection.findOne(query);

            res.json(product);
        })


        /**
         * Manage orders
         */

        // place order
        app.post('/order', async (req, res) => {
            const orderData = req.body;

            const result = await ordersCollection.insertOne(orderData);

            if (result.insertedId) {
                res.json(result);
            }
        })


        // get all orders by admin
        app.get('/admin/orders/', async (req, res) => {

            const cursor = ordersCollection.find({});
            const orders = await cursor.toArray();

            res.json(orders);
        })
        // get my orders
        app.get('/orders/:email', async (req, res) => {
            const email = req.params.email;

            const query = { email: email }

            const cursor = ordersCollection.find(query);
            const orders = await cursor.toArray();

            res.json(orders);
        })

        // CANCEL an order
        app.delete('/order/cancel/:id', async (req, res) => {
            const id = req.params.id;
            //    console.log(id);

            const result = await ordersCollection.deleteOne({ _id: ObjectId(id) });

            if (result.deletedCount) {
                res.json({
                    result,
                    id
                })
            }
        })

        // update order status
        app.put('/admin/orders/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);

            // filter 
            const filter = { _id: ObjectId(id) };
            // is upsert
            const options = { upsert: false };
            // create a document that sets the plot of the movie
            const updateDoc = {
                $set: {
                    status: 'shipped'
                },
            };
            const result = await ordersCollection.updateOne(filter, updateDoc, options);

            if(result.modifiedCount){
                res.json({
                    result,
                    id
                })
            }
        })


        /**
         * Insert Review
         */
        app.post('/products/review', async (req, res) => {
            const message = req.body;

            if (!message.rating) {
                message.rating = 0;
            }

            const result = await reviewCollection.insertOne(message);

            if (result.insertedId) {
                res.json(result);
            }
        })

        // get all review
        app.get('/review', async (req, res) => {

            const cursor = reviewCollection.find({});

            const reviews = await cursor.toArray();

            res.json(reviews);
        })


        // Delete a product
        app.delete('/admin/product/delete/:id', async (req,res)=>{
            const id = req.params.id;

            const query = {_id: ObjectId(id)}
            const result = await productsCollection.deleteOne(query);

            if(result.deletedCount){
                res.json({result,id})
            }

        })








    } finally {
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})