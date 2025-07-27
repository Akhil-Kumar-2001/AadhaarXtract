export interface OcrResult {
  name?: string;
  aadhaarNumber?: string;
  dob?: string;
  gender?: string;
  address?: string;
}




export interface IOcrResult {
  success: boolean;
  result: {
    name: string;
    aadhaarNumber: string;
    dob: string;
    gender: string;
    address: string;
  };
}