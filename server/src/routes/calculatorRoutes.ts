import { Router } from 'express';
import {
  getTDEE,
  getBMI,
  getProteinRange,
  getOneRepMax,
} from '../controllers/calculatorController';

const router = Router();

// GET /api/calculator/tdee — Get TDEE & macro targets
router.get('/tdee', getTDEE);

// GET /api/calculator/bmi — Get BMI & classification
router.get('/bmi', getBMI);

// GET /api/calculator/protein — Get protein range targets
router.get('/protein', getProteinRange);

// GET /api/calculator/1rm — Get estimated 1-Rep Max
router.get('/1rm', getOneRepMax);

export default router;
