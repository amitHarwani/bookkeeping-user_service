import express from "express";
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* Auth Router */
import authRouter from "./routes/auth.routes"

app.use("/auth", authRouter);
export default app;
