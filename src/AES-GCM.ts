export default class AES_GCM {
  key: CryptoKey;
  constructor(key: CryptoKey) {
    this.key = key;
  }

  static async importKey(keyData: Uint8Array): Promise<AES_GCM> {
    const key = await crypto.subtle.importKey("raw", keyData, "AES-GCM", true, [
      "encrypt",
      "decrypt",
    ]);
    return new AES_GCM(key);
  }

  async encryptMessage(msg: Uint8Array): Promise<Uint8Array> {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      this.key,
      msg
    );
    const buffer = new Uint8Array(iv.length + ciphertext.byteLength);
    buffer.set(iv);
    buffer.set(new Uint8Array(ciphertext), iv.length);
    return buffer;
  }

  async decryptMessage(msg: Uint8Array): Promise<Uint8Array> {
    const iv = msg.slice(0, 12);
    const ciphertext = msg.slice(12);
    let decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      this.key,
      ciphertext
    );
    return new Uint8Array(decrypted);
  }

}