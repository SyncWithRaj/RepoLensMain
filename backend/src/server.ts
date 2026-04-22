import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { connectDB } from "./config/db.js";

// Import the worker so it starts with the server process
import "./workers/repoWorker.js";

const port = process.env.PORT || 3000;

const startServer = async () => {
    await connectDB();

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
};

startServer();