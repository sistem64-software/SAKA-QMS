@echo off
TITLE SAKA QMS - Musteri Yayini
COLOR 0A
CLS

ECHO ========================================================
ECHO          SAKA QMS - CLOUDFLARE TUNNEL BASLATICI
ECHO ========================================================
ECHO.
ECHO 1. Backend ve Frontend'in calistigindan emin olun.
ECHO 2. Birazdan asagida bir LINK belirecek.
ECHO 3. O linki kopyalayip musterinizle paylasin.
ECHO.
ECHO Durdurmak icin bu pencereyi kapatin.
ECHO.
ECHO --------------------------------------------------------
ECHO Tünel baslatiliyor... Lutfen bekleyin...
ECHO --------------------------------------------------------
ECHO.

cloudflared tunnel --url http://localhost:5173

PAUSE
