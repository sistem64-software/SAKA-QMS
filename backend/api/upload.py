from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
import shutil
import os

router = APIRouter()

UPLOAD_DIR = Path("form_sablonlari")
UPLOAD_DIR.mkdir(exist_ok=True)

# İzin verilen dosya uzantıları
ALLOWED_EXTENSIONS = {".xlsx", ".xls", ".docx", ".doc"}

def is_allowed_file(filename: str) -> bool:
    """Dosya uzantısını kontrol et"""
    return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Şablon dosyası yükle
    Excel veya Word dosyasını form_sablonlari klasörüne kaydeder
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Dosya adı geçersiz")
    
    # Dosya uzantısını kontrol et
    if not is_allowed_file(file.filename):
        raise HTTPException(
            status_code=400, 
            detail=f"Sadece {', '.join(ALLOWED_EXTENSIONS)} dosyaları yüklenebilir"
        )
    
    # Dosya yolunu oluştur
    file_path = UPLOAD_DIR / file.filename
    
    # Aynı isimde dosya varsa üzerine yaz
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dosya yükleme hatası: {str(e)}")
    finally:
        file.file.close()
    
    return {
        "filename": file.filename,
        "path": str(file_path),
        "size": os.path.getsize(file_path),
        "message": "Dosya başarıyla yüklendi"
    }

@router.get("/templates")
async def list_templates():
    """
    form_sablonlari klasöründeki tüm dosyaları listele
    """
    try:
        files = []
        for file_path in UPLOAD_DIR.iterdir():
            if file_path.is_file() and is_allowed_file(file_path.name):
                files.append({
                    "name": file_path.name,
                    "path": str(file_path),
                    "size": os.path.getsize(file_path),
                    "extension": file_path.suffix.lower()
                })
        
        return {"files": files, "count": len(files)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dosya listeleme hatası: {str(e)}")
