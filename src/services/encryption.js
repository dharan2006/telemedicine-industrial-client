import CryptoJS from 'crypto-js';

class EncryptionService {
  constructor() {
    this.sharedSecret = null;
  }

  // Generate shared secret (in real app, use ECDH key exchange)
  generateSharedSecret() {
    this.sharedSecret = CryptoJS.lib.WordArray.random(256 / 8).toString();
    return this.sharedSecret;
  }

  setSharedSecret(secret) {
    this.sharedSecret = secret;
  }

  // Encrypt data using AES-256
  encrypt(data) {
    if (!this.sharedSecret) {
      throw new Error('Shared secret not set');
    }

    return CryptoJS.AES.encrypt(JSON.stringify(data), this.sharedSecret).toString();
  }

  // Decrypt data
  decrypt(encryptedData) {
    if (!this.sharedSecret) {
      throw new Error('Shared secret not set');
    }

    const bytes = CryptoJS.AES.decrypt(encryptedData, this.sharedSecret);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  }

  // Hash data (for verification)
  hash(data) {
    return CryptoJS.SHA256(data).toString();
  }
}

export default new EncryptionService();
