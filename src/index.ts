import dotenv from "dotenv"
dotenv.config();
dotenv.config({path: `.env.${process.env.NODE_ENV}`});

import app from "./app";

app.listen(process.env.PORT, async () => {
    console.log(`User Service Listening On Port: ${process.env.PORT}`);
})