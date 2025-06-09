import express, { Request, Response } from "express";
const router = express.Router();

// POST /proxy/adventures
router.post("/", (req: Request, res: Response) => {
  // TODO: Implement data fetching and validation
  res.json({ message: 'Stub: adventures endpoint' });
});

export default router;
