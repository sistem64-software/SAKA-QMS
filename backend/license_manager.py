"""
License Manager - Offline Hardware-Locked Licensing System
HWID üretimi ve RSA tabanlı lisans doğrulama sistemi
"""

import hashlib
import base64
import json
import os
import platform
import uuid
from pathlib import Path
from typing import Optional, Tuple
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.hazmat.backends import default_backend
import subprocess
import re

# Gömülü Public Key
PUBLIC_KEY_PEM = """-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtocry6N7vXNYDGOwyTnp
hKnQ7vreWgE1DdRXNq33fEq/bfaesLctPblp2k4ynko0aFY2ZzJ87NjQ68IeU8rM
bNP51044d1ijUu/UOH7rNCn98Hd7HvNOxHGgd6ooiCYa6UCkEACJ1rxljj+WuJw1
wa4+YqsBpkERwrL/N/y/NYrj7nruerI5eX7poVUhPSq04DTQiy1Sir0HS7whwuFG
brbxxA3IXMFu5eY4o81EYXyE7ZCnZD+C0o2pUfcTMoYG2wBxBkfs4xm6RlPzUOeL
4VdWVfjZyFKLHg+C0k7Wf4PNLLwsSYocQQQLDNy4j2pD2L5tcjjytr04YHRymvj9
oQIDAQAB
-----END PUBLIC KEY-----"""


class LicenseManager:
    """Hardware-locked lisans yönetim sistemi"""
    
    def __init__(self, license_file: Optional[str] = None):
        """
        LicenseManager'ı başlat
        
        Args:
            license_file: Lisans dosyasının yolu. None ise varsayılan konum kullanılır.
        """
        if license_file is None:
            # Varsayılan lisans dosyası konumu (kullanıcı dizininde gizli)
            if platform.system() == "Windows":
                app_data = os.getenv("APPDATA", os.path.expanduser("~"))
                license_dir = Path(app_data) / ".saka_qms"
                license_dir.mkdir(exist_ok=True)
                license_file = str(license_dir / "license.dat")
            else:
                license_file = str(Path.home() / ".saka_qms" / "license.dat")
        
        self.license_file = license_file
        self.public_key = self._load_public_key()
    
    def _load_public_key(self):
        """Public key'i yükle"""
        try:
            return serialization.load_pem_public_key(
                PUBLIC_KEY_PEM.encode(),
                backend=default_backend()
            )
        except Exception as e:
            raise ValueError(f"Public key yüklenemedi: {e}")
    
    def get_hwid(self) -> str:
        """
        Sistemin Hardware ID'sini üret
        
        Returns:
            SHA-256 hash'lenmiş HWID string
        """
        print(f"\n[DEBUG] HWID üretimi başlatıldı - Platform: {platform.system()}")
        hw_components = []
        
        try:
            # CPU Serial Number
            print("[DEBUG] CPU Serial okunuyor...")
            cpu_serial = self._get_cpu_serial()
            print(f"[DEBUG] CPU Serial: {cpu_serial}")
            hw_components.append(cpu_serial)
        except Exception as e:
            print(f"[HATA] CPU Serial okunamadı: {type(e).__name__}: {e}")
            hw_components.append("UNKNOWN_CPU")
        
        try:
            # Motherboard Serial Number
            print("[DEBUG] Motherboard Serial okunuyor...")
            mb_serial = self._get_motherboard_serial()
            print(f"[DEBUG] Motherboard Serial: {mb_serial}")
            hw_components.append(mb_serial)
        except Exception as e:
            print(f"[HATA] Motherboard Serial okunamadı: {type(e).__name__}: {e}")
            hw_components.append("UNKNOWN_MB")
        
        try:
            # Disk Serial Number
            print("[DEBUG] Disk Serial okunuyor...")
            disk_serial = self._get_disk_serial()
            print(f"[DEBUG] Disk Serial: {disk_serial}")
            hw_components.append(disk_serial)
        except Exception as e:
            print(f"[HATA] Disk Serial okunamadı: {type(e).__name__}: {e}")
            hw_components.append("UNKNOWN_DISK")
        
        # Fallback: MAC Address ve Hostname ekle (daha güvenilir HWID için)
        try:
            print("[DEBUG] MAC Address okunuyor...")
            mac_address = self._get_mac_address()
            print(f"[DEBUG] MAC Address: {mac_address}")
            hw_components.append(mac_address)
        except Exception as e:
            print(f"[HATA] MAC Address okunamadı: {type(e).__name__}: {e}")
            hw_components.append("UNKNOWN_MAC")
        
        try:
            print("[DEBUG] Hostname okunuyor...")
            hostname = platform.node()
            print(f"[DEBUG] Hostname: {hostname}")
            hw_components.append(hostname)
        except Exception as e:
            print(f"[HATA] Hostname okunamadı: {type(e).__name__}: {e}")
            hw_components.append("UNKNOWN_HOST")
        
        # Tüm bileşenleri birleştir ve hash'le
        hw_string = "|".join(hw_components)
        print(f"[DEBUG] HW String: {hw_string[:100]}...")  # İlk 100 karakter
        hwid = hashlib.sha256(hw_string.encode()).hexdigest()
        print(f"[DEBUG] HWID üretildi: {hwid[:16]}...")
        
        # En az bir bileşen "UNKNOWN" değilse HWID geçerli sayılır
        # İlk 3 bileşen (CPU, MB, Disk) kontrolü
        unknown_count = sum(1 for comp in hw_components[:3] if "UNKNOWN" in comp)
        print(f"[DEBUG] UNKNOWN bileşen sayısı (ilk 3): {unknown_count}/3")
        
        if unknown_count == 3:
            error_msg = f"Yeterli donanım bilgisi alınamadı. Tüm donanım bileşenleri UNKNOWN. Bileşenler: {hw_components}"
            print(f"[HATA] {error_msg}")
            raise ValueError(error_msg)
        
        print(f"[DEBUG] HWID başarıyla üretildi!")
        return hwid
    
    def _get_mac_address(self) -> str:
        """MAC Address'i al (fallback için)"""
        try:
            mac = ':'.join(['{:02x}'.format((uuid.getnode() >> elements) & 0xff) 
                           for elements in range(0,2*6,2)][::-1])
            return mac
        except Exception:
            return "UNKNOWN_MAC"
    
    def _get_cpu_serial(self) -> str:
        """CPU Serial Number'ı al"""
        system = platform.system()
        
        if system == "Windows":
            # Yöntem 1: wmic cpu get ProcessorId
            try:
                result = subprocess.run(
                    ['wmic', 'cpu', 'get', 'ProcessorId'],
                    capture_output=True,
                    text=True,
                    timeout=10,
                    creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0
                )
                if result.returncode == 0 and result.stdout:
                    lines = [line.strip() for line in result.stdout.strip().split('\n') if line.strip()]
                    for line in lines[1:]:  # İlk satır başlık
                        if line and line.upper() != 'PROCESSORID':
                            return line
            except Exception as e:
                print(f"WMI CPU yöntemi 1 başarısız: {e}")
            
            # Yöntem 2: wmic path win32_processor get ProcessorId
            try:
                result = subprocess.run(
                    ['wmic', 'path', 'win32_processor', 'get', 'ProcessorId'],
                    capture_output=True,
                    text=True,
                    timeout=10,
                    creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0
                )
                if result.returncode == 0 and result.stdout:
                    lines = [line.strip() for line in result.stdout.strip().split('\n') if line.strip()]
                    for line in lines[1:]:
                        if line and line.upper() != 'PROCESSORID':
                            return line
            except Exception as e:
                print(f"WMI CPU yöntemi 2 başarısız: {e}")
            
            # Yöntem 3: PowerShell ile
            try:
                ps_cmd = 'Get-WmiObject Win32_Processor | Select-Object -ExpandProperty ProcessorId'
                result = subprocess.run(
                    ['powershell', '-Command', ps_cmd],
                    capture_output=True,
                    text=True,
                    timeout=10,
                    creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0
                )
                if result.returncode == 0 and result.stdout.strip():
                    cpu_id = result.stdout.strip()
                    if cpu_id:
                        return cpu_id
            except Exception as e:
                print(f"PowerShell CPU yöntemi başarısız: {e}")
        
        elif system == "Linux":
            try:
                result = subprocess.run(
                    ['cat', '/proc/cpuinfo'],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                if result.returncode == 0:
                    # CPU ID veya serial number bul
                    for line in result.stdout.split('\n'):
                        if 'Serial' in line or 'serial' in line:
                            parts = line.split(':')
                            if len(parts) > 1:
                                return parts[1].strip()
            except Exception:
                pass
        
        elif system == "Darwin":  # macOS
            try:
                result = subprocess.run(
                    ['sysctl', '-n', 'machdep.cpu.brand_string'],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                if result.returncode == 0:
                    return result.stdout.strip()
            except Exception:
                pass
        
        return "UNKNOWN_CPU"
    
    def _get_motherboard_serial(self) -> str:
        """Motherboard Serial Number'ı al"""
        system = platform.system()
        
        if system == "Windows":
            # Yöntem 1: wmic baseboard get SerialNumber
            try:
                result = subprocess.run(
                    ['wmic', 'baseboard', 'get', 'SerialNumber'],
                    capture_output=True,
                    text=True,
                    timeout=10,
                    creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0
                )
                if result.returncode == 0 and result.stdout:
                    lines = [line.strip() for line in result.stdout.strip().split('\n') if line.strip()]
                    for line in lines[1:]:
                        if line and line.upper() != 'SERIALNUMBER' and line != "To be filled by O.E.M.":
                            return line
            except Exception as e:
                print(f"WMI MB yöntemi 1 başarısız: {e}")
            
            # Yöntem 2: wmic path win32_baseboard get SerialNumber
            try:
                result = subprocess.run(
                    ['wmic', 'path', 'win32_baseboard', 'get', 'SerialNumber'],
                    capture_output=True,
                    text=True,
                    timeout=10,
                    creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0
                )
                if result.returncode == 0 and result.stdout:
                    lines = [line.strip() for line in result.stdout.strip().split('\n') if line.strip()]
                    for line in lines[1:]:
                        if line and line.upper() != 'SERIALNUMBER' and line != "To be filled by O.E.M.":
                            return line
            except Exception as e:
                print(f"WMI MB yöntemi 2 başarısız: {e}")
            
            # Yöntem 3: PowerShell ile
            try:
                ps_cmd = 'Get-WmiObject Win32_BaseBoard | Select-Object -ExpandProperty SerialNumber'
                result = subprocess.run(
                    ['powershell', '-Command', ps_cmd],
                    capture_output=True,
                    text=True,
                    timeout=10,
                    creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0
                )
                if result.returncode == 0 and result.stdout.strip():
                    mb_serial = result.stdout.strip()
                    if mb_serial and mb_serial != "To be filled by O.E.M.":
                        return mb_serial
            except Exception as e:
                print(f"PowerShell MB yöntemi başarısız: {e}")
        
        elif system == "Linux":
            try:
                result = subprocess.run(
                    ['cat', '/sys/class/dmi/id/board_serial'],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                if result.returncode == 0:
                    serial = result.stdout.strip()
                    if serial:
                        return serial
            except Exception:
                pass
        
        elif system == "Darwin":  # macOS
            try:
                result = subprocess.run(
                    ['system_profiler', 'SPHardwareDataType'],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                if result.returncode == 0:
                    # Serial Number satırını bul
                    for line in result.stdout.split('\n'):
                        if 'Serial Number' in line:
                            parts = line.split(':')
                            if len(parts) > 1:
                                return parts[1].strip()
            except Exception:
                pass
        
        return "UNKNOWN_MB"
    
    def _get_disk_serial(self) -> str:
        """Disk Serial Number'ı al (ilk disk)"""
        system = platform.system()
        
        if system == "Windows":
            # Yöntem 1: wmic diskdrive get SerialNumber
            try:
                result = subprocess.run(
                    ['wmic', 'diskdrive', 'get', 'SerialNumber'],
                    capture_output=True,
                    text=True,
                    timeout=10,
                    creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0
                )
                if result.returncode == 0 and result.stdout:
                    lines = [line.strip() for line in result.stdout.strip().split('\n') if line.strip()]
                    for line in lines[1:]:
                        if line and line.upper() != 'SERIALNUMBER':
                            return line
            except Exception as e:
                print(f"WMI Disk yöntemi 1 başarısız: {e}")
            
            # Yöntem 2: wmic path win32_diskdrive get SerialNumber
            try:
                result = subprocess.run(
                    ['wmic', 'path', 'win32_diskdrive', 'get', 'SerialNumber'],
                    capture_output=True,
                    text=True,
                    timeout=10,
                    creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0
                )
                if result.returncode == 0 and result.stdout:
                    lines = [line.strip() for line in result.stdout.strip().split('\n') if line.strip()]
                    for line in lines[1:]:
                        if line and line.upper() != 'SERIALNUMBER':
                            return line
            except Exception as e:
                print(f"WMI Disk yöntemi 2 başarısız: {e}")
            
            # Yöntem 3: PowerShell ile
            try:
                ps_cmd = 'Get-WmiObject Win32_DiskDrive | Select-Object -First 1 -ExpandProperty SerialNumber'
                result = subprocess.run(
                    ['powershell', '-Command', ps_cmd],
                    capture_output=True,
                    text=True,
                    timeout=10,
                    creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0
                )
                if result.returncode == 0 and result.stdout.strip():
                    disk_serial = result.stdout.strip()
                    if disk_serial:
                        return disk_serial
            except Exception as e:
                print(f"PowerShell Disk yöntemi başarısız: {e}")
        
        elif system == "Linux":
            try:
                # /dev/sda için serial number
                result = subprocess.run(
                    ['udevadm', 'info', '--query=property', '--name=/dev/sda'],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                if result.returncode == 0:
                    for line in result.stdout.split('\n'):
                        if 'ID_SERIAL=' in line:
                            return line.split('=')[1].strip()
            except Exception:
                pass
        
        elif system == "Darwin":  # macOS
            try:
                result = subprocess.run(
                    ['system_profiler', 'SPStorageDataType'],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                if result.returncode == 0:
                    # Serial Number bul
                    for line in result.stdout.split('\n'):
                        if 'Serial Number' in line:
                            parts = line.split(':')
                            if len(parts) > 1:
                                return parts[1].strip()
            except Exception:
                pass
        
        return "UNKNOWN_DISK"
    
    def verify_license(self, license_key: str) -> Tuple[bool, Optional[str]]:
        """
        Lisans anahtarını doğrula
        
        Args:
            license_key: Base64 encoded lisans anahtarı
            
        Returns:
            (is_valid, error_message) tuple
        """
        try:
            # Base64 decode
            signature_bytes = base64.b64decode(license_key)
            
            # Mevcut HWID'yi al
            current_hwid = self.get_hwid()
            
            # RSA doğrulama
            try:
                self.public_key.verify(
                    signature_bytes,
                    current_hwid.encode(),
                    padding.PKCS1v15(),
                    hashes.SHA256()
                )
                return True, None
            except Exception as e:
                return False, f"Lisans doğrulama hatası: {str(e)}"
        
        except Exception as e:
            return False, f"Lisans anahtarı geçersiz: {str(e)}"
    
    def save_license(self, license_key: str) -> bool:
        """
        Lisansı yerel dosyaya kaydet (şifreli)
        
        Args:
            license_key: Base64 encoded lisans anahtarı
            
        Returns:
            Başarılı ise True
        """
        try:
            # Lisans dosyası dizinini oluştur
            license_path = Path(self.license_file)
            license_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Basit obfuscation (Base64 encode)
            # Not: Gerçek bir uygulamada daha güçlü şifreleme kullanılmalı
            obfuscated = base64.b64encode(license_key.encode()).decode()
            
            # Dosyaya kaydet
            with open(license_path, 'w') as f:
                json.dump({
                    'key': obfuscated,
                    'hwid': self.get_hwid()  # Doğrulama için sakla
                }, f)
            
            return True
        except Exception as e:
            print(f"Lisans kaydedilemedi: {e}")
            return False
    
    def load_license(self) -> Optional[str]:
        """
        Kaydedilmiş lisansı yükle
        
        Returns:
            Lisans anahtarı veya None
        """
        try:
            license_path = Path(self.license_file)
            if not license_path.exists():
                return None
            
            with open(license_path, 'r') as f:
                data = json.load(f)
                obfuscated = data.get('key')
                if obfuscated:
                    # Deobfuscate
                    license_key = base64.b64decode(obfuscated.encode()).decode()
                    return license_key
        except Exception as e:
            print(f"Lisans yüklenemedi: {e}")
        
        return None
    
    def is_licensed(self) -> bool:
        """
        Sistemin lisanslı olup olmadığını kontrol et
        
        Returns:
            Lisanslı ise True
        """
        license_key = self.load_license()
        if not license_key:
            return False
        
        is_valid, _ = self.verify_license(license_key)
        return is_valid
    
    def activate_license(self, license_key: str) -> Tuple[bool, str]:
        """
        Lisansı aktifleştir ve kaydet
        
        Args:
            license_key: Base64 encoded lisans anahtarı
            
        Returns:
            (success, message) tuple
        """
        # Doğrula
        is_valid, error_msg = self.verify_license(license_key)
        if not is_valid:
            return False, error_msg or "Lisans anahtarı geçersiz"
        
        # Kaydet
        if self.save_license(license_key):
            return True, "Lisans başarıyla aktifleştirildi"
        else:
            return False, "Lisans kaydedilemedi"

