import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import logger from './logger';
import CONFIG from './config';

// Import all routers
import authRouter from './auth';
import lookupRouter from './lookup';
import adventuresRouter from './adventures';
import backgroundsRouter from './backgrounds';
import campaignRouter from './campaign';
import characterRouter from './character';
import classRouter from './class';
import featsRouter from './feats';
import filterModifiersRouter from './filterModifiers';
import itemsRouter from './items';
import monstersRouter from './monsters';
import racesRouter from './races';
import rulesRouter from './rules';
import spellsRouter from './spells';
import rpgspellRouter from './rpgspell';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT ?? 4000;

// Middleware
app.use(cors({
  origin: true, // Or configure specific origins
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Basic request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info({ method: req.method, url: req.originalUrl, ip: req.ip });
  next();
});

// API Routes
app.use('/proxy/auth', authRouter);
app.use('/proxy/lookup', lookupRouter);
app.use('/proxy/adventures', adventuresRouter);
app.use('/proxy/backgrounds', backgroundsRouter);
app.use('/proxy/campaign', campaignRouter);
app.use('/proxy/character', characterRouter);
app.use('/proxy/classes', classRouter); // Register /proxy/classes endpoint for classRouter
app.use('/proxy/feats', featsRouter);
app.use('/proxy/filterModifiers', filterModifiersRouter);
app.use('/proxy/items', itemsRouter);
app.use('/proxy/monsters', monstersRouter);
app.use('/proxy/races', racesRouter);
app.use('/proxy/rules', rulesRouter);
app.use('/proxy/spells', spellsRouter);
app.use('/proxy/rpgspell-1', rpgspellRouter);


// Serve the CONFIG object
app.get('/proxy/config', (_req: Request, res: Response) => {
  res.json(CONFIG);
});

// Root/Health check
app.get('/', (_req: Request, res: Response) => {
  res.send('Beyond Foundry Proxy is running!');
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Global Error: ${err.message}`, { stack: err.stack });
  // Avoid sending stack trace to client in production
  const statusCode = (err as any).status ?? 500;
  res.status(statusCode).send({
    error: 'Internal ServerError',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : err.message,
  });
});

// Start Server
app.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
  logger.info(`Access the proxy at http://localhost:${PORT}`);
});

export default app; // Optional: export app for testing or other purposes
