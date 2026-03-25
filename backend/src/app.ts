import express from "express";
import cors from "cors";
import healthRoute from "./routes/index.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import passport from "./config/passport.js";
// import session from "express-session";
import authRoute from "./routes/auth.route.js"
import repoRoutes from "./routes/repo.route.js";
import cookieParser from "cookie-parser";
import queryRoutes from "./routes/query.route.js";
import embedRoutes from "./routes/embedRepository.route.js"
import vectorInitRoutes from "./routes/vectorInit.route.js"
import fileRoute from "./routes/file.routes.js"
import callRoutes from "./routes/call.route.js"
import historyRoutes from "./routes/history.route.js"
const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "https://repolens-murfai-1.onrender.com/", // your frontend
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
// app.use(
//     session({
//         secret: "sessionsecret",
//         resave: false,
//         saveUninitialized: false,
//     }) 
// )x
app.use(passport.initialize());

app.use("/api/v1", healthRoute);
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/repos", repoRoutes)
app.use("/api/v1/query", queryRoutes);
app.use("/api/v1/embed", embedRoutes);
app.use("/api/v1/vector", vectorInitRoutes);
app.use("/api/v1/files", fileRoute);
app.use("/api/v1/call", callRoutes);
app.use("/api/v1/history", historyRoutes);
app.use(errorHandler)

export default app;