// filepath: /Users/macbook-pro/Documents/Programming/beyond-foundry/beyond-foundry-proxy/src/backgrounds.ts
import express, { Router, Request, Response, NextFunction } from "express";
const router: Router = express.Router();
router.use(express.json());

interface BackgroundsRequestBody {
    cobalt?: string;
    name?: string;
}

// Placeholder for actual background data fetcher
async function getBackgrounds(params: BackgroundsRequestBody): Promise<any[]> { // Added types for params
    // TODO: Implement real fetch/scrape logic
    // For now, just using params to avoid unused variable error
    console.log('Fetching backgrounds with params:', params);
    return [
        // Example background object
        { id: 1, name: "Acolyte" },
    ];
}

router.post("/backgrounds", async (req: Request<{}, any, BackgroundsRequestBody>, res: Response, next: NextFunction): Promise<void> => { // Added types and next
    try {
        const { cobalt, name } = req.body;
        if (!cobalt) {
            res.status(400).json({ success: false, message: "Missing cobalt token" });
            return;
        }
        const data = await getBackgrounds({ cobalt, name });
        res.json({ success: true, data }); // Removed return here, res.json() sends response
    }
    catch (err) {
        // const message = err instanceof Error ? err.message : String(err);
        // res.status(500).json({ success: false, message });
        next(err); // Pass error to global error handler
    }
});

export default router;
