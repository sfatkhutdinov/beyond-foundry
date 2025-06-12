// filepath: /Users/macbook-pro/Documents/Programming/beyond-foundry/beyond-foundry-proxy/src/races.js
import express from "express";
const router = express.Router();
router.use(express.json());
// POST /proxy/races
router.post("/races", (req, res) => {
    try {
        const { cobalt } = req.body;
        if (!cobalt) {
            return res.status(400).json({ success: false, message: "Missing cobalt token" });
        }
        // TODO: Implement data fetching and validation
        res.json({ success: true, data: [{ id: 1, name: "Human" }] });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return res.status(500).json({ success: false, message });
    }
});
export default router;
