# SAKA QMS - Kurulum ve Çalıştırma Talimatları

## Gereksinimler
- Python 3.8+
- Node.js 16+
- npm

## Backend Kurulumu

1. Backend klasörüne gidin:
```bash
cd backend
```

2. Python sanal ortamı oluşturun (opsiyonel ama önerilir):
```bash
python -m venv venv
.\venv\Scripts\activate  # Windows için
```

3. Bağımlılıkları yükleyin:
```bash
pip install -r requirements.txt
```

4. Backend'i başlatın:
```bash
uvicorn main:app --reload --port 8000
```

Backend http://localhost:8000 adresinde çalışacaktır.

## Frontend Kurulumu

1. Yeni bir terminal açın ve frontend klasörüne gidin:
```bash
cd frontend
```

2. Node modüllerini yükleyin:
```bash
npm install
```

3. Frontend'i başlatın:
```bash
npm run dev
```

Frontend http://localhost:5173 adresinde çalışacaktır.

## Kullanım

1. Tarayıcınızda http://localhost:5173 adresine gidin
2. Sol taraftaki "Dosya Yükle" butonuna tıklayarak Excel veya Word dosyası yükleyin
3. Yüklenen dosya sidebar'da görünecektir
4. Dosyaya tıklayarak sağ tarafta düzenleyin
5. Firma seçin veya yeni firma ekleyin
6. "Kaydet" butonuna tıklayarak dosyayı firma klasörüne kaydedin

## Klasör Yapısı

- `form_sablonlari/` - Yüklenen şablon dosyaları
- `firmalar/{firma_adi}/` - Firma bazlı kaydedilen dosyalar
