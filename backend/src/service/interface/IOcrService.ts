// backend/src/service/IOcrService.ts
import { Express } from 'express';

interface IOcrService {
  /**
   * Process and analyze the given front and back image files.
   * Returns any result (could be OCR data, filenames, etc) as Promise.
   */
  process(frontImage: Express.Multer.File, backImage: Express.Multer.File): Promise<any>;
}

export default IOcrService;
