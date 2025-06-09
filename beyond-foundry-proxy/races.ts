import express, { Request, Response } from "express";
const router = express.Router();

// POST /proxy/races
router.post(
  "/",
  (req: Request, res: Response) => {
    // TODO: Implement data fetching and validation
    res.json({ message: "Stub: races endpoint" });
  }
);

export default router;
