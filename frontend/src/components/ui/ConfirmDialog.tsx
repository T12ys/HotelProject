interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    description?: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
    onCancel: () => void;
    danger?: boolean;
    isLoading?: boolean;
}

export default function ConfirmDialog({
                                          isOpen,
                                          title,
                                          description,
                                          confirmText,
                                          cancelText,
                                          onConfirm,
                                          onCancel,
                                          danger = false,
                                          isLoading = false,
                                      }: ConfirmDialogProps) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={onCancel}
        >
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-5"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${danger ? "bg-red-100" : "bg-amber-100"}`}>
                    {danger ? (
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                </div>

                {/* Text */}
                <div className="text-center">
                    <h3 className="font-semibold text-stone-800 text-base">{title}</h3>
                    {description && (
                        <p className="text-stone-500 text-sm mt-1">{description}</p>
                    )}
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="flex-1 border border-stone-300 text-stone-600 rounded-xl py-2.5 text-sm font-medium hover:bg-stone-50 disabled:opacity-50 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 rounded-xl py-2.5 text-sm font-medium text-white disabled:opacity-50 transition-colors ${
                            danger
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-orange-500 hover:bg-orange-600"
                        }`}
                    >
                        {isLoading ? "..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}