
import CryptoJS from 'crypto-js';

const IMAGEKIT_PUBLIC_KEY = 'public_h3CqJb9U6F/7H2MBHRjHAMidWKE=';
const IMAGEKIT_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload';
const IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/vyxxk6qcw';


const IMAGEKIT_PRIVATE_KEY = 'private_mubtNudwxsXIQZY557GhFP2xGgA='; 

export interface ImageKitUploadResult {
  url: string;
  fileId: string;
  name: string;
}


function generateSignature(token: string, expire: number, privateKey: string): string {
  const message = token + expire;
  
  
  const signature = CryptoJS.HmacSHA1(message, privateKey);
  return signature.toString(CryptoJS.enc.Hex);
}


function generateToken(): string {
  
  const timestamp = Date.now().toString(16);
  const random1 = Math.random().toString(16).substring(2);
  const random2 = Math.random().toString(16).substring(2);
  return timestamp + random1 + random2;
}


export async function uploadToImageKit(
  fileUri: string,
  fileName: string
): Promise<ImageKitUploadResult> {
  try {
    const token = generateToken();
    const expire = Math.floor(Date.now() / 1000) + 3600; 
    const signature = generateSignature(token, expire, IMAGEKIT_PRIVATE_KEY);

    const formData = new FormData();

    
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: 'image/jpeg',
    } as unknown as Blob);

    formData.append('fileName', fileName);
    formData.append('publicKey', IMAGEKIT_PUBLIC_KEY);
    formData.append('signature', signature);
    formData.append('expire', String(expire));
    formData.append('token', token);
    formData.append('folder', '/avatars');

    const response = await fetch(IMAGEKIT_UPLOAD_URL, {
      method: 'POST',
      body: formData,
      headers: {
        
      },
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`ImageKit upload failed: ${err}`);
    }

    const data = await response.json();
    
    return {
      url: data.url as string,
      fileId: data.fileId as string,
      name: data.name as string,
    };
  } catch (error) {
    throw error;
  }
}

export function imageKitUrl(path: string, transforms = 'tr:w-200,h-200,c-at_max'): string {
  return `${IMAGEKIT_URL_ENDPOINT}/${transforms}/${path}`;
}
