import { useState, useEffect } from 'react'
import axios from 'axios'
import ConfirmDialog from './ConfirmDialog'

const API_BASE = '/api'

function ActivationDialog({ isOpen, onActivated }) {
    const [hwid, setHwid] = useState('')
    const [licenseKey, setLicenseKey] = useState('')
    const [companyName, setCompanyName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [copySuccess, setCopySuccess] = useState(false)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)

    useEffect(() => {
        if (isOpen) {
            loadHwid()
        }
    }, [isOpen])

    const loadHwid = async () => {
        setError('')
        console.log('[DEBUG] HWID yükleniyor...')
        console.log('[DEBUG] API Base:', API_BASE)
        
        try {
            const url = `${API_BASE}/license/hwid`
            console.log('[DEBUG] İstek URL:', url)
            console.log('[DEBUG] İstek gönderiliyor...')
            
            const response = await axios.get(url, {
                timeout: 30000, // 30 saniye timeout
                validateStatus: function (status) {
                    return status < 500; // 500'den küçük status kodlarını yakala
                }
            })
            
            console.log('[DEBUG] Yanıt alındı:', response.status, response.data)
            
            if (response.status === 200 && response.data.hwid) {
                console.log('[DEBUG] HWID başarıyla alındı:', response.data.hwid.substring(0, 16) + '...')
                setHwid(response.data.hwid)
                setError('')
            } else {
                const errorMsg = response.data?.detail || 'HWID alınamadı. Backend servisinin çalıştığından emin olun.'
                console.error('[HATA] HWID yanıtı geçersiz:', response.data)
                setError(errorMsg)
            }
        } catch (error) {
            console.error('[HATA] HWID yüklenemedi:', error)
            console.error('[HATA] Error details:', {
                message: error.message,
                code: error.code,
                response: error.response?.data,
                status: error.response?.status,
                config: error.config
            })
            
            let errorMessage = 'HWID alınamadı. '
            
            if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error') || error.code === 'ERR_NETWORK') {
                errorMessage += 'Backend servisine bağlanılamıyor. '
                errorMessage += 'Backend\'in çalıştığından emin olun (http://localhost:8000). '
                errorMessage += 'Tarayıcı konsolunu (F12) kontrol edin.'
            } else if (error.response) {
                const detail = error.response.data?.detail || error.response.statusText || 'Bilinmeyen hata'
                errorMessage += `Backend hatası: ${detail}`
                if (error.response.status === 500) {
                    errorMessage += ' Backend loglarını kontrol edin.'
                }
            } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                errorMessage += 'İstek zaman aşımına uğradı. Backend yanıt vermiyor olabilir.'
            } else {
                errorMessage += `Hata: ${error.message}. `
                errorMessage += 'Tarayıcı konsolunu (F12) ve backend loglarını kontrol edin.'
            }
            
            setError(errorMessage)
        }
    }

    const handleCopyHwid = () => {
        navigator.clipboard.writeText(hwid)
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
    }

    const handleActivateClick = () => {
        if (!licenseKey.trim()) {
            setError('Lütfen lisans anahtarını girin')
            return
        }
        if (!companyName.trim()) {
            setError('Lütfen şirket adını girin')
            return
        }
        setError('')
        setShowConfirmDialog(true)
    }

    const handleActivate = async () => {
        setShowConfirmDialog(false)
        setLoading(true)
        setError('')

        try {
            const response = await axios.post(`${API_BASE}/license/activate`, {
                license_key: licenseKey.trim()
            })

            if (response.data.is_licensed) {
                // Başarılı - firma adını localStorage'a kaydet ve ana uygulamayı aç
                localStorage.setItem('companyName', companyName.trim())
                onActivated(companyName.trim())
            } else {
                setError('Lisans aktifleştirilemedi')
            }
        } catch (error) {
            console.error('Aktivasyon hatası:', error)
            setError(
                error.response?.data?.detail || 
                'Lisans aktifleştirilemedi. Lütfen lisans anahtarını kontrol edin.'
            )
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-800 border border-dark-700 rounded-xl shadow-2xl max-w-2xl w-full p-8 animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-primary-400">
                        Lisans Aktivasyonu
                    </h2>
                    <div className="w-12 h-12 rounded-full bg-primary-500 bg-opacity-20 flex items-center justify-center">
                        <svg
                            className="w-6 h-6 text-primary-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                        </svg>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* HWID Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Makine Kimliği (HWID)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={hwid}
                                readOnly
                                className="flex-1 px-4 py-3 bg-dark-900 border border-dark-600 rounded-lg text-gray-300 font-mono text-sm focus:outline-none focus:border-primary-500"
                            />
                            <button
                                onClick={handleCopyHwid}
                                className="px-4 py-3 bg-dark-700 hover:bg-dark-600 border border-dark-600 rounded-lg text-gray-300 transition-colors duration-200 flex items-center gap-2"
                            >
                                {copySuccess ? (
                                    <>
                                        <svg
                                            className="w-5 h-5 text-green-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                        <span className="text-green-400">Kopyalandı!</span>
                                    </>
                                ) : (
                                    <>
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                            />
                                        </svg>
                                        <span>Kopyala</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <p className="mt-2 text-xs text-gray-400">
                            Bu kimliği lisans sağlayıcınıza gönderin. Size özel bir lisans anahtarı oluşturulacaktır.
                        </p>
                    </div>

                    {/* Company Name Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Şirket Adı
                        </label>
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Şirket adınızı girin..."
                            className="w-full px-4 py-3 bg-dark-900 border border-dark-600 rounded-lg text-gray-300 text-sm focus:outline-none focus:border-primary-500"
                        />
                    </div>

                    {/* License Key Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Lisans Anahtarı
                        </label>
                        <textarea
                            value={licenseKey}
                            onChange={(e) => setLicenseKey(e.target.value)}
                            placeholder="Lisans anahtarınızı buraya yapıştırın..."
                            className="w-full px-4 py-3 bg-dark-900 border border-dark-600 rounded-lg text-gray-300 font-mono text-sm focus:outline-none focus:border-primary-500 resize-none"
                            rows="4"
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
                            <div className="flex items-start gap-2">
                                <svg
                                    className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <div className="flex-1">
                                    <p className="text-red-400 text-sm font-medium mb-1">Hata</p>
                                    <p className="text-red-400 text-sm">{error}</p>
                                    <button
                                        onClick={loadHwid}
                                        className="mt-2 text-xs text-red-300 hover:text-red-200 underline"
                                    >
                                        Tekrar Dene
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
                        <div className="flex items-start gap-2">
                            <svg
                                className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <div className="text-blue-400 text-sm">
                                <p className="font-medium mb-1">Nasıl Çalışır?</p>
                                <ul className="list-disc list-inside space-y-1 text-xs opacity-90">
                                    <li>Yukarıdaki Makine Kimliği'ni (HWID) kopyalayın</li>
                                    <li>Lisans sağlayıcınıza gönderin</li>
                                    <li>Size verilen lisans anahtarını yukarıdaki alana yapıştırın</li>
                                    <li>Aktifleştir butonuna tıklayın</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={handleActivateClick}
                            disabled={loading || !licenseKey.trim() || !companyName.trim()}
                            className="flex-1 px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg
                                        className="animate-spin h-5 w-5"
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
                                    <span>Aktifleştiriliyor...</span>
                                </>
                            ) : (
                                <>
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <span>Aktifleştir</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirm Dialog */}
            {showConfirmDialog && (
                <ConfirmDialog
                    title="Aktivasyonu Onayla"
                    message={`Aktivasyonu gerçekleştirmek istediğinize emin misiniz?\n\nŞirket Adı: ${companyName.trim()}\n\nDüzenlemek ister misiniz?`}
                    type="info"
                    confirmText="Evet, Aktif Et"
                    cancelText="Düzenle"
                    onConfirm={handleActivate}
                    onCancel={() => setShowConfirmDialog(false)}
                />
            )}
        </div>
    )
}

export default ActivationDialog

