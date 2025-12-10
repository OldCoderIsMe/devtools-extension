import CryptoJS from 'crypto-js';

// Hash 算法
export function md5(input: string): string {
  try {
    return CryptoJS.MD5(input).toString();
  } catch (e) {
    throw new Error('MD5 计算失败');
  }
}

export function sha1(input: string): string {
  try {
    return CryptoJS.SHA1(input).toString();
  } catch (e) {
    throw new Error('SHA1 计算失败');
  }
}

export function sha256(input: string): string {
  try {
    return CryptoJS.SHA256(input).toString();
  } catch (e) {
    throw new Error('SHA256 计算失败');
  }
}

export function sha512(input: string): string {
  try {
    return CryptoJS.SHA512(input).toString();
  } catch (e) {
    throw new Error('SHA512 计算失败');
  }
}

// Base64
export function base64Encode(input: string): string {
  try {
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(input));
  } catch (e) {
    throw new Error('Base64 编码失败');
  }
}

export function base64Decode(input: string): string {
  try {
    const words = CryptoJS.enc.Base64.parse(input);
    return CryptoJS.enc.Utf8.stringify(words);
  } catch (e) {
    throw new Error('Base64 解码失败，请检查输入格式');
  }
}

// AES 加密/解密
export function aesEncrypt(input: string, key: string, keySize: 128 | 256 = 128): string {
  try {
    if (!key) {
      throw new Error('密钥不能为空');
    }
    const keyWords = CryptoJS.enc.Utf8.parse(key);
    const encrypted = CryptoJS.AES.encrypt(input, keyWords, {
      keySize: keySize / 32,
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });
    return encrypted.toString();
  } catch (e: any) {
    throw new Error(e.message || 'AES 加密失败');
  }
}

export function aesDecrypt(input: string, key: string, keySize: 128 | 256 = 128): string {
  try {
    if (!key) {
      throw new Error('密钥不能为空');
    }
    const keyWords = CryptoJS.enc.Utf8.parse(key);
    const decrypted = CryptoJS.AES.decrypt(input, keyWords, {
      keySize: keySize / 32,
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });
    const result = decrypted.toString(CryptoJS.enc.Utf8);
    if (!result) {
      throw new Error('解密失败，请检查密钥和密文是否正确');
    }
    return result;
  } catch (e: any) {
    throw new Error(e.message || 'AES 解密失败');
  }
}

// HMAC
export function hmacMd5(input: string, key: string): string {
  try {
    if (!key) {
      throw new Error('密钥不能为空');
    }
    return CryptoJS.HmacMD5(input, key).toString();
  } catch (e: any) {
    throw new Error(e.message || 'HMAC-MD5 计算失败');
  }
}

export function hmacSha1(input: string, key: string): string {
  try {
    if (!key) {
      throw new Error('密钥不能为空');
    }
    return CryptoJS.HmacSHA1(input, key).toString();
  } catch (e: any) {
    throw new Error(e.message || 'HMAC-SHA1 计算失败');
  }
}

export function hmacSha256(input: string, key: string): string {
  try {
    if (!key) {
      throw new Error('密钥不能为空');
    }
    return CryptoJS.HmacSHA256(input, key).toString();
  } catch (e: any) {
    throw new Error(e.message || 'HMAC-SHA256 计算失败');
  }
}

export function hmacSha512(input: string, key: string): string {
  try {
    if (!key) {
      throw new Error('密钥不能为空');
    }
    return CryptoJS.HmacSHA512(input, key).toString();
  } catch (e: any) {
    throw new Error(e.message || 'HMAC-SHA512 计算失败');
  }
}