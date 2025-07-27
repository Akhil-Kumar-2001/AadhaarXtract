
// src/utils/aadhaarOcr.ts
import { createWorker, PSM } from 'tesseract.js';
import sharp from 'sharp';
import path from 'path';

export async function preprocessImage(imagePath: string): Promise<string> {
  const outputPath = imagePath.replace(path.extname(imagePath), '_processed.png');
  
  try {
    await sharp(imagePath)
      .resize(1200, null, { 
        withoutEnlargement: false,
        fit: 'inside'
      })
      .greyscale()
      .normalize()
      .sharpen()
      .png({ quality: 100 })
      .toFile(outputPath);
    
    return outputPath;
  } catch (error) {
    console.error('Image preprocessing failed:', error);
    return imagePath; // Return original if preprocessing fails
  }
}

export async function extractOcrText(imagePath: string): Promise<string> {
  let processedImagePath = imagePath;
  
  try {
    // Preprocess image for better OCR
    processedImagePath = await preprocessImage(imagePath);
    
    const worker = await createWorker('eng', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });

    // Configure Tesseract for better Aadhaar card recognition
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,/-:()@',
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      preserve_interword_spaces: '1',
    });

    const { data: { text, confidence } } = await worker.recognize(processedImagePath);
    
    console.log(`OCR Confidence: ${confidence}%`);
    
    if (confidence < 30) {
      console.warn('Low OCR confidence, results may be unreliable');
    }
    
    await worker.terminate();
    
    // Clean up processed image if it was created
    if (processedImagePath !== imagePath) {
      try {
        const fs = require('fs');
        fs.unlinkSync(processedImagePath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup processed image:', cleanupError);
      }
    }
    
    return text;
  } catch (error) {
    console.error('OCR extraction failed:', error);
    
    // Cleanup on error
    if (processedImagePath !== imagePath) {
      try {
        const fs = require('fs');
        fs.unlinkSync(processedImagePath);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
    
    throw new Error('Failed to extract text from image');
  }
}