# 🚀 SAKA QMS Başlatma Kılavuzu

## 📋 Genel Bakış

**Tek bir uygulama var:**
- **Frontend** (React) - Kullanıcı arayüzü
- **Backend** (FastAPI) - API servisi

**Admin için ek araç:**
- `admin_key_generator.py` - Lisans üretme scripti (ayrı bir uygulama değil)

## 🎯 Normal Kullanım (Kullanıcı Tarafı)

### Yöntem 1: Batch Dosyası ile (Önerilen)

```bash
musteri_testi_baslat.bat
```

Bu dosya:
1. ✅ Backend'i başlatır (Port 8000)
2. ✅ Frontend'i başlatır (Port 5173)
3. ⚠️ Cloudflare Tunnel'i başlatır (opsiyonel, cloudflared yüklüyse)

**Not:** Cloudflared yüklü değilse hata vermez, sadece tunnel atlanır.

### Yöntem 2: Manuel Başlatma

#### Terminal 1 - Backend
```bash
cd backend
venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

#### Tarayıcı
```
http://localhost:5173
```

## 🔐 Admin Tarafı (Lisans Üretme)

Admin için **ayrı bir uygulama yok**. Sadece lisans üretmek için Python scripti kullanılır.

### Lisans Üretme Adımları

1. **Private Key Hazırlayın:**
   ```bash
   # Yöntem 1: Ortam değişkeni
   set PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   
   # Yöntem 2: Dosya yolu
   set PRIVATE_KEY_PATH=C:\path\to\private_key.pem
   
   # Yöntem 3: Varsayılan konum (backend/private_key.pem)
   ```

2. **Müşteriden HWID Alın:**
   - Müşteri uygulamayı açar
   - Aktivasyon penceresinde HWID görünür
   - Müşteri HWID'yi kopyalayıp size gönderir

3. **Lisans Üretin:**
   ```bash
   cd backend
   python admin_key_generator.py <HWID>
   ```

4. **Lisans Anahtarını Müşteriye Gönderin:**
   - Script'in ürettiği Base64 string'i müşteriye verin
   - Müşteri bu anahtarı uygulamaya girer

## 🌐 Müşteriye Paylaşım (Cloudflare Tunnel)

### Cloudflared Kurulumu (Opsiyonel)

1. **İndir:**
   - https://github.com/cloudflare/cloudflared/releases
   - `cloudflared-windows-amd64.exe` dosyasını indirin

2. **Kur:**
   - Dosyayı `cloudflared.exe` olarak yeniden adlandırın
   - Windows PATH'e ekleyin veya proje klasörüne koyun

3. **Kullan:**
   ```bash
   # Otomatik (batch dosyası ile)
   musteri_testi_baslat.bat
   
   # Manuel
   cloudflared tunnel --url http://localhost:5173
   ```

### Alternatif Paylaşım Yöntemleri

**1. Yerel Ağ (LAN):**
```
http://[BILGISAYAR_IP]:5173
```
- Bilgisayar IP'sini öğrenin: `ipconfig`
- Müşteri aynı ağda olmalı

**2. Port Forwarding:**
- Router'da port 5173'ü forward edin
- Müşteriye `http://[PUBLIC_IP]:5173` verin

**3. Ngrok (Alternatif):**
```bash
ngrok http 5173
```

## 📝 Özet: Nasıl Başlatılır?

### Günlük Kullanım (Kullanıcı)
```bash
# Tek komutla her şeyi başlat
musteri_testi_baslat.bat
```

### İlk Kurulum
1. Backend bağımlılıkları: `cd backend && pip install -r requirements.txt`
2. Frontend bağımlılıkları: `cd frontend && npm install`
3. Private key hazırlayın (admin için)
4. `musteri_testi_baslat.bat` çalıştırın

### Lisans Üretme (Admin)
```bash
cd backend
python admin_key_generator.py <HWID>
```

## ❓ Sık Sorulan Sorular

**S: İki ayrı uygulama mı var?**
C: Hayır, tek bir uygulama var (Frontend + Backend). Admin sadece lisans üretmek için script kullanır.

**S: Cloudflared hatası alıyorum, ne yapmalıyım?**
C: Cloudflared opsiyoneldir. Hata vermez, sadece tunnel atlanır. Müşteriye paylaşım için gerekli değil (yerel ağ veya port forwarding de kullanılabilir).

**S: Backend ve Frontend ayrı mı başlatılmalı?**
C: Evet, iki ayrı terminal/pencerede çalışır. Batch dosyası otomatik başlatır.

**S: Lisans kontrolü ne zaman yapılır?**
C: Uygulama her açıldığında otomatik kontrol edilir. Lisans yoksa aktivasyon penceresi açılır.

## 🔧 Sorun Giderme

### Backend başlamıyor
- Virtual environment aktif mi? `venv\Scripts\activate`
- Port 8000 kullanımda mı? Başka bir port deneyin: `--port 8001`

### Frontend başlamıyor
- `npm install` yapıldı mı?
- Port 5173 kullanımda mı? Vite otomatik başka port bulur

### Lisans çalışmıyor
- Private key doğru mu?
- HWID değişti mi? (donanım değişikliği)
- `backend/README_LICENSE.md` dosyasını kontrol edin

---

**Her şey hazır! Uygulamayı başlatmak için `musteri_testi_baslat.bat` dosyasını çalıştırın.** 🎉

