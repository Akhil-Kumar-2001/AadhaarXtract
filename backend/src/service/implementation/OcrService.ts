
// src/service/implementation/OcrService.ts
import { IOcrResult } from '../../interface/IOcrResult';
import { extractOcrText } from '../../utils/aadhaarOcr';
import { extractAadhaarDetails, mergeAadhaarDetails } from '../../utils/aadhaarParser';
import IOcrService from '../interface/IOcrService';

class OcrService implements IOcrService {
  async process(frontImage: Express.Multer.File, backImage: Express.Multer.File): Promise<IOcrResult> {
    try {
      console.log('Starting OCR processing...');
      
      // Extract text from both images
      const [frontText, backText] = await Promise.all([
        extractOcrText(frontImage.path),
        extractOcrText(backImage.path)
      ]);

      console.log('Front OCR Text (first 200 chars):', frontText.substring(0, 200));
      console.log('Back OCR Text (first 200 chars):', backText.substring(0, 200));

      // Determine which side is which based on content
      const { frontSideText, backSideText } = this.identifySides(frontText, backText);
      
      // Extract details from both sides
      const frontDetails = extractAadhaarDetails(frontSideText, false);
      const backDetails = extractAadhaarDetails(backSideText, true);
      
      console.log('Front details:', frontDetails);
      console.log('Back details:', backDetails);

      // Merge results intelligently
      const mergedResult = mergeAadhaarDetails(frontDetails, backDetails);
      
      console.log('Merged result:', mergedResult);
      
      // Validate the result
      this.validateResult(mergedResult);
      
      return mergedResult;
    } catch (error) {
      console.error('OCR processing error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Identify which image is front and which is back based on content
   */
  private identifySides(text1: string, text2: string): { frontSideText: string, backSideText: string } {
    const frontIndicators = [
      'government of india',
      'govt of india',
      'dob',
      'date of birth',
      'male',
      'female'
    ];

    const backIndicators = [
      'address',
      's/o',
      'd/o',
      'son of',
      'daughter of',
      'pin code',
      'pincode'
    ];

    const text1Lower = text1.toLowerCase();
    const text2Lower = text2.toLowerCase();

    const text1FrontScore = frontIndicators.reduce((score, indicator) => 
      score + (text1Lower.includes(indicator) ? 1 : 0), 0);
    const text1BackScore = backIndicators.reduce((score, indicator) => 
      score + (text1Lower.includes(indicator) ? 1 : 0), 0);

    const text2FrontScore = frontIndicators.reduce((score, indicator) => 
      score + (text2Lower.includes(indicator) ? 1 : 0), 0);
    const text2BackScore = backIndicators.reduce((score, indicator) => 
      score + (text2Lower.includes(indicator) ? 1 : 0), 0);

    console.log('Side scores - Text1: Front:', text1FrontScore, 'Back:', text1BackScore);
    console.log('Side scores - Text2: Front:', text2FrontScore, 'Back:', text2BackScore);

    // Determine sides based on scores
    if (text1FrontScore > text1BackScore && text2BackScore > text2FrontScore) {
      return { frontSideText: text1, backSideText: text2 };
    } else if (text2FrontScore > text2BackScore && text1BackScore > text1FrontScore) {
      return { frontSideText: text2, backSideText: text1 };
    } else {
      console.warn('Could not reliably identify sides, using default assumption. Text1 sample:', text1.substring(0, 50), 'Text2 sample:', text2.substring(0, 50));
      return { frontSideText: text1, backSideText: text2 };
    }
  }

  /**
   * Validate the extracted result
   */
  private validateResult(result: IOcrResult): void {
    const errors: string[] = [];

    // Validate Aadhaar number
    if (!result.aadhaarNumber) {
      errors.push('Aadhaar number not found');
    } else if (!/^\d{12}$/.test(result.aadhaarNumber)) {
      errors.push('Invalid Aadhaar number format');
    }

    // Validate date of birth
    if (result.dob && !/^\d{2}\/\d{2}\/\d{4}$/.test(result.dob)) {
      errors.push('Invalid date of birth format');
    }

    // Validate gender
    if (result.gender && !['Male', 'Female'].includes(result.gender)) {
      errors.push('Invalid gender value');
    }

    // Basic address validation
    if (result.address && !/kerala\s*-\s*\d{6}/i.test(result.address)) {
      console.warn('Address may be incomplete: Missing Kerala PIN format');
    } else if (!result.address) {
      console.warn('Address not extracted');
    }

    if (errors.length > 0) {
      console.error('Validation errors:', errors);
    }
  }
}

export default OcrService;