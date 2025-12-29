"""
Admin Key Generator - Lisans Anahtarı Üretme Aracı
HWID'yi Private Key ile imzalayarak lisans anahtarı üretir.

Kullanım:
    python admin_key_generator.py <HWID>
    
veya

    python admin_key_generator.py  # HWID'yi interaktif olarak ister

Ortam Değişkeni:
    PRIVATE_KEY_PATH: Private key dosyasının yolu (varsayılan: ./private_key.pem)
    
veya

    PRIVATE_KEY: Private key'in kendisi (PEM formatında)
"""

import sys
import os
import base64
import hashlib
from pathlib import Path
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.hazmat.backends import default_backend


def load_private_key():
    """
    Private key'i yükle
    Önce PRIVATE_KEY ortam değişkeninden, sonra PRIVATE_KEY_PATH'den, 
    son olarak varsayılan konumdan okur.
    """
    # 1. Ortam değişkeninden direkt key
    private_key_pem = os.getenv("PRIVATE_KEY")
    if private_key_pem:
        try:
            return serialization.load_pem_private_key(
                private_key_pem.encode(),
                password=None,
                backend=default_backend()
            )
        except Exception as e:
            print(f"PRIVATE_KEY ortam değişkeninden key yüklenemedi: {e}")
            sys.exit(1)
    
    # 2. Dosya yolundan
    private_key_path = os.getenv("PRIVATE_KEY_PATH", "./private_key.pem")
    private_key_file = Path(private_key_path)
    
    if not private_key_file.exists():
        print(f"❌ Hata: Private key dosyası bulunamadı: {private_key_path}")
        print("\n📝 Private key'i şu yollardan biriyle sağlayabilirsiniz:")
        print("   1. PRIVATE_KEY ortam değişkenine PEM formatında key'i ekleyin")
        print("   2. PRIVATE_KEY_PATH ortam değişkenine dosya yolunu belirtin")
        print("   3. Varsayılan konuma (./private_key.pem) dosyayı yerleştirin")
        print("\n⚠️  Güvenlik: Private key'i kod içine hardcode ETMEYİN!")
        sys.exit(1)
    
    try:
        with open(private_key_file, 'rb') as f:
            private_key_data = f.read()
        
        # Şifre korumalı key için password sor
        try:
            private_key = serialization.load_pem_private_key(
                private_key_data,
                password=None,
                backend=default_backend()
            )
        except TypeError:
            # Şifre korumalı key
            import getpass
            password = getpass.getpass("Private key şifresi: ")
            private_key = serialization.load_pem_private_key(
                private_key_data,
                password=password.encode(),
                backend=default_backend()
            )
        
        return private_key
    except Exception as e:
        print(f"❌ Private key yüklenemedi: {e}")
        sys.exit(1)


def generate_license_key(hwid: str, private_key) -> str:
    """
    HWID'yi Private Key ile imzalayarak lisans anahtarı üret
    
    Args:
        hwid: Hardware ID
        private_key: RSA Private Key
        
    Returns:
        Base64 encoded lisans anahtarı
    """
    # HWID'yi SHA-256 ile hash'le
    hwid_hash = hashlib.sha256(hwid.encode()).digest()
    
    # Private key ile imzala
    signature = private_key.sign(
        hwid.encode(),  # Orijinal HWID'yi imzala
        padding.PKCS1v15(),
        hashes.SHA256()
    )
    
    # Base64 encode
    license_key = base64.b64encode(signature).decode()
    
    return license_key


def main():
    """Ana fonksiyon"""
    print("=" * 60)
    print("🔐 SAKA QMS - Lisans Anahtarı Üretme Aracı")
    print("=" * 60)
    print()
    
    # HWID al
    if len(sys.argv) > 1:
        hwid = sys.argv[1].strip()
    else:
        hwid = input("HWID'yi girin: ").strip()
    
    if not hwid:
        print("❌ Hata: HWID boş olamaz!")
        sys.exit(1)
    
    # Private key yükle
    print("\n📂 Private key yükleniyor...")
    try:
        private_key = load_private_key()
        print("✅ Private key yüklendi")
    except Exception as e:
        print(f"❌ Hata: {e}")
        sys.exit(1)
    
    # Lisans anahtarı üret
    print(f"\n🔨 Lisans anahtarı üretiliyor (HWID: {hwid[:16]}...)")
    try:
        license_key = generate_license_key(hwid, private_key)
        print("✅ Lisans anahtarı üretildi!")
    except Exception as e:
        print(f"❌ Hata: Lisans anahtarı üretilemedi: {e}")
        sys.exit(1)
    
    # Sonuçları göster
    print("\n" + "=" * 60)
    print("📋 LİSANS ANAHTARI")
    print("=" * 60)
    print()
    print(license_key)
    print()
    print("=" * 60)
    print()
    
    # Kopyalama kolaylığı için
    print("💡 İpucu: Yukarıdaki lisans anahtarını kopyalayıp müşteriye gönderebilirsiniz.")
    print()
    
    # Doğrulama (opsiyonel)
    verify = input("Doğrulama yapmak ister misiniz? (e/h): ").strip().lower()
    if verify == 'e':
        print("\n🔍 Doğrulama yapılıyor...")
        try:
            # Public key'i yükle (license_manager'dan)
            from license_manager import PUBLIC_KEY_PEM
            public_key = serialization.load_pem_public_key(
                PUBLIC_KEY_PEM.encode(),
                backend=default_backend()
            )
            
            # İmzayı doğrula
            signature_bytes = base64.b64decode(license_key)
            public_key.verify(
                signature_bytes,
                hwid.encode(),
                padding.PKCS1v15(),
                hashes.SHA256()
            )
            print("✅ Doğrulama başarılı! Lisans anahtarı geçerli.")
        except Exception as e:
            print(f"❌ Doğrulama hatası: {e}")
    
    print("\n✨ İşlem tamamlandı!")


if __name__ == "__main__":
    main()

