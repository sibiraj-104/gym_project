// ============================================================
// GymFuel — Food Routes
// Defines food search and barcode lookup endpoints protected
// by authentication middleware.
// ============================================================

import { Router } from 'express';
import { authenticateUser } from '../middleware/auth';
import {
  searchFood,
  lookupBarcode,
  scanFood,
} from '../controllers/foodController';
import { uploadSingleImage } from '../middleware/upload';

const router = Router();

// Protect all routes under /api/food
router.use(authenticateUser);

// GET /api/food/search?q=banana&page=1&limit=10
router.get('/search', searchFood);

// GET /api/food/barcode/:code
router.get('/barcode/:code', lookupBarcode);

// POST /api/food/scan
router.post('/scan', uploadSingleImage, scanFood);

export default router;
export const foodRoutes = router;
