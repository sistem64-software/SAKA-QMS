# Lisanslama Sistemi Kullanım Kılavuzu

## Genel Bakış

SAKA QMS, offline hardware-locked lisanslama sistemi ile korunmaktadır. Sistem, her bilgisayarın benzersiz donanım kimliğini (HWID) kullanarak lisans kontrolü yapar.

## Sistem Mimarisi

### 1. Hardware Fingerprint (HWID)
- CPU Serial Number
- Motherboard Serial Number  
- Disk Serial Number

Bu bilgiler birleştirilip SHA-256 ile hash'lenerek benzersiz bir HWID oluşturulur.

### 2. RSA Doğrulama
- Public Key uygulama içine gömülüdür
- Private Key sadece lisans üretimi için kullanılır
- Her lisans anahtarı, belirli bir HWID için özel olarak imzalanır

## Kullanıcı Tarafı

### İlk Kurulum

1. Uygulamayı başlatın
2. Aktivasyon penceresi otomatik açılır
3. Makine Kimliği'ni (HWID) kopyalayın
4. Lisans sağlayıcınıza HWID'yi gönderin
5. Size verilen lisans anahtarını girin
6. "Aktifleştir" butonuna tıklayın

### Lisans Kontrolü

- Uygulama her başlatıldığında lisans kontrolü yapılır
- Lisans geçerli ise uygulama normal şekilde açılır
- Lisans geçersiz veya yoksa aktivasyon penceresi gösterilir

## Admin Tarafı (Lisans Üretme)

### Gereksinimler

1. Private Key dosyası (`private_key.pem`)
2. Python 3.7+
3. `cryptography` kütüphanesi

### Private Key Hazırlama

Private key'inizi güvenli bir şekilde saklayın. Key'i şu yollardan biriyle sağlayabilirsiniz:

#### Yöntem 1: Ortam Değişkeni (Önerilen)
```bash
# Windows PowerShell
$env:PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Linux/Mac
export PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

#### Yöntem 2: Dosya Yolu
```bash
# Windows PowerShell
$env:PRIVATE_KEY_PATH="C:\path\to\private_key.pem"

# Linux/Mac
export PRIVATE_KEY_PATH="/path/to/private_key.pem"
```

#### Yöntem 3: Varsayılan Konum
Private key'i `backend/private_key.pem` konumuna yerleştirin.

### Lisans Üretme

```bash
# HWID ile direkt
python backend/admin_key_generator.py <HWID>

# Interaktif mod
python backend/admin_key_generator.py
```

Örnek:
```bash
python backend/admin_key_generator.py a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
```

### Çıktı

Script, Base64 encoded lisans anahtarını üretir. Bu anahtarı müşteriye gönderin.

## Güvenlik Notları

1. **Private Key Güvenliği**
   - Private key'i asla kod içine hardcode ETMEYİN
   - Private key'i versiyon kontrol sistemine (Git) eklemeyin
   - Private key'i güvenli bir yerde saklayın
   - Şifre korumalı key kullanın

2. **Public Key**
   - Public key uygulama içine gömülüdür
   - Production'da kod obfuscation kullanın (örn: PyArmor)

3. **Lisans Dosyası**
   - Lisans dosyası kullanıcı dizininde saklanır
   - Windows: `%APPDATA%\.saka_qms\license.dat`
   - Linux/Mac: `~/.saka_qms/license.dat`

## Sorun Giderme

### HWID Okunamıyor
- Sistem, okunamayan bileşenler için "UNKNOWN" değeri kullanır
- Bu durumda HWID hala üretilir ancak daha az benzersiz olabilir

### Lisans Doğrulanamıyor
- HWID'nin değişmediğinden emin olun
- Lisans anahtarının doğru kopyalandığından emin olun
- Private/Public key çiftinin eşleştiğinden emin olun

### Lisans Dosyası Bulunamıyor
- Uygulama otomatik olarak lisans dosyasını oluşturur
- Dosya izinlerini kontrol edin

## API Endpoints

### `GET /api/license/status`
Lisans durumunu kontrol eder.

**Response:**
```json
{
  "is_licensed": true,
  "hwid": null,
  "message": "Lisans aktif"
}
```

### `GET /api/license/hwid`
HWID'yi döndürür.

**Response:**
```json
{
  "hwid": "a1b2c3d4e5f6..."
}
```

### `POST /api/license/activate`
Lisansı aktifleştirir.

**Request:**
```json
{
  "license_key": "base64_encoded_key"
}
```

**Response:**
```json
{
  "is_licensed": true,
  "message": "Lisans başarıyla aktifleştirildi"
}
```

### `POST /api/license/verify`
Lisans anahtarını doğrular (kaydetmeden).

**Request:**
```json
{
  "license_key": "base64_encoded_key"
}
```

## Test Etme

1. Uygulamayı başlatın ve HWID'yi alın
2. Admin aracı ile lisans üretin
3. Üretilen lisansı uygulamaya girin
4. Uygulamanın açıldığını doğrulayın

## Destek

Sorunlar için lisans sağlayıcınızla iletişime geçin.

