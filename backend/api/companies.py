from fastapi import APIRouter, HTTPException
from pathlib import Path
from typing import List

router = APIRouter()

COMPANIES_DIR = Path("firmalar")
COMPANIES_DIR.mkdir(exist_ok=True)

@router.get("/companies")
async def list_companies():
    """
    Tüm firmaları listele
    """
    try:
        companies = []
        for company_dir in COMPANIES_DIR.iterdir():
            if company_dir.is_dir():
                # Firma klasöründeki dosya sayısını say
                file_count = len([f for f in company_dir.iterdir() if f.is_file()])
                companies.append({
                    "name": company_dir.name,
                    "file_count": file_count
                })
        
        return {"companies": companies, "count": len(companies)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Firma listeleme hatası: {str(e)}")

@router.post("/companies")
async def create_company(company_data: dict):
    """
    Yeni firma klasörü oluştur
    """
    company_name = company_data.get("name")
    
    if not company_name:
        raise HTTPException(status_code=400, detail="Firma adı gerekli")
    
    company_dir = COMPANIES_DIR / company_name
    
    if company_dir.exists():
        raise HTTPException(status_code=400, detail="Bu firma zaten mevcut")
    
    try:
        company_dir.mkdir(exist_ok=True)
        return {
            "message": "Firma başarıyla oluşturuldu",
            "name": company_name,
            "path": str(company_dir)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Firma oluşturma hatası: {str(e)}")

@router.get("/companies/{company_name}/files")
async def list_company_files(company_name: str):
    """
    Belirli bir firmaya ait dosyaları listele (alt klasörler dahil)
    """
    company_dir = COMPANIES_DIR / company_name
    
    if not company_dir.exists():
        raise HTTPException(status_code=404, detail="Firma bulunamadı")
    
    try:
        files = []
        # Firma klasörünü ve alt klasörlerini recursive olarak tara
        for file_path in company_dir.rglob('*'):
            if file_path.is_file():
                # Relative path'i al (firma klasörüne göre)
                rel_path = file_path.relative_to(company_dir)
                
                # Alt klasör varsa (iş emri no klasörü) parent klasör adını al
                subfolder = rel_path.parent.name if rel_path.parent != Path('.') else None
                
                files.append({
                    "name": file_path.name,
                    "size": file_path.stat().st_size,
                    "extension": file_path.suffix,
                    "subfolder": subfolder,  # İş emri no klasörü
                    "full_path": str(rel_path).replace('\\', '/')
                })
        
        return {"company": company_name, "files": files, "count": len(files)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dosya listeleme hatası: {str(e)}")

@router.get("/all-company-files")
async def list_all_company_files():
    """
    Tüm firmaların dosyalarını listele
    """
    try:
        all_files = []
        for company_dir in COMPANIES_DIR.iterdir():
            if company_dir.is_dir():
                company_name = company_dir.name
                for file_path in company_dir.iterdir():
                    if file_path.is_file():
                        all_files.append({
                            "name": file_path.name,
                            "size": file_path.stat().st_size,
                            "extension": file_path.suffix,
                            "company": company_name,
                            "full_path": f"{company_name}/{file_path.name}"
                        })
        
        return {"files": all_files, "count": len(all_files)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Firma dosyaları listeleme hatası: {str(e)}")

@router.delete("/companies/{company_name}")
async def delete_company(company_name: str):
    """
    Firma klasörünü ve tüm içeriğini sil
    """
    company_dir = COMPANIES_DIR / company_name
    
    if not company_dir.exists():
        raise HTTPException(status_code=404, detail="Firma bulunamadı")
    
    try:
        import shutil
        shutil.rmtree(company_dir)
        return {
            "message": "Firma başarıyla silindi",
            "company": company_name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Firma silme hatası: {str(e)}")




