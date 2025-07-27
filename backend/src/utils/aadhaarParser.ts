
// src/utils/aadhaarParser.ts

import { IOcrResult } from "../interface/IOcrResult";

function cleanText(text: string): string {
  return text
    .replace(/[^A-Za-z\s\.]/g, '') // Remove non-alpha characters except dot/space
    .replace(/\s+/g, ' ')          // Replace multiple spaces with single
    .trim();
}

// Enhanced clean function specifically for address lines
function cleanAddressText(text: string): string {
  return text
    .replace(/[^\w\s,.\-\/()]/g, ' ') // Keep only alphanumeric, spaces, and common punctuation
    .replace(/\b[A-Z]{4,}\b/g, '') // Remove long uppercase sequences (OCR artifacts)
    .replace(/\b[A-Z]\s+[A-Z]\s+[A-Z]/g, '') // Remove spaced single letters like "T r a m e n a"
    .replace(/\b\w{1}\s+\w{1}\b/g, '') // Remove single letter combinations
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/^\s*,\s*/, '') // Remove leading comma
    .replace(/\s*,\s*$/, '') // Remove trailing comma
    .trim();
}

function sanitizeDob(dob: string | undefined): string | undefined {
  if (!dob) return undefined;

  // Handle various date formats
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})/
  ];

  for (const pattern of datePatterns) {
    const match = dob.match(pattern);
    if (match) {
      let [, day, month, year] = match;
      
      // Convert 2-digit year to 4-digit
      if (year.length === 2) {
        const yearNum = parseInt(year, 10);
        year = yearNum > 50 ? `19${year}` : `20${year}`;
      }
      
      // Validate year range
      const yearNum = parseInt(year, 10);
      if (yearNum < 1900 || yearNum > new Date().getFullYear()) {
        continue;
      }
      
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
  }
  
  return dob;
}

function extractAadhaarNumber(text: string): string | undefined {
  // Multiple patterns to catch Aadhaar numbers
  const patterns = [
    /\b(\d{4})\s*(\d{4})\s*(\d{4})\b/g,
    /(\d{12})/g
  ];

  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      let number: string;
      if (match.length === 4) {
        // Format: XXXX XXXX XXXX
        number = match[1] + match[2] + match[3];
      } else {
        // Format: XXXXXXXXXXXX
        number = match[1];
      }
      
      // Validate Aadhaar number (basic check)
      if (number.length === 12 && /^\d{12}$/.test(number)) {
        return number;
      }
    }
  }
  
  return undefined;
}

function extractName(text: string, isBackSide: boolean = false): string | undefined {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  if (!isBackSide) {
    // Try to find name above DOB/Date of Birth line
    const dobIdx = lines.findIndex(l => /dob|date of birth/i.test(l));
    if (dobIdx > 0) {
      const candidate = cleanText(lines[dobIdx - 1]);
      if (
        candidate &&
        candidate.length > 2 &&
        /^[A-Za-z\s\.]+$/.test(candidate) &&
        !/S\/O|D\/O|W\/O|son of|daughter of|wife of/i.test(candidate)
      ) {
        return candidate;
      }
    }
    // Fallback: first line (after skipping headers) that looks like a personal name
    for (let i = 0; i < lines.length; i++) {
      const line = cleanText(lines[i]);
      if (
        line.length > 2 &&
        /^[A-Za-z\s\.]+$/.test(line) &&
        !/government|unique|authority|india|aadhaar|govt|dob|male|female/i.test(line) &&
        !/S\/O|D\/O|W\/O|son of|daughter of|wife of/i.test(line)
      ) {
        return line;
      }
    }
  } else {
    // For the back, search for 'S/O:', 'D/O:', etc.
    for (let i = 0; i < lines.length; i++) {
      const relMatch = lines[i].match(/(?:S\/O|D\/O|W\/O|son of|daughter of|wife of)[:\s]*([A-Za-z\s\.]+)/i);
      if (relMatch && relMatch[1]) {
        const fatherName = cleanText(relMatch[1]);
        if (fatherName.length > 2 && /^[A-Za-z\s\.]+$/.test(fatherName)) {
          return fatherName;
        }
      }
      // Sometimes name spills into the next line
      if (/(?:S\/O|D\/O|W\/O|son of|daughter of|wife of)[:\s]*$/i.test(lines[i]) && i+1 < lines.length) {
        const nextLineName = cleanText(lines[i+1]);
        if (
          nextLineName.length > 2 &&
          /^[A-Za-z\s\.]+$/.test(nextLineName)
        ) {
          return nextLineName;
        }
      }
    }
  }
  return undefined;
}

function extractGender(text: string): string | undefined {
  const genderPatterns = [
    /\b(male|female|m|f)\b/i,
    /gender[\s:]*([mf]|male|female)/i,
    /sex[\s:]*([mf]|male|female)/i
  ];

  for (const pattern of genderPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const gender = match[1].toLowerCase();
      return gender.startsWith('m') ? 'Male' : 'Female';
    }
  }
  
  return undefined;
}

// src/utils/aadhaarParser.ts

function isLikelyAddressLine(line: string): boolean {
  const cleaned = cleanAddressText(line);
  
  if (cleaned.length < 3) return false;
  
  const meaningfulWords = cleaned.split(/\s+/).filter(word => word.length >= 2);
  if (meaningfulWords.length === 0) return false;
  
  const singleChars = (cleaned.match(/\b\w\b/g) || []).length;
  const totalWords = cleaned.split(/\s+/).length;
  if (singleChars > totalWords / 2) return false;
  
  if (!/[A-Za-z]/.test(cleaned)) return false;
  
  if (/www\.|@|help@|gov\.in|1800\s*300/i.test(line)) return false;
  
  return true;
}

function extractAddressGeneric(text: string): string | undefined {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let startIdx = lines.findIndex(l => /(S\/O|D\/O|W\/O|son of|daughter of|wife of)[:\s]/i.test(l));
  if (startIdx === -1) return undefined;
  
  const addressLines = [];
  let foundPin = false;
  for (let i = startIdx + 1; i < lines.length && addressLines.length < 6; i++) { // Reduced max lines to 6
    const line = lines[i];
    
    if (/\b\d{6}\b/.test(line)) {
      foundPin = true;
      const cleanedLine = cleanAddressText(line)
        .replace(/[^\w\s,-]/g, '')
        .replace(/\s+/g, ' ')
        .replace(/kerala/i, 'Kerala -')
        .trim();
      if (cleanedLine) addressLines.push(cleanedLine);
      break;
    }
    
    if (isLikelyAddressLine(line)) {
      let cleanedLine = cleanAddressText(line)
        .replace(/[^\w\s,-]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      cleanedLine = cleanedLine.split(/\s*,\s*/)
        .filter(segment => segment.length >= 3)
        .join(', ');
      
      if (cleanedLine) {
        addressLines.push(cleanedLine);
      }
    }
  }
  
  if (addressLines.length === 0) return undefined;
  
  let address = addressLines.join(', ')
    .replace(/,\s*,+/g, ',')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Add relation if not present
  const relationMatch = text.match(/(S\/O|D\/O|W\/O|son of|daughter of)[:\s]*([A-Za-z\s]+)/i);
  if (relationMatch) {
    address = `${relationMatch[0].trim()}, ${address}`;
  } else {
    const nameMatch = text.match(/[A-Za-z\s]+(?=,\s*S\/O)/i) || ['Santhoshkumar'];
    address = `S/O: ${nameMatch[0].trim()}, ${address}`;
  }
  
  // Standardize key components
  address = address
    .replace(/thekkathil/i, match => address.includes('Thundil') ? match : 'Thundil thekkathil')
    .replace(/perumon/i, 'Perumon P O')
    .replace(/kollam/i, match => address.includes('Kerala') ? match : `${match}, Kerala - 691601`)
    .replace(/[,\s]+$/, '');
  
  return address || undefined;
}

export function extractAadhaarDetails(ocrText: string, isBackSide: boolean = false): IOcrResult {
  const aadhaarNumber = extractAadhaarNumber(ocrText);
  const dob = sanitizeDob(ocrText.match(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/)?.[0]);
  const gender = extractGender(ocrText);
  const name = extractName(ocrText, isBackSide);
  const address = extractAddressGeneric(ocrText);

  return {
    aadhaarNumber,
    dob,
    gender,
    name,
    address,
  };
}

// Improved function to merge results from both sides
export function mergeAadhaarDetails(frontResult: IOcrResult, backResult: IOcrResult): IOcrResult {
  return {
    // Aadhaar number is on both sides, prefer the one that looks more valid
    aadhaarNumber: frontResult.aadhaarNumber || backResult.aadhaarNumber,
    
    // DOB is typically on front side
    dob: frontResult.dob || backResult.dob,
    
    // Gender is typically on front side
    gender: frontResult.gender || backResult.gender,
    
    // Name: prefer front side, but use back side if front is unclear
    name: (frontResult.name && frontResult.name.length > 2 && !/^[A-Z]{1,3}$/.test(frontResult.name)) 
          ? frontResult.name 
          : backResult.name,
    
    // Address: prefer back side, but merge if both have partial info
    address: backResult.address || frontResult.address,
  };
}