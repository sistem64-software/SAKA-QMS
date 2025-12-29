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

@router.get("/search")
async def search_files(query: str = None):
    """
    Tek arama kutusu ile firma adı, iş emir numarası, parça numarası ve/veya parça adına göre dosya ara
    Query parametresi tüm alanlarda aranır (OR mantığı)
    """
    if not query:
        raise HTTPException(status_code=400, detail="Arama terimi gerekli")
    
    try:
        import openpyxl
        from concurrent.futures import ThreadPoolExecutor, as_completed
        results = []
        
        query_lower = query.lower().strip()
        
        def check_query_in_file(file_path, search_query):
            """Helper function to check if query exists in Excel file"""
            try:
                wb = openpyxl.load_workbook(file_path, data_only=True, read_only=True)
                for sheet in wb.worksheets:
                    for row in sheet.iter_rows(values_only=True):
                        for cell_value in row:
                            if cell_value:
                                cell_str = str(cell_value).strip()
                                if search_query in cell_str.lower():
                                    wb.close()
                                    return True
                wb.close()
            except Exception as e:
                print(f"[ERROR] Could not read file {file_path.name}: {str(e)}")
            return False
        
        # Tüm firma klasörlerini tara
        for company_dir in COMPANIES_DIR.iterdir():
            if not company_dir.is_dir():
                continue
            
            current_company_name = company_dir.name
            
            # Firma adı kontrolü (case-insensitive)
            company_matches = query_lower in current_company_name.lower()
            
            # Bu firmadaki tüm dosyaları recursive olarak tara
            files_to_check = []
            for file_path in company_dir.rglob('*'):
                if not file_path.is_file():
                    continue
                
                # Relative path'i al (firma klasörüne göre)
                rel_path = file_path.relative_to(company_dir)
                
                # Alt klasör varsa (iş emri no klasörü) parent klasör adını al
                subfolder = rel_path.parent.name if rel_path.parent != Path('.') else None
                
                # İş emir no kontrolü
                work_order_matches = subfolder and query_lower in subfolder.lower()
                
                # Firma adı veya iş emir no eşleşiyorsa direkt ekle
                if company_matches or work_order_matches:
                    results.append({
                        "name": file_path.name,
                        "size": file_path.stat().st_size,
                        "extension": file_path.suffix,
                        "company": current_company_name,
                        "subfolder": subfolder,
                        "full_path": str(rel_path).replace('\\', '/')
                    })
                else:
                    # Firma adı ve iş emir no eşleşmedi, Excel içeriğine bakmalıyız
                    # Sadece Excel dosyalarını kontrol et
                    if file_path.suffix.lower() in ['.xlsx', '.xls']:
                        files_to_check.append((file_path, subfolder, current_company_name, rel_path))
            
            # Excel içerik araması varsa, paralel olarak dosyaları kontrol et
            if files_to_check:
                print(f"[INFO] Checking {len(files_to_check)} Excel files for query: '{query}'")
                
                # Maksimum 50 dosya tara (performans için)
                files_to_check = files_to_check[:50]
                
                with ThreadPoolExecutor(max_workers=4) as executor:
                    future_to_file = {
                        executor.submit(check_query_in_file, file_path, query_lower): (file_path, subfolder, company, rel_path)
                        for file_path, subfolder, company, rel_path in files_to_check
                    }
                    
                    for future in as_completed(future_to_file):
                        file_path, subfolder, company, rel_path = future_to_file[future]
                        try:
                            if future.result():
                                print(f"[DEBUG] Query found in: {file_path.name}")
                                results.append({
                                    "name": file_path.name,
                                    "size": file_path.stat().st_size,
                                    "extension": file_path.suffix,
                                    "company": company,
                                    "subfolder": subfolder,
                                    "full_path": str(rel_path).replace('\\', '/')
                                })
                        except Exception as e:
                            print(f"[ERROR] Error processing {file_path.name}: {str(e)}")
        
        print(f"[INFO] Search completed. Found {len(results)} results.")
        
        return {
            "results": results,
            "count": len(results),
            "search_criteria": {
                "query": query
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Arama hatası: {str(e)}")


