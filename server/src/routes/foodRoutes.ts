// ============================================================
// GymFuel — Food Routes
// Defines food search and barcode lookup endpoints protected
// by authentication middleware.
// ============================================================

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { searchFood, lookupBarcode } from '../controllers/foodController';

const router = Router();

// Protect all routes under /api/food
router.use(authMiddleware);

// GET /api/food/search?q=banana&page=1&limit=10
router.get('/search', searchFood);

// GET /api/food/barcode/:code
router.get('/barcode/:code', lookupBarcode);

export default router;
export const foodRoutes = router;
