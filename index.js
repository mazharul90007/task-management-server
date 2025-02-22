const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('TaskManagement is Running...');
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ome3u.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server
        // await client.connect();

        const taskCollection = client.db("task-management").collection("tasks");
        const userCollection = client.db("task-management").collection("users");

        // Create User
        app.post("/users", async (req, res) => {
            try {
                const user = req.body;
                const { uid, email, name } = user;
        
                // Check if the user already exists
                const existingUser = await userCollection.findOne({ uid });
                if (existingUser) {
                    return res.status(200).json({ message: "User already exists", insertedId: existingUser._id });
                }
        
                // Create a new user
                const newUser = {
                    uid,
                    email,
                    name,
                    createdAt: new Date(),
                };
        
                const result = await userCollection.insertOne(newUser);
                res.status(201).json({ message: "User created successfully", insertedId: result.insertedId });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Create a new task
        app.post("/tasks", async (req, res) => {
            try {
                const task = req.body;
                const result = await taskCollection.insertOne(task);
                res.send(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Get all tasks for a user
        app.get("/tasks", async (req, res) => {
            try {
                const { email } = req.query;
                const query = { email: email };
                const taskItems = await taskCollection.find(query).toArray();
                res.send(taskItems);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Update a task (only title and description)
        app.patch("/tasks/:id", async (req, res) => {
            try {
                const { id } = req.params;
                const { title, description } = req.body;

                const updateFields = {};
                if (title) updateFields.title = title;
                if (description) updateFields.description = description;

                const result = await taskCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateFields }
                );

                res.send(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Update task category
        app.patch("/tasks/category/:id", async (req, res) => {
            try {
                const { id } = req.params;
                const { category } = req.body;

                // Validate the category
                if (!["todo", "inProgress", "done"].includes(category)) {
                    return res.status(400).json({ error: "Invalid the category" });
                }

                // Update the task's category
                const result = await taskCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { category } }
                );

                res.send(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Delete a task
        app.delete("/tasks/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const query = { _id: new ObjectId(id) };
                const result = await taskCollection.deleteOne(query);
                res.send(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Task Management is Running on port ${port}`);
});