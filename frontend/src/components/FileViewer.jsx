import { useState } from 'react'
import ExcelEditor from './ExcelEditor'
import WordEditor from './WordEditor'

export default function FileViewer({ fileContent, loading, companies, onFileSaved, onCompanyAdded, selectedFile }) {
    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-dark-700 border-t-primary-500 mb-4"></div>
                    <p className="text-dark-400">Dosya yükleniyor...</p>
                </div>
            </div>
        )
    }

    if (!fileContent) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                    <svg className="w-24 h-24 mx-auto text-dark-700 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-dark-300 mb-2">Dosya Seçilmedi</h3>
                    <p className="text-dark-500">
                        Sol taraftaki listeden bir dosya seçerek düzenlemeye başlayın
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            {fileContent.type === 'excel' && (
                <ExcelEditor
                    fileContent={fileContent}
                    companies={companies}
                    onFileSaved={onFileSaved}
                    onCompanyAdded={onCompanyAdded}
                />
            )}

            {fileContent.type === 'word' && (
                <WordEditor
                    fileContent={fileContent}
                    selectedFile={selectedFile}
                    companies={companies}
                    onFileSaved={onFileSaved}
                    onCompanyAdded={onCompanyAdded}
                />
            )}
        </div>
    )
}
