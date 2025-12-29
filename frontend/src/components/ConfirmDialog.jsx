export default function ConfirmDialog({ title, message, onConfirm, onCancel, confirmText = "Tamam", cancelText = "İptal", type = "danger" }) {
    const getIcon = () => {
        if (type === 'danger') {
            return (
                <svg className="w-16 h-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            )
        } else if (type === 'warning') {
            return (
                <svg className="w-16 h-16 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            )
        } else {
            return (
                <svg className="w-16 h-16 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-md bg-dark-800 rounded-2xl shadow-2xl border border-dark-700 overflow-hidden animate-scale-in">
                {/* Icon */}
                <div className="flex justify-center pt-8 pb-4">
                    {getIcon()}
                </div>

                {/* Content */}
                <div className="px-8 pb-6 text-center">
                    <h3 className="text-xl font-bold text-dark-50 mb-3">
                        {title}
                    </h3>
                    <p className="text-sm text-dark-300 leading-relaxed whitespace-pre-line">
                        {message}
                    </p>
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-6 py-3 bg-dark-900 text-dark-100 font-medium rounded-lg border border-dark-700 hover:bg-dark-800 hover:border-dark-600 transition-all duration-200 active:scale-95"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-6 py-3 font-medium rounded-lg transition-all duration-200 active:scale-95 ${type === 'danger'
                                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30'
                                : 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/30'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
