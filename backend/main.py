from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from api.upload import router as upload_router
from api.files import router as files_router
from api.companies import router as companies_router
from api.license import router as license_router
from license_manager import LicenseManager

app = FastAPI(title="Form Yönetim Sistemi", version="1.0.0")

# CORS yapılandırması - frontend'den gelen isteklere izin ver
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router'ları ekle
app.include_router(license_router, prefix="/api", tags=["license"])
app.include_router(upload_router, prefix="/api", tags=["upload"])
app.include_router(files_router, prefix="/api", tags=["files"])
app.include_router(companies_router, prefix="/api", tags=["companies"])

# Debug router (sorun giderme için)
from api.debug import router as debug_router
app.include_router(debug_router, prefix="/api", tags=["debug"])

# LicenseManager instance
license_manager = LicenseManager()

# Korunması gereken endpoint'ler (lisans kontrolü yapılacak)
PROTECTED_PATHS = [
    "/api/upload",
    "/api/files",
    "/api/companies"
]

@app.get("/")
async def root():
    return {"message": "Form Yönetim Sistemi API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}


# Lisans kontrolü middleware
@app.middleware("http")
async def license_check_middleware(request: Request, call_next):
    """Korumalı endpoint'ler için lisans kontrolü"""
    path = request.url.path
    
    # Lisans endpoint'leri ve health check hariç
    if path.startswith("/api/license") or path in ["/", "/health", "/docs", "/openapi.json", "/redoc"]:
        return await call_next(request)
    
    # Korumalı path'ler için lisans kontrolü
    if any(path.startswith(protected) for protected in PROTECTED_PATHS):
        if not license_manager.is_licensed():
            return JSONResponse(
                status_code=403,
                content={
                    "error": "Lisans gerekli",
                    "message": "Bu özelliği kullanmak için lisans gerekli. Lütfen lisansınızı aktifleştirin.",
                    "hwid": license_manager.get_hwid()
                }
            )
    
    return await call_next(request)
