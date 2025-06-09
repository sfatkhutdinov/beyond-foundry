import express, { Request, Response } from "express";
const router = express.Router();

// POST /proxy/rules
router.post(
  "/",
  (req: Request, res: Response) => {
    // TODO: Implement data fetching and validation
    res.json({ message: "Stub: rules endpoint" });
  }
);

export default router;
