import app from "./app";
import dotenv from "dotenv"

dotenv.config();
dotenv.config({path: `.env.${process.env.NODE_ENV}`});

app.listen(process.env.PORT, async () => {
    console.log(`User Service Listening On Port: ${process.env.PORT}`);
})