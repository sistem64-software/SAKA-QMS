import { useState, useEffect, useRef } from 'react'

export default function SearchModal({ isOpen, onClose, onSearch, searchResults, isSearching, onFileSelect }) {
    const [searchQuery, setSearchQuery] = useState('')
    const modalRef = useRef(null)
    const lastSearchRef = useRef('')

    // Auto-search with debounce
    useEffect(() => {
        if (!isOpen) return

        // Debounce timer
        const timer = setTimeout(() => {
            if (searchQuery) {
                // Sadece arama parametresi değiştiyse arama yap
                if (lastSearchRef.current === searchQuery) {
                    return // Aynı arama, tekrar yapma
                }

                // Arama yap ve son aramayı kaydet
                lastSearchRef.current = searchQuery
                onSearch(searchQuery)
            }
        }, 1000) // 1 second delay after user stops typing

        return () => clearTimeout(timer)
    }, [searchQuery, isOpen, onSearch])

    // Modal dışına tıklandığında kapat
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            // ESC tuşu ile kapat
            const handleEsc = (event) => {
                if (event.key === 'Escape') {
                    onClose()
                }
            }
            document.addEventListener('keydown', handleEsc)

            return () => {
                document.removeEventListener('mousedown', handleClickOutside)
                document.removeEventListener('keydown', handleEsc)
            }
        }
    }, [isOpen, onClose])

    // Modal kapatıldığında arama state'lerini temizle
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('')
            lastSearchRef.current = ''
        }
    }, [isOpen])

    const handleClear = () => {
        setSearchQuery('')
        lastSearchRef.current = ''
    }

    const handleFileClick = (file) => {
        onFileSelect({ ...file, company: file.company })
        onClose()
    }

    const getFileIcon = (extension) => {
        if (extension === '.xlsx' || extension === '.xls') {
            return (
                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        } else {
            return (
                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div ref={modalRef} className="bg-dark-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-dark-700 animate-scaleIn">
                {/* Header */}
                <div className="p-6 border-b border-dark-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-900/30 rounded-lg">
                            <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-dark-100">Dosya Ara</h2>
                            <p className="text-sm text-dark-400">Tüm alanlarda arama yapın</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                        aria-label="Kapat"
                    >
                        <svg className="w-6 h-6 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Search Input */}
                <div className="p-6 bg-dark-900/50">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-dark-300 mb-2">
                                Arama
                            </label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Firma adı, iş emir no, parça numarası veya parça adı girin..."
                                    className="input-field flex-1"
                                    disabled={isSearching}
                                    autoFocus
                                />
                                {searchQuery && (
                                    <button
                                        onClick={handleClear}
                                        className="px-6 py-2.5 bg-dark-700 hover:bg-dark-600 border border-dark-600 hover:border-dark-500 rounded-lg transition-all duration-200"
                                    >
                                        Temizle
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-320px)]">
                    {isSearching ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <svg className="animate-spin h-16 w-16 text-primary-500 mb-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <p className="text-lg font-semibold text-dark-200 mb-2">Aranıyor...</p>
                            <p className="text-sm text-dark-400">Excel dosyaları taranıyor, lütfen bekleyin</p>
                        </div>
                    ) : searchResults.length > 0 ? (
                        <div>
                            <h3 className="text-sm font-semibold text-dark-400 mb-4 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {searchResults.length} sonuç bulundu
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {searchResults.map((file) => (
                                    <div
                                        key={`${file.company}-${file.full_path}`}
                                        onClick={() => handleFileClick(file)}
                                        className="p-4 bg-dark-900 border border-dark-700 rounded-xl hover:bg-dark-800 hover:border-primary-600 transition-all duration-200 cursor-pointer group"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="mt-1">
                                                {getFileIcon(file.extension)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-dark-100 truncate mb-2 group-hover:text-primary-400 transition-colors">
                                                    {file.name}
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="text-xs px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded">
                                                        {file.company}
                                                    </span>
                                                    {file.subfolder && (
                                                        <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded">
                                                            {file.subfolder}
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-dark-500">
                                                        {formatFileSize(file.size)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : searchQuery ? (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 text-dark-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-dark-400">Sonuç bulunamadı</p>
                            <p className="text-sm text-dark-500 mt-1">Farklı kriterler deneyin</p>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 text-dark-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <p className="text-dark-400">Arama yapmaya başlayın</p>
                            <p className="text-sm text-dark-500 mt-1">Firma adı, iş emir no, parça numarası veya parça adı girin</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
