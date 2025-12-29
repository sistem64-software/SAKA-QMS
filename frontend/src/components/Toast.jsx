import { useEffect } from 'react'

export default function Toast({ message, type = 'info', onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose()
        }, 3000) // 3 saniye sonra otomatik kapan

        return () => clearTimeout(timer)
    }, [onClose])

    const getIcon = () => {
        if (type === 'success') {
            return (
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        } else if (type === 'error') {
            return (
                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        } else if (type === 'warning') {
            return (
                <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            )
        } else {
            return (
                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        }
    }

    const getBgColor = () => {
        if (type === 'success') return 'bg-green-500/10 border-green-500/30'
        if (type === 'error') return 'bg-red-500/10 border-red-500/30'
        if (type === 'warning') return 'bg-yellow-500/10 border-yellow-500/30'
        return 'bg-blue-500/10 border-blue-500/30'
    }

    return (
        <div className={`fixed top-4 right-4 z-50 min-w-80 max-w-md p-4 rounded-lg border ${getBgColor()} backdrop-blur-xl shadow-2xl animate-slide-in`}>
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    {getIcon()}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-dark-100 leading-relaxed">
                        {message}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="flex-shrink-0 text-dark-400 hover:text-dark-100 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    )
}
