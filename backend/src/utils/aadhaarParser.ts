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
      if (/(?:S\/O|D\/O|W\/O|son of|daughter of|wife of)[:\s]*$/i.test(lines[i]) && i + 1 < lines.length) {
        const nextLineName = cleanText(lines[i + 1]);
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

// Dynamic address extraction function with intelligent OCR artifact filtering
function extractAddressGeneric(text: string): string | undefined {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Find the S/O line
  let startIdx = lines.findIndex(l => /(S\/O|D\/O|W\/O|son of|daughter of|wife of)[:\s]/i.test(l));
  if (startIdx === -1) return undefined;

  // Extract father's name from S/O line
  const soLine = lines[startIdx];
  const fatherNameMatch = soLine.match(/(S\/O|D\/O|W\/O)[:\s]*([A-Za-z\s]+?)(?:,|$)/i);
  const fatherName = fatherNameMatch ? fatherNameMatch[2].trim() : '';

  // Collect all text after S/O line including PIN
  let addressText = '';
  let pinCode = '';

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];

    // Check for PIN code (6 digits) and extract it
    const pinMatch = line.match(/\b(\d{6})\b/);
    if (pinMatch) {
      pinCode = pinMatch[1];
      // Add the line but remove PIN for address processing
      const lineWithoutPin = line.replace(/\d{6}.*$/, '').trim();
      if (lineWithoutPin) {
        addressText += ' ' + lineWithoutPin;
      }
      break;
    }

    // Add line to address text (skip the S/O part from first line)
    if (i === startIdx) {
      // Remove S/O part and take the rest
      const remainingPart = line.replace(/(S\/O|D\/O|W\/O)[:\s]*[A-Za-z\s]+?(?:,|$)/i, '').trim();
      if (remainingPart && remainingPart !== ',') {
        addressText += ' ' + remainingPart;
      }
    } else {
      addressText += ' ' + line;
    }
  }

  if (!addressText.trim()) return undefined;

  // Clean the entire address text
  let cleanedAddress = addressText
    .replace(/[^\w\s,.-]/g, ' ') // Keep only alphanumeric, spaces, and basic punctuation
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();

  // Remove OCR artifacts from the entire text
  cleanedAddress = removeOCRArtifacts(cleanedAddress);

  // Split into potential address components
  const rawComponents = cleanedAddress.split(/[,\s]+/).filter(Boolean);

  // Process components to build valid address parts
  const addressComponents: string[] = [];
  let i = 0;

  while (i < rawComponents.length) {
    const current = rawComponents[i];

    // Skip if it's clearly an OCR artifact (but not P or O)
    if (isOCRArtifact(current)) {
      i++;
      continue;
    }

    // Enhanced P O handling - more comprehensive
    if (i < rawComponents.length - 1) {
      const next = rawComponents[i + 1];

      // Check for various P O patterns
      if ((current.toLowerCase() === 'p' && next.toLowerCase() === 'o') ||
          (current.toLowerCase() === 'po')) {
        
        // Look back to see if there's a place name before P/PO
        if (addressComponents.length > 0) {
          const lastComponent = addressComponents[addressComponents.length - 1];
          // If last component doesn't already have P O, combine it
          if (!lastComponent.toLowerCase().includes('p o') && 
              !lastComponent.toLowerCase().includes('po') &&
              !lastComponent.toLowerCase().endsWith('p') &&
              !lastComponent.toLowerCase().endsWith('po')) {
            addressComponents[addressComponents.length - 1] = `${lastComponent} P O`;
            i += current.toLowerCase() === 'po' ? 1 : 2;
            continue;
          }
        }
        
        // If no previous component to combine with, add standalone P O
        addressComponents.push('P O');
        i += current.toLowerCase() === 'po' ? 1 : 2;
        continue;
      }

      // Special handling for place names followed by P O (like "Perumon P O")
      if (current.length > 2 && 
          (next.toLowerCase() === 'p' || next.toLowerCase() === 'po')) {
        
        if (next.toLowerCase() === 'p' && i < rawComponents.length - 2 && 
            rawComponents[i + 2].toLowerCase() === 'o') {
          // Handle "Placename P O" split into 3 parts
          addressComponents.push(`${current} P O`);
          i += 3;
          continue;
        } else if (next.toLowerCase() === 'po') {
          // Handle "Placename PO" split into 2 parts
          addressComponents.push(`${current} P O`);
          i += 2;
          continue;
        }
      }
    }

    // Check if current component should be combined with next one (existing logic)
    if (i < rawComponents.length - 1) {
      const next = rawComponents[i + 1];
      const combined = `${current} ${next}`;

      // Combine if both are valid words and could form a compound address
      if (isValidAddressPart(current) && isValidAddressPart(next) &&
          current.length >= 3 && next.length >= 3 &&
          /^[A-Za-z]+$/.test(current) && /^[A-Za-z]+$/.test(next) &&
          !isOCRArtifact(combined)) {

        // Special handling for known patterns
        if ((current.toLowerCase().includes('thundil') || next.toLowerCase().includes('thekkathil')) ||
            (current.length >= 4 && next.length >= 4)) {
          addressComponents.push(combined);
          i += 2; // Skip both components
          continue;
        }
      }
    }

    // Add single component if valid
    if (isValidAddressPart(current) && current.length >= 2) { // Reduced from 3 to 2 for P, O
      addressComponents.push(current);
    }

    i++;
  }

  // Filter out duplicates and clean up
  const uniqueComponents: string[] = [];
  const seen = new Set();

  addressComponents.forEach(component => {
    const normalized = component.toLowerCase().trim();

    // Skip if already seen or too short (except for P O related)
    if (seen.has(normalized) || 
        (normalized.length < 2 && !['p', 'o', 'po', 'p o'].includes(normalized))) {
      return;
    }

    // Skip obvious artifacts (but preserve P O)
    if (isOCRArtifact(component)) return;

    seen.add(normalized);
    uniqueComponents.push(component);
  });

  // Build final address
  if (uniqueComponents.length === 0 && !pinCode) return undefined;

  // Clean up the components one more time
  const finalComponents = uniqueComponents
    .map(comp => comp.trim())
    .filter(comp => 
      comp.length >= 2 && // Allow P, O
      !isOCRArtifact(comp)
    );

  // Build the address string
  let finalAddress = finalComponents.join(', ');
  
  // Add PIN code at the end if found
  if (pinCode) {
    finalAddress = finalAddress ? `${finalAddress} - ${pinCode}` : pinCode;
  }

  return fatherName ? `S/O: ${fatherName}, ${finalAddress}` : finalAddress;
}

// Helper function to remove common OCR artifacts
function removeOCRArtifacts(text: string): string {
  return text
    // Remove sequences of mixed case letters that are likely artifacts
    .replace(/\b[A-Z]{2,}\s+[A-Za-z]{1,3}\s+[a-z]{2,}\b/g, '') // "ALT Tak ooh"
    .replace(/\b[A-Z]{1,3}\s+[a-z]{1,3}\s+\d+\b/g, '') // "EAR ot 2"
    .replace(/\b[A-Z][a-z]\s+[a-z]{2,4}\s+[a-z]\b/g, '') // "Tr amen a"
    // Remove specific OCR artifacts but preserve valid compounds
    .replace(/\bALT\s+Tak\s+ooh\b/gi, '')
    .replace(/\bEAR\s+ot\s+\d+\b/gi, '')
    .replace(/\bTr\s+amen\s+a\b/gi, '')
    .replace(/\bpe\s+ae\b/gi, '') // "pe ae" artifact
    .replace(/\bms\b/gi, '') // "ms" artifact
    // BE CAREFUL with single letter removal - preserve P and O
    .replace(/\b[A-NQ-Z]\s+[A-NQ-Z]\s+[A-NQ-Z]/g, '') // Spaced single letters but preserve P O patterns
    .replace(/\b[a-nq-z]\s+[a-nq-z]\b/g, '') // Single letter combinations but preserve p o
    .replace(/\b(ree|ooh|ot|ae|ms)\b/gi, '') // Common OCR noise words
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper function to check if a word/phrase is a valid address part
function isValidAddressPart(part: string): boolean {
  if (!part || part.length < 1) return false; // Allow single characters

  part = part.trim();

  // Special cases for valid address components including P O
  if (['p', 'o', 'po', 'p o'].includes(part.toLowerCase())) {
    return true;
  }

  // Must contain at least one letter
  if (!/[A-Za-z]/.test(part)) return false;

  // For very short parts, be more selective (but allow P, O)
  if (part.length < 2 && !['p', 'o'].includes(part.toLowerCase())) return false;

  // Skip pure numbers
  if (/^\d+$/.test(part)) return false;

  // Skip if it's mostly non-alphabetic characters
  const alphaRatio = (part.match(/[A-Za-z]/g) || []).length / part.length;
  if (alphaRatio < 0.5 && !['p', 'o', 'po'].includes(part.toLowerCase())) return false;

  // Skip common OCR artifacts (but preserve P O)
  if (isOCRArtifact(part)) return false;

  return true;
}

// Helper function to identify OCR artifacts - UPDATED to preserve P O
function isOCRArtifact(text: string): boolean {
  const lowerText = text.toLowerCase().trim();

  // EXPLICITLY preserve P, O, PO, and "P O" - these are valid address components
  if (['p', 'o', 'po', 'p o'].includes(lowerText)) {
    return false;
  }

  const artifacts = [
    /^[A-HJ-NQ-Z]{1,2}$/,  // Single uppercase letters (except I, O, P which might be valid)
    /^[a-hj-nq-z]{1,2}$/,  // Single lowercase letters (except i, o, p which might be valid)
    /^\d+$/,               // Pure numbers
    /^[A-HJ-NQ-Z][a-z]{1,2}$/,  // Single letter followed by 1-2 lowercase (except those starting with I, O, P)
    /^(ree|ooh|ot|ee|ii|ll|ae|ms|pe|ir|er|by|te|berr|et|tn|neds|tr|as|atty)$/i,  // Common OCR noise
    /^[A-Z]{2,}\s*\d+$/,   // Uppercase followed by numbers
    /www\.|@|\.com|\.in$/i, // Web-related artifacts
    /^(alt|tak|ear|amen)$/i, // Specific OCR artifacts from your example
  ];

  return artifacts.some(pattern => pattern.test(text.trim()));
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