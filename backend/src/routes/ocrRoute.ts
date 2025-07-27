// backend/src/routes/ocrRoute.ts
import { Router } from 'express';
import upload from '../config/multerConfig';
import IOcrService from '../service/interface/IOcrService';
import IOcrController from '../controller/interface/IOcrController';
import OcrService from '../service/implementation/OcrService';
import OcrController from '../controller/implementation/OcrController';


const router = Router();

// Dependency injection with interfaces -- highly testable
const ocrService: IOcrService = new OcrService();
const ocrController: IOcrController = new OcrController(ocrService);

router.post(
  '/process',
  upload.fields([
    { name: 'frontImage', maxCount: 1 },
    { name: 'backImage', maxCount: 1 }
  ]),
  ocrController.processImages.bind(ocrController)
);

export default router;
