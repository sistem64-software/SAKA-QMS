#!/bin/bash

# Renkler (Opsiyonel görselleştirme için)
GREEN='\033[0;32m'
NC='\033[0m' # No Color

clear
echo "========================================================"
echo -e "${GREEN}          SAKA QMS - SERVISLER BASLATILIYOR${NC}"
echo "========================================================"
echo ""
echo "Bu script Backend, Frontend ve Tünel servislerini sırasıyla başlatacaktır."
echo "Lütfen açılan yeni pencereleri KAPATMAYIN."
echo ""
read -p "Devam etmek için Enter'a basın..."

echo ""
echo "1. Backend servisi başlatılıyor (Port 8000)..."
# Yeni pencerede Backend'i başlatır. 'exec bash' pencerenin kapanmasını engeller.
gnome-terminal --title="SAKA QMS Backend" -- bash -c "cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000; exec bash"

echo ""
echo "2. Frontend servisi başlatılıyor (Port 5173)..."
# Yeni pencerede Frontend'i başlatır.
gnome-terminal --title="SAKA QMS Frontend" -- bash -c "cd frontend && npm run dev; exec bash"

echo ""
echo "Frontend ve Backend'in açılması için 5 saniye bekleniyor..."
sleep 5

echo ""
echo "3. Cloudflare Tunnel (OPSIYONEL)..."
echo "Cloudflare Tunnel kullanmak için cloudflared yüklü olması gerekir."
echo ""
echo "Cloudflared yüklü mü kontrol ediliyor..."

# 'where' komutunun Linux karşılığı 'command -v' veya 'which'tir.
if command -v cloudflared &> /dev/null; then
    echo -e "${GREEN}Cloudflared bulundu! Tunnel başlatılıyor...${NC}"
    echo "Aşağıda beliren 'Try Cloudflare' linkini kopyalayıp paylaşabilirsiniz."
    echo ""
    echo "--------------------------------------------------------"
    cloudflared tunnel --url http://localhost:5173
    echo "--------------------------------------------------------"
else
    echo ""
    echo "[BILGI] Cloudflared yüklü değil. Tunnel atlandı."
    echo ""
    echo "Cloudflared yüklemek için:"
    echo "   1. https://github.com/cloudflare/cloudflared/releases adresinden indirin"
    echo "   2. cloudflared dosyasını /usr/local/bin içine atın"
    echo ""
    echo "Uygulama şu adreslerde çalışıyor:"
    echo "   - Frontend: http://localhost:5173"
    echo "   - Backend:  http://localhost:8000"
    echo ""
    echo "Müşteriye paylaşmak için:"
    echo "   - Yerel ağ: http://$(hostname -I | awk '{print $1}'):5173"
    echo "   - veya Cloudflare Tunnel kullanın"
    echo ""
fi

read -p "Çıkmak için Enter'a basın..."
