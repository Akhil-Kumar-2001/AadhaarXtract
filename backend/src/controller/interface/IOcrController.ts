// backend/src/controller/IOcrController.ts
import { Request, Response } from 'express';

interface IOcrController {
  processImages(req: Request, res: Response): Promise<void>;
}

export default IOcrController;
