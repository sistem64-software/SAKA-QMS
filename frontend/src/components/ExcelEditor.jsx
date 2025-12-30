import { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = '/api'

export default function ExcelEditor({ fileContent, companies, onFileSaved, onCompanyAdded }) {
    const [sheets, setSheets] = useState(fileContent.sheets || {})
    const [activeSheet, setActiveSheet] = useState(fileContent.active_sheet || Object.keys(fileContent.sheets)[0])
    const [selectedCompany, setSelectedCompany] = useState('')
    const [newCompanyName, setNewCompanyName] = useState('')
    const [showNewCompanyModal, setShowNewCompanyModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [hoveredCell, setHoveredCell] = useState(null) // Track hovered cell {row, col}
    const [focusedCell, setFocusedCell] = useState(null) // Track focused cell {row, col} for formula display
    const [lockFilledCells, setLockFilledCells] = useState(true) // Lock cells that have initial values
    const [originalCells, setOriginalCells] = useState({}) // Track original cell values

    useEffect(() => {
        setSheets(fileContent.sheets || {})
        setActiveSheet(fileContent.active_sheet || Object.keys(fileContent.sheets)[0])

        // Save original cell values for locking
        const original = {}
        Object.keys(fileContent.sheets || {}).forEach(sheetName => {
            original[sheetName] = {}
            const sheetData = fileContent.sheets[sheetName].data || []
            sheetData.forEach((row, rowIndex) => {
                row.forEach((cell, colIndex) => {
                    const key = `${rowIndex}-${colIndex}`
                    const value = cell.value || ''
                    if (value.toString().trim() !== '') {
                        original[sheetName][key] = true
                    }
                })
            })
        })
        setOriginalCells(original)
    }, [fileContent])

    const handleCellChange = (sheetName, rowIndex, colIndex, value) => {
        setSheets(prev => {
            const newSheets = { ...prev }
            const newData = [...newSheets[sheetName].data]
            newData[rowIndex] = [...newData[rowIndex]]

            // Eğer değer = ile başlıyorsa formül olarak kaydet
            if (value.startsWith('=')) {
                newData[rowIndex][colIndex] = {
                    ...newData[rowIndex][colIndex],
                    formula: value,
                    value: value // Geçici olarak formülü göster, backend hesaplayacak
                }
            } else {
                // Formülü kaldır ve sadece değeri kaydet
                const updatedCell = { ...newData[rowIndex][colIndex], value }
                delete updatedCell.formula
                newData[rowIndex][colIndex] = updatedCell
            }

            newSheets[sheetName] = { ...newSheets[sheetName], data: newData }
            return newSheets
        })
    }

    // Helper function to update formula row references
    const updateFormulaReferences = (formula, rowOffset) => {
        if (!formula || !formula.startsWith('=')) return formula

        // Basit satır referansı güncellemesi (örn: A1 -> A2, B10 -> B11)
        return formula.replace(/([A-Z]+)(\d+)/g, (match, col, row) => {
            const rowNum = parseInt(row)
            return `${col}${rowNum + rowOffset}`
        })
    }

    const insertRowBelow = (sheetName, rowIndex) => {
        setSheets(prev => {
            const newSheets = { ...prev }
            const currentData = [...newSheets[sheetName].data]
            const currentMergedCells = newSheets[sheetName].merged_cells || []
            const referenceRow = currentData[rowIndex]

            // Create a new empty row with the same structure and formatting as the reference row
            const newRow = referenceRow.map(cell => {
                const newCell = { ...cell, value: '' }

                // Eğer referans hücrede formül varsa, formülü kopyala ve satır referanslarını güncelle
                if (cell.formula) {
                    newCell.formula = updateFormulaReferences(cell.formula, 1)
                    delete newCell.value // Value boş olacak, backend hesaplayacak
                }

                return newCell
            })

            // Insert the new row after the current row
            const newRowIndex = rowIndex + 1
            currentData.splice(newRowIndex, 0, newRow)

            // Aşağıdaki satırlardaki formülleri güncelle (satır referanslarını 1 artır)
            for (let i = newRowIndex + 1; i < currentData.length; i++) {
                currentData[i] = currentData[i].map(cell => {
                    if (cell.formula) {
                        return {
                            ...cell,
                            formula: updateFormulaReferences(cell.formula, 1)
                        }
                    }
                    return cell
                })
            }

            // Find merged cells that exist on the reference row (single-row merges)
            const newMergedCells = []
            currentMergedCells.forEach(merged => {
                const startRow = merged.start_row - 1 // Convert to 0-indexed
                const endRow = merged.end_row - 1

                // If this is a single-row merge on the reference row, create a copy for the new row
                if (startRow === rowIndex && endRow === rowIndex) {
                    newMergedCells.push({
                        start_row: newRowIndex + 1, // Convert back to 1-indexed
                        end_row: newRowIndex + 1,
                        start_col: merged.start_col,
                        end_col: merged.end_col
                    })
                }
            })

            // Update existing merged cells: adjust row indices for cells below the inserted row
            const updatedMergedCells = currentMergedCells.map(merged => {
                const startRow = merged.start_row - 1 // Convert to 0-indexed
                const endRow = merged.end_row - 1

                // If the merge range is completely after the original row, shift it down
                if (startRow > rowIndex) {
                    return {
                        ...merged,
                        start_row: merged.start_row + 1,
                        end_row: merged.end_row + 1
                    }
                }
                // Otherwise, keep the merge range as is
                return merged
            })

            // Combine updated existing merges with new merges
            const finalMergedCells = [...updatedMergedCells, ...newMergedCells]

            newSheets[sheetName] = {
                ...newSheets[sheetName],
                data: currentData,
                merged_cells: finalMergedCells
            }
            return newSheets
        })
        setHoveredCell(null) // Hide button after insertion
    }

    const handleSave = async () => {
        if (!selectedCompany) {
            alert('Lütfen bir firma seçin')
            return
        }

        setSaving(true)
        try {
            await axios.post(`${API_BASE}/save`, {
                filename: fileContent.filename,
                company: selectedCompany,
                type: 'excel',
                content: {
                    sheets,
                    active_sheet: activeSheet
                }
            })
            onFileSaved()
        } catch (error) {
            console.error('Kaydetme hatası:', error)
            alert('Dosya kaydedilirken bir hata oluştu: ' + (error.response?.data?.detail || error.message))
        } finally {
            setSaving(false)
        }
    }

    const handleAddCompany = async () => {
        if (!newCompanyName.trim()) {
            alert('Lütfen firma adı girin')
            return
        }

        try {
            await axios.post(`${API_BASE}/companies`, { name: newCompanyName })
            setShowNewCompanyModal(false)
            setNewCompanyName('')
            setSelectedCompany(newCompanyName)
            onCompanyAdded()
        } catch (error) {
            console.error('Firma ekleme hatası:', error)
            alert('Firma eklenirken bir hata oluştu: ' + (error.response?.data?.detail || error.message))
        }
    }

    const handlePrint = () => {
        window.print()
    }

    // Helper function: RGB to CSS color
    const rgbToColor = (rgb) => {
        if (!rgb) return null
        if (typeof rgb === 'string' && rgb.length === 8) {
            // ARGB format (openpyxl returns ARGB)
            const r = parseInt(rgb.substring(2, 4), 16)
            const g = parseInt(rgb.substring(4, 6), 16)
            const b = parseInt(rgb.substring(6, 8), 16)
            return `rgb(${r}, ${g}, ${b})`
        }
        return null
    }

    // Helper function: Check if cell is merged and get span info
    const getCellSpan = (rowIndex, colIndex, mergedCells) => {
        for (const merged of mergedCells || []) {
            const startRow = merged.start_row - 1 // Convert to 0-indexed
            const startCol = merged.start_col - 1
            const endRow = merged.end_row - 1
            const endCol = merged.end_col - 1

            if (rowIndex === startRow && colIndex === startCol) {
                return {
                    rowSpan: endRow - startRow + 1,
                    colSpan: endCol - startCol + 1,
                    isStart: true
                }
            } else if (rowIndex >= startRow && rowIndex <= endRow &&
                colIndex >= startCol && colIndex <= endCol) {
                return { isHidden: true }
            }
        }
        return { isStart: false, isHidden: false }
    }

    // All cells are now editable - lock function removed

    // Helper function: Get image for a specific cell coordinate
    const getImageForCell = (coordinate) => {
        const images = sheets[activeSheet]?.images || []
        return images.find(img => img.anchor === coordinate)
    }

    // Helper function: Check if a row is completely empty
    const isRowEmpty = (row) => {
        return row.every(cell => {
            const value = cell.value || ''
            return value.toString().trim() === ''
        })
    }

    const currentSheetData = sheets[activeSheet]?.data || []
    const mergedCells = sheets[activeSheet]?.merged_cells || []
    const sheetNames = Object.keys(sheets)

    return (
        <div className="h-full flex flex-col bg-dark-800">
            {/* Header - Dark Theme - Responsive */}
            <div className="bg-dark-800 border-b border-dark-700 shadow-sm">
                <div className="px-4 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    {/* File Name */}
                    <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="font-semibold text-dark-100 truncate">{fileContent.filename}</span>
                    </div>

                    {/* Company & Actions - Responsive */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        {/* Lock Filled Cells Toggle Switch */}
                        <div className="flex items-center gap-3 px-3 py-2 bg-dark-700 border border-dark-600 rounded text-sm">
                            <span className="text-dark-200 whitespace-nowrap text-xs">Hücre Kilidi:</span>
                            <button
                                onClick={() => setLockFilledCells(!lockFilledCells)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-700 ${lockFilledCells ? 'bg-primary-600' : 'bg-dark-600'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${lockFilledCells ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                            <span className="text-dark-200 whitespace-nowrap text-xs font-medium">
                                {lockFilledCells ? 'Kilitli' : 'Serbest'}
                            </span>
                        </div>

                        <select
                            value={selectedCompany}
                            onChange={(e) => setSelectedCompany(e.target.value)}
                            className="px-3 py-2 bg-dark-700 border border-dark-600 text-dark-100 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-full sm:w-auto"
                        >
                            <option value="">Firma Seçin</option>
                            {companies.map(company => (
                                <option key={company.name} value={company.name}>
                                    {company.name}
                                </option>
                            ))}
                        </select>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowNewCompanyModal(true)}
                                className="flex-1 sm:flex-none px-3 py-2 text-sm bg-dark-700 border border-dark-600 text-dark-200 rounded hover:bg-dark-600 whitespace-nowrap"
                            >
                                + Yeni Firma
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex-1 sm:flex-none px-3 py-2 text-sm bg-dark-700 border border-dark-600 text-dark-200 rounded hover:bg-dark-600 whitespace-nowrap flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                Yazdır
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !selectedCompany}
                                className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg whitespace-nowrap"
                            >
                                {saving ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sheet Tabs - Dark Theme - Scrollable on mobile */}
                {/* Sheet Tabs - Dark Theme - Scrollable on mobile */}
                {sheetNames.length > 0 && (
                    <div className="flex border-t border-dark-700 bg-dark-800 overflow-x-auto">
                        {sheetNames.map(sheetName => (
                            <button
                                key={sheetName}
                                onClick={() => setActiveSheet(sheetName)}
                                className={`px-4 py-2 text-sm border-r border-dark-700 transition-colors whitespace-nowrap ${activeSheet === sheetName
                                    ? 'bg-dark-900 text-primary-400 font-semibold'
                                    : 'text-dark-400 hover:bg-dark-700 hover:text-dark-200'
                                    }`}
                            >
                                {sheetName}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Excel Table with Formatting - Dark Theme */}
            <div id="excel-print-area" className="flex-1 overflow-auto bg-dark-800 p-4">
                <table className="border-collapse">
                    <tbody>
                        {currentSheetData.map((row, rowIndex) => (
                            <tr key={rowIndex} className={isRowEmpty(row) ? 'empty-row' : ''}>
                                {row.map((cell, colIndex) => {
                                    const spanInfo = getCellSpan(rowIndex, colIndex, mergedCells)

                                    if (spanInfo.isHidden) {
                                        return null
                                    }

                                    const cellStyle = {}

                                    // Background color - siyahları mavi tona çevir
                                    if (cell.fill) {
                                        let bgColor = rgbToColor(cell.fill)
                                        // Siyah renkleri (#000000 veya koyu renkler) mavi tonuna çevir
                                        if (bgColor) {
                                            // Eğer renk çok koyu (siyah veya siyaha yakın) ise mavi ton kullan
                                            if (bgColor.toLowerCase() === 'rgb(0, 0, 0)' ||
                                                bgColor.toLowerCase().startsWith('rgb(0,') ||
                                                bgColor.toLowerCase().startsWith('rgb(1,') ||
                                                bgColor.toLowerCase().startsWith('rgb(2,')) {
                                                cellStyle.backgroundColor = '#1e293b' // dark-800 (mavi ton)
                                            } else {
                                                cellStyle.backgroundColor = bgColor
                                            }
                                        }
                                    }

                                    // Font styles
                                    if (cell.font) {
                                        if (cell.font.bold) cellStyle.fontWeight = 'bold'
                                        if (cell.font.italic) cellStyle.fontStyle = 'italic'
                                        if (cell.font.size) cellStyle.fontSize = `${cell.font.size}px`
                                        if (cell.font.name) cellStyle.fontFamily = cell.font.name
                                        if (cell.font.color) {
                                            const fontColor = rgbToColor(cell.font.color)
                                            if (fontColor) cellStyle.color = fontColor
                                        }
                                    }

                                    // Alignment
                                    if (cell.alignment) {
                                        cellStyle.textAlign = cell.alignment.horizontal || 'left'
                                        cellStyle.verticalAlign = cell.alignment.vertical || 'top'
                                    }

                                    // Border style - lighter borders for dark theme
                                    const borderStyle = '1px solid #4b5563'
                                    if (cell.border) {
                                        if (cell.border.top) cellStyle.borderTop = borderStyle
                                        if (cell.border.bottom) cellStyle.borderBottom = borderStyle
                                        if (cell.border.left) cellStyle.borderLeft = borderStyle
                                        if (cell.border.right) cellStyle.borderRight = borderStyle
                                    } else {
                                        cellStyle.border = borderStyle
                                    }

                                    const isLocked = lockFilledCells && originalCells[activeSheet]?.[`${rowIndex}-${colIndex}`]

                                    return (
                                        <td
                                            key={colIndex}
                                            rowSpan={spanInfo.rowSpan || 1}
                                            colSpan={spanInfo.colSpan || 1}
                                            className={`p-0 min-w-[80px] relative ${isLocked ? 'bg-dark-700/50' : ''}`}
                                            style={cellStyle}
                                            onMouseEnter={() => setHoveredCell({ row: rowIndex, col: colIndex })}
                                            onMouseLeave={() => setHoveredCell(null)}
                                        >
                                            <input
                                                type="text"
                                                value={
                                                    // Focus durumunda formülü göster, değilse değeri göster
                                                    focusedCell?.row === rowIndex && focusedCell?.col === colIndex && cell.formula
                                                        ? cell.formula
                                                        : (cell.value || '')
                                                }
                                                onChange={(e) => handleCellChange(activeSheet, rowIndex, colIndex, e.target.value)}
                                                onFocus={() => setFocusedCell({ row: rowIndex, col: colIndex })}
                                                onBlur={() => setFocusedCell(null)}
                                                readOnly={isLocked}
                                                className={`w-full h-full px-2 py-1 text-sm bg-transparent focus:outline-none ${isLocked
                                                    ? 'cursor-not-allowed'
                                                    : 'focus:ring-2 focus:ring-primary-500 focus:z-10'
                                                    }`}
                                                title={isLocked ? 'Bu hücre düzenlenemez' : (cell.formula ? `Formül: ${cell.formula}` : '')}
                                                style={{
                                                    color: cellStyle.color || '#f3f4f6',
                                                    fontWeight: cellStyle.fontWeight,
                                                    fontStyle: cellStyle.fontStyle,
                                                    fontSize: cellStyle.fontSize,
                                                    fontFamily: cellStyle.fontFamily,
                                                    textAlign: cellStyle.textAlign,
                                                }}
                                            />
                                            {/* Display image if exists for this cell */}
                                            {(() => {
                                                const cellImage = getImageForCell(cell.coordinate)
                                                if (cellImage) {
                                                    return (
                                                        <img
                                                            src={`data:image/${cellImage.format};base64,${cellImage.data}`}
                                                            alt="Cell image"
                                                            style={{
                                                                position: 'absolute',
                                                                top: 0,
                                                                left: 0,
                                                                maxWidth: '100%',
                                                                maxHeight: '100%',
                                                                objectFit: 'contain',
                                                                pointerEvents: 'none',
                                                                zIndex: 1
                                                            }}
                                                        />
                                                    )
                                                }
                                                return null
                                            })()}
                                            {/* Add Row Button - Show only on the first column when hovering */}
                                            {hoveredCell?.row === rowIndex && hoveredCell?.col === colIndex && colIndex === 0 && (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        insertRowBelow(activeSheet, rowIndex)
                                                    }}
                                                    className="absolute bottom-0 left-0 w-6 h-6 bg-primary-600 hover:bg-primary-700 text-white rounded-br flex items-center justify-center shadow-lg z-20 transition-all duration-200 hover:scale-110"
                                                    title="Satır Ekle"
                                                    style={{ transform: 'translate(0, 0)' }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                                    </svg>
                                                </button>
                                            )}
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
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
