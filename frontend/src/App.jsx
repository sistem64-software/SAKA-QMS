import { useState, useEffect } from 'react'
import axios from 'axios'
import Sidebar from './components/Sidebar'
import FileViewer from './components/FileViewer'
import Toast from './components/Toast'
import ConfirmDialog from './components/ConfirmDialog'

import ActivationDialog from './components/ActivationDialog'

const API_BASE = '/api'

function App() {
    const [selectedFile, setSelectedFile] = useState(null)
    const [fileContent, setFileContent] = useState(null)
    const [loading, setLoading] = useState(false)
    const [templates, setTemplates] = useState([])
    const [companies, setCompanies] = useState([])
    const [companyFiles, setCompanyFiles] = useState([])
    const [selectedCompany, setSelectedCompany] = useState(null)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [toast, setToast] = useState(null)

    const [confirmDialog, setConfirmDialog] = useState(null)
    const [isLicensed, setIsLicensed] = useState(false)
    const [isCheckingLicense, setIsCheckingLicense] = useState(true)
    const [showActivationDialog, setShowActivationDialog] = useState(false)
    const [companyName, setCompanyName] = useState(() => {
        return localStorage.getItem('companyName') || ''
    })
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

    // Toast helper function
    const showToast = (message, type = 'info') => {
        setToast({ message, type })
    }

    // Sayfa yüklendiğinde pending file varsa aç
    useEffect(() => {
        const pendingFile = sessionStorage.getItem('pendingFile')
        if (pendingFile) {
            sessionStorage.removeItem('pendingFile')
            const file = JSON.parse(pendingFile)
            // fromReload flag'ini ekle - sonsuz döngüyü önlemek için
            file.fromReload = true
            console.log('Pending file açılıyor:', file)
            // Biraz bekle ki sayfa tamamen yüklensin
            setTimeout(() => {
                handleFileSelect(file)
            }, 500)
        }
    }, [])



    // Şablonları yükle
    const loadTemplates = async () => {
        try {
            const response = await axios.get(`${API_BASE}/templates`)
            setTemplates(response.data.files || [])
        } catch (error) {
            console.error('Şablonlar yüklenirken hata:', error)
        }
    }

    // Firmaları yükle
    const loadCompanies = async () => {
        try {
            const response = await axios.get(`${API_BASE}/companies`)
            setCompanies(response.data.companies || [])
        } catch (error) {
            console.error('Firmalar yüklenirken hata:', error)
        }
    }

    // Firma dosyalarını yükle
    const loadCompanyFiles = async (companyName) => {
        if (!companyName) {
            setCompanyFiles([])
            return
        }

        try {
            const response = await axios.get(`${API_BASE}/companies/${companyName}/files`)
            setCompanyFiles(response.data.files || [])
        } catch (error) {
            console.error('Firma dosyaları yüklenirken hata:', error)
            setCompanyFiles([])
        }
    }

    // Firma seçildiğinde
    const handleCompanySelect = (companyName) => {
        setSelectedCompany(companyName)
        loadCompanyFiles(companyName)
    }

    // Firma silindiğinde
    const handleCompanyDelete = async (companyName) => {
        setConfirmDialog({
            title: 'Firmayı Sil',
            message: `"${companyName}" firmasını ve içindeki TÜM dosyaları silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz.`,
            type: 'danger',
            onConfirm: async () => {
                setConfirmDialog(null)

                try {
                    await axios.delete(`${API_BASE}/companies/${companyName}`)

                    // Silinen firma seçili firma ise seçimi temizle
                    if (selectedCompany === companyName) {
                        setSelectedCompany(null)
                        setCompanyFiles([])
                    }

                    // Firma listesini güncelle
                    loadCompanies()

                    showToast('Firma başarıyla silindi!', 'success')
                } catch (error) {
                    console.error('Firma silme hatası:', error)
                    showToast('Firma silinirken bir hata oluştu: ' + (error.response?.data?.detail || error.message), 'error')
                }
            },
            onCancel: () => {
                setConfirmDialog(null)
            }
        })
    }

    // Sidebar toggle
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen)
    }

    // Lisans kontrolü
    const checkLicense = async () => {
        setIsCheckingLicense(true)
        try {
            const response = await axios.get(`${API_BASE}/license/status`)
            if (response.data.is_licensed) {
                setIsLicensed(true)
                setShowActivationDialog(false)
            } else {
                setIsLicensed(false)
                setShowActivationDialog(true)
            }
        } catch (error) {
            console.error('Lisans kontrolü hatası:', error)
            // Hata durumunda da aktivasyon penceresini göster
            setIsLicensed(false)
            setShowActivationDialog(true)
        } finally {
            setIsCheckingLicense(false)
        }
    }

    // Lisans aktifleştirildiğinde
    const handleLicenseActivated = (newCompanyName) => {
        if (newCompanyName) {
            setCompanyName(newCompanyName)
            localStorage.setItem('companyName', newCompanyName)
        }
        setIsLicensed(true)
        setShowActivationDialog(false)
        showToast('Lisans başarıyla aktifleştirildi!', 'success')
    }

    // İlk yükleme - lisans kontrolü
    useEffect(() => {
        checkLicense()
    }, [])

    // Lisanslı ise normal uygulamayı yükle
    useEffect(() => {
        if (isLicensed && !isCheckingLicense) {
            loadTemplates()
            loadCompanies()
        }
    }, [isLicensed, isCheckingLicense])

    // Title'ı dinamik olarak güncelle
    useEffect(() => {
        if (companyName) {
            document.title = `${companyName} - Form Yönetim Sistemi`
        } else {
            document.title = 'SAKA QMS - Form Yönetim Sistemi'
        }
    }, [companyName])

    // Sayfa kapatılırken veya yenilenirken uyarı ver
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault()
                e.returnValue = ''
                return ''
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [hasUnsavedChanges])

    // Dosya seçildiğinde içeriği yükle
    const handleFileSelect = async (file) => {
        // Eğer kaydedilmemiş değişiklik varsa onay iste
        if (hasUnsavedChanges) {
            setConfirmDialog({
                title: 'Kaydedilmemiş Değişiklikler',
                message: 'Dosyada kaydedilmemiş değişiklikler var. Başka bir dosyaya geçerseniz bu değişiklikler kaybolacak.\n\nDevam etmek istiyor musunuz?',
                type: 'warning',
                onConfirm: async () => {
                    setConfirmDialog(null)
                    setHasUnsavedChanges(false)
                    // Onaylandıktan sonra dosyayı yükle
                    await loadFile(file)
                },
                onCancel: () => {
                    setConfirmDialog(null)
                    // Seçimi iptal et (Sidebar'da seçili kalanı eski haline getirmek zor olabilir ama en azından işlem yapılmaz)
                }
            })
            return
        }

        await loadFile(file)
    }

    const loadFile = async (file) => {
        console.log('Dosya seçildi:', file)

        // Word dosyası seçildiyse sayfayı yenile (temiz state için)
        // Ama reload'dan geliyorsa yenileme - sonsuz döngü olmasın
        if (file.name.endsWith('.docx') && !file.fromReload) {
            console.log('Word dosyası açılıyor - sayfa yenileniyor...')
            // Yeni dosya bilgisini sessionStorage'a kaydet
            sessionStorage.setItem('pendingFile', JSON.stringify(file))
            window.location.reload()
            return
        }

        setSelectedFile(file)
        setLoading(true)

        try {
            let response
            // Firma dosyası mı yoksa şablon dosyası mı kontrol et
            if (file.company) {
                // Firma dosyası
                const url = `${API_BASE}/companies/${file.company}/file/${file.name}`
                console.log('Firma dosyası URL:', url)
                response = await axios.get(url)
            } else {
                // Şablon dosyası
                const url = `${API_BASE}/file/${file.name}`
                console.log('Şablon dosyası URL:', url)
                response = await axios.get(url)
            }
            console.log('Dosya response:', response.data)
            setFileContent(response.data)
            // Yeni dosya yüklendiğinde değişiklik takibini sıfırla
            setHasUnsavedChanges(false)
        } catch (error) {
            console.error('Dosya yüklenirken hata:', error)
            console.error('Error response:', error.response)
            showToast('Dosya yüklenirken bir hata oluştu', 'error')
        } finally {
            setLoading(false)
        }
    }

    // Dosya yüklendiğinde listeyi güncelle
    const handleFileUploaded = () => {
        loadTemplates()
    }

    // Dosya kaydedildiğinde
    const handleFileSaved = () => {
        loadCompanies()
        if (selectedCompany) {
            loadCompanyFiles(selectedCompany)
        }
        showToast('Dosya başarıyla kaydedildi!', 'success')
        setHasUnsavedChanges(false)
    }

    // Dosya silindiğinde
    const handleFileDelete = async (file) => {
        setConfirmDialog({
            title: 'Dosyayı Sil',
            message: `"${file.name}" dosyasını silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz.`,
            type: 'danger',
            onConfirm: async () => {
                setConfirmDialog(null)

                try {
                    // Firma dosyası mı yoksa şablon dosyası mı kontrol et
                    if (file.company) {
                        // Firma dosyası
                        await axios.delete(`${API_BASE}/companies/${file.company}/file/${file.name}`)
                    } else {
                        // Şablon dosyası
                        await axios.delete(`${API_BASE}/file/${file.name}`)
                    }

                    // Silinen dosya seçili dosya ise seçimi temizle
                    if (selectedFile?.name === file.name) {
                        setSelectedFile(null)
                        setFileContent(null)
                    }

                    // Listeleri güncelle
                    if (file.company) {
                        loadCompanyFiles(file.company)
                    } else {
                        loadTemplates()
                    }

                    showToast('Dosya başarıyla silindi!', 'success')
                } catch (error) {
                    console.error('Dosya silme hatası:', error)
                    showToast('Dosya silinirken bir hata oluştu: ' + (error.response?.data?.detail || error.message), 'error')
                }
            },
            onCancel: () => {
                setConfirmDialog(null)
            }
        })
    }

    // Lisans kontrolü yapılıyorsa loading göster
    if (isCheckingLicense) {
        return (
            <div className="flex h-screen bg-dark-900 items-center justify-center">
                <div className="text-center">
                    <svg
                        className="animate-spin h-12 w-12 text-primary-400 mx-auto mb-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                    <p className="text-gray-400">Lisans kontrol ediliyor...</p>
                </div>
            </div>
        )
    }

    // Lisans yoksa sadece aktivasyon penceresini göster
    if (!isLicensed) {
        return (
            <>
                <div className="flex h-screen bg-dark-900 items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-primary-400 mb-2">
                            SAKA QMS
                        </h1>
                        <p className="text-gray-400">
                            Lisans aktivasyonu gerekli
                        </p>
                    </div>
                </div>
                <ActivationDialog
                    isOpen={showActivationDialog}
                    onActivated={handleLicenseActivated}
                />
            </>
        )
    }

    return (
        <div className="flex h-screen bg-dark-900 overflow-hidden relative">
            {/* Hamburger Menu Button */}
            <button
                onClick={toggleSidebar}
                className="fixed top-4 left-4 z-50 p-2 bg-dark-800 border border-dark-700 rounded-lg hover:bg-dark-700 hover:border-dark-600 transition-all duration-200 active:scale-95 shadow-lg"
                aria-label="Toggle Sidebar"
            >
                <div className="w-6 h-5 flex flex-col justify-between">
                    <span className={`block h-0.5 bg-primary-400 rounded-full transition-all duration-300 ${isSidebarOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                    <span className={`block h-0.5 bg-primary-400 rounded-full transition-all duration-300 ${isSidebarOpen ? 'opacity-0' : ''}`}></span>
                    <span className={`block h-0.5 bg-primary-400 rounded-full transition-all duration-300 ${isSidebarOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
                </div>
            </button>

            {/* Sidebar */}
            <Sidebar
                templates={templates}
                companies={companies}
                companyFiles={companyFiles}
                selectedCompany={selectedCompany}
                onCompanySelect={handleCompanySelect}
                onCompanyDelete={handleCompanyDelete}
                onFileSelect={handleFileSelect}
                onFileUploaded={handleFileUploaded}
                onFileDelete={handleFileDelete}
                onFileRename={() => {
                    loadTemplates()
                    if (selectedCompany) loadCompanyFiles(selectedCompany)
                }}
                onError={(msg) => showToast(msg, 'error')}
                onSuccess={(msg) => showToast(msg, 'success')}
                selectedFile={selectedFile}
                isOpen={isSidebarOpen}
                companyName={companyName}
            />

            {/* Main Content Area */}
            <main className={`flex-1 overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'ml-80' : 'ml-0'
                }`}>
                <FileViewer
                    fileContent={fileContent}
                    loading={loading}
                    companies={companies}
                    selectedFile={selectedFile}
                    onFileSaved={handleFileSaved}
                    onCompanyAdded={loadCompanies}
                    onUnsavedChanges={setHasUnsavedChanges}
                />
            </main>

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Confirm Dialog */}
            {confirmDialog && (
                <ConfirmDialog
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    type={confirmDialog.type}
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={confirmDialog.onCancel}
                />
            )}



            {/* Activation Dialog - Her zaman hazır (lisans kontrolü için) */}
            <ActivationDialog
                isOpen={showActivationDialog}
                onActivated={handleLicenseActivated}
            />
        </div>
    )
}

export default App
