"""
Debug endpoints - Sorun giderme için
"""

from fastapi import APIRouter
from license_manager import LicenseManager
import platform
import subprocess

router = APIRouter()

license_manager = LicenseManager()


@router.get("/debug/system-info")
async def get_system_info():
    """Sistem bilgilerini döndür"""
    info = {
        "platform": platform.system(),
        "platform_version": platform.version(),
        "platform_release": platform.release(),
        "architecture": platform.machine(),
        "processor": platform.processor(),
        "hostname": platform.node(),
    }
    return info


@router.get("/debug/hwid-details")
async def get_hwid_details():
    """HWID üretim detaylarını döndür"""
    try:
        hwid = license_manager.get_hwid()
        return {
            "success": True,
            "hwid": hwid,
            "hwid_short": hwid[:16] + "..." if hwid else None
        }
    except Exception as e:
        import traceback
        return {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": traceback.format_exc()
        }


@router.get("/debug/test-wmi")
async def test_wmi():
    """WMI komutlarını test et"""
    results = {}
    system = platform.system()
    
    if system == "Windows":
        # Test CPU
        try:
            result = subprocess.run(
                ['wmic', 'cpu', 'get', 'ProcessorId'],
                capture_output=True,
                text=True,
                timeout=10,
                creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0
            )
            results['cpu_wmic'] = {
                "success": result.returncode == 0,
                "returncode": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr
            }
        except Exception as e:
            results['cpu_wmic'] = {
                "success": False,
                "error": str(e),
                "error_type": type(e).__name__
            }
        
        # Test Motherboard
        try:
            result = subprocess.run(
                ['wmic', 'baseboard', 'get', 'SerialNumber'],
                capture_output=True,
                text=True,
                timeout=10,
                creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0
            )
            results['mb_wmic'] = {
                "success": result.returncode == 0,
                "returncode": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr
            }
        except Exception as e:
            results['mb_wmic'] = {
                "success": False,
                "error": str(e),
                "error_type": type(e).__name__
            }
        
        # Test Disk
        try:
            result = subprocess.run(
                ['wmic', 'diskdrive', 'get', 'SerialNumber'],
                capture_output=True,
                text=True,
                timeout=10,
                creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0
            )
            results['disk_wmic'] = {
                "success": result.returncode == 0,
                "returncode": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr
            }
        except Exception as e:
            results['disk_wmic'] = {
                "success": False,
                "error": str(e),
                "error_type": type(e).__name__
            }
    
    return {
        "system": system,
        "tests": results
    }

