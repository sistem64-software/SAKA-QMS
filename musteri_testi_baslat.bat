@echo off
TITLE SAKA QMS - Musteri Testi Baslatici
COLOR 0A
CLS

ECHO ========================================================
ECHO          SAKA QMS - SERVISLER BASLATILIYOR
ECHO ========================================================
ECHO.
ECHO Bu script Backend, Frontend ve Tünel servislerini sirasiyla baslatacaktir.
ECHO Lutfen acilan yeni pencereleri KAPATMAYIN.
ECHO.
PAUSE

ECHO.
ECHO 1. Backend servisi baslatiliyor (Port 8000)...
start "SAKA QMS Backend" cmd /k "cd backend && uvicorn main:app --reload --port 8000"

ECHO.
ECHO 2. Frontend servisi baslatiliyor (Port 5173)...
start "SAKA QMS Frontend" cmd /k "cd frontend && npm run dev"

ECHO.
ECHO Frontend ve Backend'in acilmasi icin 5 saniye bekleniyor...
timeout /t 5 >nul

ECHO.
ECHO 3. Cloudflare Tunnel (OPSIYONEL)...
ECHO Cloudflare Tunnel kullanmak icin cloudflared yuklu olmasi gerekir.
ECHO.
ECHO Cloudflared yuklu mu kontrol ediliyor...
where cloudflared >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    ECHO Cloudflared bulundu! Tunnel baslatiliyor...
    ECHO Asagida beliren 'Try Cloudflare' linkini (https://....trycloudflare.com)
    ECHO kopyalayip musterinizle paylasabilirsiniz.
    ECHO.
    ECHO --------------------------------------------------------
    cloudflared tunnel --url http://localhost:5173
    ECHO --------------------------------------------------------
) else (
    ECHO.
    ECHO [BILGI] Cloudflared yuklu degil. Tunnel atlandi.
    ECHO.
    ECHO Cloudflared yuklemek icin:
    ECHO   1. https://github.com/cloudflare/cloudflared/releases adresinden indirin
    ECHO   2. cloudflared.exe dosyasini PATH'e ekleyin veya bu klasore koyun
    ECHO.
    ECHO Uygulama su adreslerde calisiyor:
    ECHO   - Frontend: http://localhost:5173
    ECHO   - Backend:  http://localhost:8000
    ECHO.
    ECHO Musteriye paylasmak icin:
    ECHO   - Yerel ag: http://[BILGISAYAR_IP]:5173
    ECHO   - veya Cloudflare Tunnel kullanin (cloudflared yuklu olmasi gerekir)
    ECHO.
)

PAUSE
