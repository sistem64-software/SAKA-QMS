import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import {
    DocumentEditorContainerComponent,
    Toolbar
} from '@syncfusion/ej2-react-documenteditor'
import Toast from './Toast'

// Syncfusion servisleri etkinleştir
DocumentEditorContainerComponent.Inject(Toolbar)

const API_BASE = '/api'

export default function WordEditor({ fileContent, selectedFile, companies, onFileSaved, onCompanyAdded }) {
    const editorRef = useRef(null)
    const [selectedCompany, setSelectedCompany] = useState('')
    const [newCompanyName, setNewCompanyName] = useState('')
    const [showNewCompanyModal, setShowNewCompanyModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [isEditorReady, setIsEditorReady] = useState(false)
    const [toast, setToast] = useState(null)

    // Syncfusion editör hazır olduğunda
    useEffect(() => {
        if (editorRef.current) {
            setIsEditorReady(true)
        }
    }, [editorRef.current])

    // Word dosyasını editöre yükle
    useEffect(() => {
        if (isEditorReady && editorRef.current && fileContent) {
            loadDocumentToEditor()
        }
    }, [fileContent, isEditorReady])

    const loadDocumentToEditor = async () => {
        if (!editorRef.current || !fileContent) return

        try {
            // Backend'den orijinal Word dosyasını al (raw endpoint)
            let url
            // selectedFile'dan company bilgisini al
            if (selectedFile?.company) {
                // Firma dosyası
                url = `${API_BASE}/companies/${selectedFile.company}/file/${fileContent.filename}/raw`
                console.log('Firma dosyası raw URL:', url)
            } else {
                // Şablon dosyası
                url = `${API_BASE}/file/${fileContent.filename}/raw`
                console.log('Şablon dosyası raw URL:', url)
            }

            const response = await axios.get(url, {
                responseType: 'blob'
            })

            // Blob'u File objesine çevir
            const file = new File([response.data], fileContent.filename, {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            })

            // Syncfusion editöre yükle
            editorRef.current.documentEditor.open(file)


            // İstenmeyen div'leri sil (Syncfusion overlay/popup - sadece trial banner)
            setTimeout(() => {
                // Syncfusion trial banner'ını bul ve sil (text içeriğine göre)
                const allDivs = document.querySelectorAll('body > div')
                allDivs.forEach(div => {
                    // Trial banner veya lisans uyarısı içeren div'leri sil
                    const text = div.textContent || ''
                    const hasTrialText = text.includes('trial') || text.includes('license') || text.includes('Syncfusion')
                    const isFixedPosition = div.style.position === 'fixed'

                    // Sadece fixed position + trial text içeren div'leri sil
                    if (isFixedPosition && hasTrialText && !div.classList.contains('e-container')) {
                        console.log('Trial banner siliniyor:', div)
                        div.remove()
                    }
                })
            }, 500)

            console.log('Word dosyası Syncfusion editörde açıldı:', fileContent.filename)
        } catch (error) {
            console.error('Word dosyası yüklenirken hata:', error)

            // Hata durumunda boş doküman aç
            if (editorRef.current) {
                editorRef.current.documentEditor.openBlank()
            }

            setToast({ message: 'Word dosyası yüklenemedi. Boş bir doküman açıldı.', type: 'error' })
        }
    }

    const handleSave = async () => {
        if (!selectedCompany) {
            setToast({ message: 'Lütfen önce firma seçin', type: 'warning' })
            return
        }

        if (!editorRef.current || !editorRef.current.documentEditor) {
            setToast({ message: 'Editör hazır değil', type: 'error' })
            return
        }

        setSaving(true)
        try {
            // Syncfusion'ın saveAsBlob metodu kullanılıyor
            const blob = await editorRef.current.documentEditor.saveAsBlob('Docx')

            if (!blob) {
                throw new Error('Dosya blob\'u oluşturulamadı')
            }


            // FormData ile backend'e gönder
            const formData = new FormData()
            formData.append('file', blob, fileContent.filename)
            formData.append('company', selectedCompany)

            // Backend'e kaydet
            const response = await axios.post(`${API_BASE}/save-word-file`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })

            console.log('Dosya kaydedildi:', response.data)
            // Alert kaldırıldı - sessiz kaydetme

            onFileSaved()
            setSaving(false)
            setToast({ message: 'Dosya başarıyla kaydedildi', type: 'success' })
        } catch (error) {
            console.error('Kaydetme hatası:', error)
            console.error('Error response:', error.response)

            let errorMessage = 'Bilinmeyen hata'
            if (error.response?.data?.detail) {
                errorMessage = error.response.data.detail
            } else if (error.message) {
                errorMessage = error.message
            }

            setToast({ message: '❌ Dosya kaydedilirken bir hata oluştu: ' + errorMessage, type: 'error' })
            setSaving(false)
        }
    }

    const handlePrint = () => {
        if (!editorRef.current || !editorRef.current.documentEditor) {
            setToast({ message: 'Editör hazır değil', type: 'error' })
            return
        }

        // Syncfusion'ın built-in print fonksiyonu
        editorRef.current.documentEditor.print()
    }

    const handleAddCompany = async () => {
        if (!newCompanyName.trim()) {
            setToast({ message: 'Lütfen firma adı girin', type: 'warning' })
            return
        }

        try {
            await axios.post(`${API_BASE}/companies`, { name: newCompanyName })
            setShowNewCompanyModal(false)
            setNewCompanyName('')
            setSelectedCompany(newCompanyName)
            onCompanyAdded()
            setToast({ message: 'Firma başarıyla eklendi', type: 'success' })
        } catch (error) {
            console.error('Firma ekleme hatası:', error)
            setToast({ message: 'Firma eklenirken bir hata oluştu: ' + (error.response?.data?.detail || error.message), type: 'error' })
        }
    }

    return (
        <div className="h-full flex flex-col bg-dark-800">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
            {/* Header - Dark Theme */}
            <div className="bg-dark-800 border-b border-dark-700 shadow-sm">
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="font-semibold text-dark-100">{fileContent.filename}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <select
                            value={selectedCompany}
                            onChange={(e) => setSelectedCompany(e.target.value)}
                            className="px-3 py-1.5 bg-dark-700 border border-dark-600 text-dark-100 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">Firma Seçin</option>
                            {companies.map(company => (
                                <option key={company.name} value={company.name}>
                                    {company.name}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => setShowNewCompanyModal(true)}
                            className="px-3 py-1.5 text-sm bg-dark-700 border border-dark-600 text-dark-200 rounded hover:bg-dark-600"
                        >
                            + Yeni Firma
                        </button>
                        <button
                            onClick={handlePrint}
                            className="px-3 py-1.5 text-sm bg-dark-700 border border-dark-600 text-dark-200 rounded hover:bg-dark-600 flex items-center gap-2"
                            title="Yazdır"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Yazdır
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${!selectedCompany ? 'opacity-50' : ''}`}
                        >
                            {saving ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Syncfusion Word Editor */}
            <div className="flex-1 overflow-hidden">
                <DocumentEditorContainerComponent
                    id="container"
                    ref={editorRef}
                    height="100%"
                    enableToolbar={true}
                    serviceUrl="https://ej2services.syncfusion.com/production/web-services/api/documenteditor/"
                    locale="tr-TR"
                    style={{ display: 'block' }}
                />
            </div>

            {/* New Company Modal - Dark Theme */}
            {showNewCompanyModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-dark-800 border border-dark-700 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                        <h3 className="text-lg font-semibold text-dark-100 mb-4">Yeni Firma Ekle</h3>
                        <input
                            type="text"
                            value={newCompanyName}
                            onChange={(e) => setNewCompanyName(e.target.value)}
                            placeholder="Firma adını girin..."
                            className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-dark-100 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-dark-500"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddCompany()}
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={handleAddCompany}
                                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                            >
                                Ekle
                            </button>
                            <button
                                onClick={() => {
                                    setShowNewCompanyModal(false)
                                    setNewCompanyName('')
                                }}
                                className="flex-1 px-4 py-2 bg-dark-700 border border-dark-600 text-dark-200 rounded hover:bg-dark-600"
                            >
                                İptal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
