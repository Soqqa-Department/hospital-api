import "./dotenv.js";
import connect from "./db/connect.js";
import ErrorHandler from "./errorHandlers/ErrorHandler.js"; 
import NotFound from "./errorHandlers/NotFound.js"; 
import ipRecords from "./access-records/ipRecords.js";
import Auth from "./middleware/Auth.js";
import AuthAdmin from "./middleware/AuthAdmin.js";
import AuthManager from "./middleware/AuthManager.js";
import { createServer } from "http";
import { initSocketServer } from "./socket/index.js";


// SECURITY PACKAGES 
import rateLimit from "express-rate-limit";
import cors from "cors";
import mongo_sanitize from "express-mongo-sanitize"; 
import helmet from "helmet";
// ------------------ 

// JOBS
import './jobs/clearPatientQueue.js'; 
//--------


const PORT = process.env.PORT || 3000; 
import express from "express";
const app = express();
const httpServer = createServer(app);
initSocketServer(httpServer);

// ROUTERS 
import AdminRouter from './routes/AdminRouter.js'; 
import DoctorRouter from './routes/DoctorRouter.js'; 
import AuthRouter from "./routes/AuthRouter.js";  
import PublicRouter from "./routes/PublicRouter.js"; 
import ManagerRouter from "./routes/ManagerRouter.js";
//--------


const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, 
    limit: 100
});
app.use(express.json());
app.use(cors({
    origin: "*", 
    allowedHeaders: ['Content-Type', 'Authorization']
}));  
app.use(mongo_sanitize());
app.use(helmet());  
app.disable('x-powered-by');
app.use(limiter);

const start = async () => {
    try{
        await connect(process.env.MONGO_URL);
        httpServer.listen(PORT, () => {
            console.log('server is running on port ' + PORT); 
            const ipAddressIntervalId = setInterval(() => {
                ipRecords.clear();
            }, 3600000); 
            process.on("SIGINT", () => {
                console.log("Server is shutting down...");
                clearInterval(ipAddressIntervalId);
                process.exit();
            }); 
            process.on("SIGTERM", () => {
                console.log("Server is shutting down...");
                clearInterval(ipAddressIntervalId);
                process.exit(); 
            }); 
        });  

    }catch(err){
        console.log(err)
    }
}
start(); 

app.get('/', (req, res) => {
    return res.status(200).send("<h1>Server is live!</h1>")
});

app.use("/api/v1/manager", AuthManager, ManagerRouter); 
app.use("/api/v1/admin", AuthAdmin, AdminRouter);
app.use("/api/v1/doctor", Auth, DoctorRouter); 
app.use("/api/v1/auth", AuthRouter); 
app.use("/api/v1/public", Auth, PublicRouter);


app.use(ErrorHandler); 
app.use(NotFound);


export default app;