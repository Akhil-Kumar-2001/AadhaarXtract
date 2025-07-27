import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import ocrRoutes from './routes/ocrRoute';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

app.use(cors({
    origin: process.env.CORS_ORIGIN ,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}))
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({limit: '10mb',  extended: true }));

app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to the backend server!');
}
);
app.use('/api/ocr', ocrRoutes);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
