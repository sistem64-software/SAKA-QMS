# Lisanslama Sistemi Kurulum Kılavuzu

## ✅ Tamamlanan İşlemler

Offline hardware-locked lisanslama sistemi başarıyla entegre edilmiştir. Aşağıdaki bileşenler oluşturulmuştur:

### Backend Bileşenleri

1. **`backend/license_manager.py`**
   - HWID üretimi (CPU, Motherboard, Disk Serial)
   - RSA tabanlı lisans doğrulama
   - Lisans kaydetme/yükleme
   - Windows, Linux, macOS desteği

2. **`backend/api/license.py`**
   - `/api/license/status` - Lisans durumu
   - `/api/license/hwid` - HWID alma
   - `/api/license/activate` - Lisans aktifleştirme
   - `/api/license/verify` - Lisans doğrulama

3. **`backend/main.py`**
   - Lisans kontrolü middleware'i eklendi
   - Korumalı endpoint'ler için otomatik kontrol

4. **`backend/admin_key_generator.py`**
   - HWID'den lisans anahtarı üretme aracı
   - Private key güvenli yükleme (ortam değişkeni/dosya)

5. **`backend/generate_keypair.py`**
   - RSA key pair üretme aracı (isteğe bağlı)

### Frontend Bileşenleri

1. **`frontend/src/components/ActivationDialog.jsx`**
   - Modern ve şık aktivasyon penceresi
   - HWID kopyalama özelliği
   - Lisans anahtarı girişi
   - Hata mesajları ve bilgilendirme

2. **`frontend/src/App.jsx`**
   - Başlangıçta otomatik lisans kontrolü
   - Lisans yoksa aktivasyon penceresi gösterimi
   - Lisanslı kullanıcılar için normal uygulama akışı

### Dokümantasyon

- **`backend/README_LICENSE.md`** - Detaylı kullanım kılavuzu

## 🚀 Hızlı Başlangıç

### 1. Bağımlılıkları Yükle

```bash
cd backend
pip install -r requirements.txt
```

### 2. Private Key Hazırlama

**Seçenek A: Yeni Key Pair Üret (İlk Kurulum)**

```bash
cd backend
python generate_keypair.py
```

Bu komut `private_key.pem` ve `public_key.pem` dosyalarını oluşturur.

**ÖNEMLİ:** 
- `public_key.pem` içeriğini `license_manager.py` dosyasındaki `PUBLIC_KEY_PEM` değişkenine kopyalayın
- `private_key.pem` dosyasını güvenli bir yerde saklayın (Git'e eklemeyin!)

**Seçenek B: Mevcut Private Key Kullan**

Private key'inizi şu yollardan biriyle sağlayın:

```bash
# Ortam değişkeni (önerilen)
export PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# veya dosya yolu
export PRIVATE_KEY_PATH="/path/to/private_key.pem"
```

### 3. Uygulamayı Başlat

```bash
# Backend
cd backend
uvicorn main:app --reload

# Frontend (yeni terminal)
cd frontend
npm install  # İlk kez çalıştırıyorsanız
npm run dev
```

### 4. İlk Lisans Üretme

1. Uygulamayı açın
2. Aktivasyon penceresinde HWID'yi kopyalayın
3. Admin aracı ile lisans üretin:

```bash
cd backend
python admin_key_generator.py <HWID>
```

4. Üretilen lisans anahtarını uygulamaya girin
5. "Aktifleştir" butonuna tıklayın

## 📋 Sistem Özellikleri

### Güvenlik

- ✅ RSA-2048 şifreleme
- ✅ Hardware-locked (HWID bazlı)
- ✅ Offline çalışma (internet gerekmez)
- ✅ Private key kod içinde değil
- ✅ Lisans dosyası şifreli saklanır

### Platform Desteği

- ✅ Windows (WMI kullanarak)
- ✅ Linux (sysfs/udev)
- ✅ macOS (system_profiler)

### Kullanıcı Deneyimi

- ✅ Otomatik lisans kontrolü
- ✅ Modern ve şık aktivasyon arayüzü
- ✅ HWID kolay kopyalama
- ✅ Açıklayıcı hata mesajları
- ✅ Loading durumları

## 🔧 Yapılandırma

### Lisans Dosyası Konumu

- **Windows:** `%APPDATA%\.saka_qms\license.dat`
- **Linux/Mac:** `~/.saka_qms/license.dat`

### Korumalı Endpoint'ler

Aşağıdaki endpoint'ler lisans kontrolü yapar:
- `/api/upload`
- `/api/files`
- `/api/companies`

Lisans endpoint'leri (`/api/license/*`) her zaman erişilebilirdir.

## 🧪 Test Etme

1. Uygulamayı başlatın
2. HWID'yi alın: `GET /api/license/hwid`
3. Admin aracı ile lisans üretin
4. Lisansı aktifleştirin: `POST /api/license/activate`
5. Uygulamanın normal çalıştığını doğrulayın

## ⚠️ Önemli Notlar

1. **Private Key Güvenliği**
   - Private key'i asla Git'e commit etmeyin
   - Private key'i kod içine hardcode etmeyin
   - Private key'i güvenli bir yerde saklayın

2. **Public Key Güncelleme**
   - Public key değiştiğinde `license_manager.py` dosyasını güncelleyin
   - Tüm kullanıcıların yeni lisans anahtarına ihtiyacı olacak

3. **Production Deployment**
   - Kod obfuscation kullanın (PyArmor vb.)
   - Public key'in değiştirilmesini zorlaştırın

4. **HWID Değişikliği**
   - Donanım değişikliklerinde HWID değişir
   - Kullanıcıların yeni lisans anahtarına ihtiyacı olur

## 📞 Destek

Sorunlar için:
1. `backend/README_LICENSE.md` dosyasını inceleyin
2. Log dosyalarını kontrol edin
3. HWID ve lisans anahtarını doğrulayın

## 🎯 Sonraki Adımlar

1. ✅ Private key'i güvenli bir yerde saklayın
2. ✅ Public key'i `license_manager.py`'ye kopyalayın (eğer yeni key pair ürettiyseniz)
3. ✅ İlk lisansı üretin ve test edin
4. ✅ Production'da kod obfuscation kullanın
5. ✅ Lisans yönetimi için bir sistem kurun (isteğe bağlı)

---

**Sistem başarıyla kuruldu! 🎉**

