import { useState, useRef } from 'react'
import axios from 'axios'

const API_BASE = '/api'

export default function Sidebar({
    templates,
    companies = [],
    companyFiles = [],
    selectedCompany,
    onCompanySelect,
    onCompanyDelete,
    onFileSelect,
    onFileUploaded,
    onFileDelete,
    selectedFile,
    isOpen,
    onError,
    onSuccess,

    companyName = ''
}) {
    const [uploading, setUploading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [isSearching, setIsSearching] = useState(false)
    const fileInputRef = useRef(null)
    const searchTimeoutRef = useRef(null)

    const handleSearch = async (query) => {
        setSearchQuery(query)

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }

        if (query.length < 2) {
            setSearchResults([])
            setIsSearching(false)
            return
        }

        setIsSearching(true)
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const response = await axios.get(`${API_BASE}/search`, {
                    params: { query }
                })
                setSearchResults(response.data.results || [])
            } catch (error) {
                console.error('Arama hatası:', error)
            } finally {
                setIsSearching(false)
            }
        }, 500)
    }

    const handleFileUpload = async (event) => {
        const files = Array.from(event.target.files)
        if (files.length === 0) return

        const formData = new FormData()
        files.forEach(file => {
            formData.append('files', file)
        })

        setUploading(true)
        try {
            const response = await axios.post(`${API_BASE}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })

            // Başarı mesajı göster
            if (response.data.success_count > 0) {
                const message = `${response.data.success_count} dosya başarıyla yüklendi`
                const fullMessage = response.data.error_count > 0
                    ? `${message}\n${response.data.error_count} dosya yüklenemedi`
                    : message

                if (onSuccess) {
                    onSuccess(fullMessage, 'success')
                }
            }

            onFileUploaded()
            // Input'u temizle
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        } catch (error) {
            console.error('Yükleme hatası:', error)
            if (onError) {
                onError('Dosya yüklenirken bir hata oluştu: ' + (error.response?.data?.detail || error.message))
            }
        } finally {
            setUploading(false)
        }
    }

    const getFileIcon = (extension) => {
        if (extension === '.xlsx' || extension === '.xls') {
            return (
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        } else {
            return (
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        }
    }

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    return (
        <aside className={`fixed left-0 top-0 h-screen w-80 bg-dark-800 flex flex-col transition-transform duration-300 ease-in-out z-40 ${isOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
            {/* Header */}
            <div className="p-6 text-right">
                <h1 className="text-2xl font-bold text-gradient mb-2">
                    {companyName || 'SAKA QMS'}
                </h1>
                <p className="text-sm text-dark-400">Form Yönetim Sistemi</p>
            </div>

            {/* Upload Section */}
            <div className="p-4">
                <label className="block">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.docx,.doc"
                        multiple
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                    />
                    <div className="btn-primary w-full text-center cursor-pointer flex items-center justify-center gap-2">
                        {uploading ? (
                            <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Yükleniyor...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                Dosya Yükle
                            </>
                        )}
                    </div>
                </label>
                <p className="text-xs text-dark-500 mt-2 text-center">
                    Birden fazla Excel veya Word dosyası seçebilirsiniz
                </p>
            </div>



            {/* Search Section */}
            <div className="px-4 mb-4">
                <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="İş emri, parça no veya ad..."
                        className="w-full bg-dark-900 border border-dark-700 text-dark-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 pl-10 transition-all duration-200"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        {isSearching ? (
                            <svg className="animate-spin h-4 w-4 text-primary-400" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        )}
                    </div>
                </div>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto p-4 pt-0">
                {/* Arama Sonuçları */}
                {searchQuery.length >= 2 && (
                    <div className="mb-6">
                        <h2 className="text-sm font-semibold text-primary-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                            Arama Sonuçları ({searchResults.length})
                            {searchQuery && (
                                <button
                                    onClick={() => handleSearch('')}
                                    className="text-[10px] lowercase bg-dark-700 hover:bg-dark-600 px-2 py-0.5 rounded text-dark-300"
                                >
                                    temizle
                                </button>
                            )}
                        </h2>
                        <div className="space-y-2">
                            {searchResults.length === 0 && !isSearching ? (
                                <p className="text-dark-500 text-xs text-center py-2">Sonuç bulunamadı</p>
                            ) : (
                                searchResults.map((result) => (
                                    <div
                                        key={`${result.company}-${result.path}`}
                                        className={`relative p-3 rounded-lg border transition-all duration-200 group
                                            ${selectedFile?.name === result.filename && selectedFile?.company === result.company
                                                ? 'bg-primary-900/30 border-primary-600 shadow-lg shadow-primary-900/20'
                                                : 'bg-dark-900 border-dark-700 hover:bg-dark-800 hover:border-dark-600'
                                            }`}
                                    >
                                        <button
                                            onClick={() => onFileSelect({
                                                name: result.filename,
                                                company: result.company,
                                                extension: result.extension
                                            })}
                                            className="w-full text-left flex items-start gap-3"
                                        >
                                            <div className="mt-0.5">
                                                {getFileIcon(result.extension)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-medium text-sm truncate transition-colors mb-1
                                                    ${selectedFile?.name === result.filename && selectedFile?.company === result.company ? 'text-primary-400' : 'text-dark-200 group-hover:text-dark-100'}
                                                `}>
                                                    {result.filename}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded">
                                                        {result.company}
                                                    </span>
                                                    <span className="text-[10px] text-dark-500 italic">
                                                        {result.reason}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="my-4 border-b border-dark-700"></div>
                    </div>
                )}
                {/* Şablon Dosyalar */}
                <h2 className="text-sm font-semibold text-dark-400 uppercase tracking-wide mb-3">
                    Şablon Dosyalar ({templates.length})
                </h2>

                <div className="space-y-2 mb-6">
                    {templates.length === 0 ? (
                        <div className="text-center py-4">
                            <p className="text-dark-500 text-xs">Henüz dosya yüklenmedi</p>
                        </div>
                    ) : (
                        templates.map((file) => (
                            <div
                                key={file.name}
                                className={`relative p-3 rounded-lg border transition-all duration-200 group
                  ${selectedFile?.name === file.name
                                        ? 'bg-primary-900/30 border-primary-600 shadow-lg shadow-primary-900/20'
                                        : 'bg-dark-900 border-dark-700 hover:bg-dark-800 hover:border-dark-600'
                                    }`}
                            >
                                <button
                                    onClick={() => onFileSelect(file)}
                                    className="w-full text-left flex items-start gap-3"
                                >
                                    <div className="mt-0.5">
                                        {getFileIcon(file.extension)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-medium text-sm truncate transition-colors
                       ${selectedFile?.name === file.name ? 'text-primary-400' : 'text-dark-200 group-hover:text-dark-100'}
                     `}>
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-dark-500 mt-0.5">
                                            {formatFileSize(file.size)}
                                        </p>
                                    </div>
                                </button>

                                {/* Delete Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onFileDelete(file)
                                    }}
                                    className="absolute top-3 right-3 p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-95"
                                    title="Dosyayı Sil"
                                >
                                    <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Firma Seçici */}
                <div className="mt-6 mb-3">
                    <label className="block text-sm font-semibold text-dark-400 uppercase tracking-wide mb-2">
                        Firma Seç
                    </label>
                    <div className="flex gap-2">
                        <select
                            value={selectedCompany || ''}
                            onChange={(e) => onCompanySelect(e.target.value || null)}
                            className="select-field flex-1"
                        >
                            <option value="">Firma Seçin</option>
                            {companies.map((company) => (
                                <option key={company.name} value={company.name}>
                                    {company.name} ({company.file_count} dosya)
                                </option>
                            ))}
                        </select>
                        {selectedCompany && (
                            <button
                                onClick={() => onCompanyDelete(selectedCompany)}
                                className="p-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-lg transition-all duration-200 active:scale-95"
                                title="Firmayı Sil"
                            >
                                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Firma Dosyaları */}
                <h2 className="text-sm font-semibold text-dark-400 uppercase tracking-wide mb-3">
                    Firma Dosyaları ({companyFiles.length})
                </h2>

                <div className="space-y-2">
                    {!selectedCompany ? (
                        <div className="text-center py-4">
                            <p className="text-dark-500 text-xs">Firma seçin</p>
                        </div>
                    ) : companyFiles.length === 0 ? (
                        <div className="text-center py-4">
                            <p className="text-dark-500 text-xs">Bu firmada henüz dosya yok</p>
                        </div>
                    ) : (
                        companyFiles.map((file) => (
                            <div
                                key={file.full_path}
                                className={`relative p-3 rounded-lg border transition-all duration-200 group
                  ${selectedFile?.name === file.name && selectedFile?.company === selectedCompany
                                        ? 'bg-primary-900/30 border-primary-600 shadow-lg shadow-primary-900/20'
                                        : 'bg-dark-900 border-dark-700 hover:bg-dark-800 hover:border-dark-600'
                                    }`}
                            >
                                <button
                                    onClick={() => onFileSelect({ ...file, company: selectedCompany })}
                                    className="w-full text-left flex items-start gap-3"
                                >
                                    <div className="mt-0.5">
                                        {getFileIcon(file.extension)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-medium text-sm truncate transition-colors mb-1
                       ${selectedFile?.name === file.name && selectedFile?.company === selectedCompany ? 'text-primary-400' : 'text-dark-200 group-hover:text-dark-100'}
                     `}>
                                            {file.name}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded">
                                                {selectedCompany}
                                            </span>
                                            <span className="text-xs text-dark-500">
                                                {formatFileSize(file.size)}
                                            </span>
                                        </div>
                                    </div>
                                </button>

                                {/* Delete Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onFileDelete({ ...file, company: selectedCompany })
                                    }}
                                    className="absolute top-3 right-3 p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-95"
                                    title="Dosyayı Sil"
                                >
                                    <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </aside>
    )
}
