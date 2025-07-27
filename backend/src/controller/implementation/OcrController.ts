// // backend/src/controller/OcrController.ts
// import { Request, Response } from 'express';
// import IOcrController from '../interface/IOcrController';
// import IOcrService from '../../service/interface/IOcrService';

// class OcrController implements IOcrController {
//   private _ocrService: IOcrService;

//   constructor(ocrService: IOcrService) {
//     this._ocrService = ocrService;
//   }

//   async processImages(req: Request, res: Response): Promise<void> {
//     try {
//       const files = req.files as { [field: string]: Express.Multer.File[] };
//       if (!files?.frontImage?.length || !files?.backImage?.length) {
//         res.status(400).json({ error: 'Both files are required.' });
//         return;
//       }
//       const result = await this._ocrService.process(files.frontImage[0], files.backImage[0]);
//       res.json({ message: 'Files received!', result });
//     } catch (err) {
//       res.status(500).json({ error: 'Server error' });
//     }
//   }
// }

// export default OcrController;



import { Request, Response } from 'express';
import IOcrController from '../interface/IOcrController';
import IOcrService from '../../service/interface/IOcrService';

class OcrController implements IOcrController {
  private _ocrService: IOcrService;

  constructor(ocrService: IOcrService) {
    this._ocrService = ocrService;
  }

  async processImages(req: Request, res: Response): Promise<void> {
    try {
      console.log("hey iam here")
      const files = req.files as { [field: string]: Express.Multer.File[] };
      if (!files?.frontImage?.length || !files?.backImage?.length) {
        res.status(400).json({ error: 'Both front and back images are required.' });
        return;
      }

      const frontImage = files.frontImage[0];
      const backImage = files.backImage[0];

      const result = await this._ocrService.process(frontImage, backImage);

      res.json({ success: true, result });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Server error' });
    }
  }
}

export default OcrController;
