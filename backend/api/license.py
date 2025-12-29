"""
License API endpoints
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from license_manager import LicenseManager

router = APIRouter()

# LicenseManager instance
license_manager = LicenseManager()


class LicenseActivateRequest(BaseModel):
    license_key: str


class LicenseResponse(BaseModel):
    is_licensed: bool
    hwid: Optional[str] = None
    message: Optional[str] = None


@router.get("/license/status", response_model=LicenseResponse)
async def get_license_status():
    """Lisans durumunu kontrol et"""
    is_licensed = license_manager.is_licensed()
    hwid = license_manager.get_hwid() if not is_licensed else None
    
    return LicenseResponse(
        is_licensed=is_licensed,
        hwid=hwid,
        message="Lisans aktif" if is_licensed else "Lisans bulunamadı"
    )


@router.get("/license/hwid")
async def get_hwid():
    """HWID'yi döndür (aktivasyon için)"""
    import traceback
    import sys
    
    print("=" * 60)
    print("HWID İsteği Alındı")
    print("=" * 60)
    
    try:
        print("HWID üretimi başlatılıyor...")
        hwid = license_manager.get_hwid()
        
        if not hwid:
            print("HATA: HWID boş döndü!")
            raise HTTPException(status_code=500, detail="HWID üretilemedi")
        
        print(f"HWID başarıyla üretildi: {hwid[:16]}...")
        return {"hwid": hwid, "error": None}
        
    except ValueError as e:
        error_details = str(e)
        print(f"HWID ÜRETİM HATASI (ValueError): {error_details}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500, 
            detail=f"HWID alınamadı: {error_details}. Sistem donanım bilgilerini okuyamıyor. Backend loglarını kontrol edin."
        )
    except Exception as e:
        error_details = str(e)
        error_type = type(e).__name__
        print(f"HWID ÜRETİM HATASI ({error_type}): {error_details}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500, 
            detail=f"HWID alınamadı: {error_details} (Tip: {error_type}). Backend loglarını kontrol edin."
        )


@router.post("/license/activate", response_model=LicenseResponse)
async def activate_license(request: LicenseActivateRequest):
    """Lisansı aktifleştir"""
    success, message = license_manager.activate_license(request.license_key)
    
    if success:
        return LicenseResponse(
            is_licensed=True,
            message=message
        )
    else:
        raise HTTPException(status_code=400, detail=message)


@router.post("/license/verify")
async def verify_license(request: LicenseActivateRequest):
    """Lisans anahtarını doğrula (kaydetmeden)"""
    is_valid, error_msg = license_manager.verify_license(request.license_key)
    
    if is_valid:
        return {"valid": True, "message": "Lisans anahtarı geçerli"}
    else:
        raise HTTPException(status_code=400, detail=error_msg or "Lisans anahtarı geçersiz")

