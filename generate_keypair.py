"""
RSA Key Pair Generator - Private/Public Key Çifti Üretme Aracı

Bu script, lisanslama sistemi için RSA key pair üretir.

Kullanım:
    python generate_keypair.py

Çıktı:
    - private_key.pem: Private key (güvenli saklayın!)
    - public_key.pem: Public key (uygulamaya gömülecek)
"""

from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend
from pathlib import Path


def generate_keypair():
    """RSA key pair üret"""
    print("🔐 RSA Key Pair üretiliyor...")
    
    # 2048-bit RSA key üret
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend()
    )
    
    # Public key'i private key'den al
    public_key = private_key.public_key()
    
    # Private key'i PEM formatında serialize et
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    # Public key'i PEM formatında serialize et
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    
    # Dosyalara kaydet
    private_key_path = Path("private_key.pem")
    public_key_path = Path("public_key.pem")
    
    with open(private_key_path, 'wb') as f:
        f.write(private_pem)
    
    with open(public_key_path, 'wb') as f:
        f.write(public_pem)
    
    print(f"✅ Private key kaydedildi: {private_key_path.absolute()}")
    print(f"✅ Public key kaydedildi: {public_key_path.absolute()}")
    print()
    print("⚠️  ÖNEMLİ GÜVENLİK UYARILARI:")
    print("   1. private_key.pem dosyasını GÜVENLİ bir yerde saklayın!")
    print("   2. private_key.pem dosyasını Git'e EKLEMEYİN!")
    print("   3. private_key.pem dosyasını asla paylaşmayın!")
    print("   4. public_key.pem içeriğini license_manager.py'ye kopyalayın")
    print()
    print("📋 Public Key (license_manager.py'ye kopyalayın):")
    print("-" * 60)
    print(public_pem.decode())
    print("-" * 60)


if __name__ == "__main__":
    generate_keypair()

