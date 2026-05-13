import { useState, useCallback, useRef, useEffect } from "react";
import { useInfiniteTags, useCreateTag, useUpdateTag, useDeleteTag } from "../../features/tag/useTag.ts";
import type { TagResponseDto } from "../../features/tag/tagTypes.ts";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const LANGUAGES = ["en", "ru", "az"] as const;

function slugify(input: string): string {
    return input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

const EN_VALID_REGEX = /^[a-zA-Z0-9\s-]+$/;

function validateEnTranslation(value: string): string | null {
    if (!value.trim()) return "English translation is required.";
    if (!EN_VALID_REGEX.test(value))
        return "Only Latin letters, digits, spaces and hyphens are allowed.";
    return null;
}

function TagForm({
                     initial,
                     onSave,
                     onCancel,
                     isSaving,
                 }: {
    initial?: TagResponseDto;
    onSave: (translations: Record<string, string>) => Promise<void>;
    onCancel: () => void;
    isSaving: boolean;
}) {
    const [translations, setTranslations] = useState<Record<string, string>>(
        initial?.translations ?? {}
    );
    const [enError, setEnError] = useState<string | null>(null);

    const enValue = translations["en"] ?? "";
    const slugPreview = slugify(enValue);

    const setLang = (lang: string, value: string) => {
        setTranslations((prev) => ({ ...prev, [lang]: value }));
        if (lang === "en") {
            setEnError(validateEnTranslation(value));
        }
    };

    const handleSave = async () => {
        const validationError = validateEnTranslation(enValue);
        if (validationError) {
            setEnError(validationError);
            return;
        }
        await onSave(translations);
    };

    const isEnInvalid = enError !== null && enValue.length > 0;

    return (
        <div className="flex flex-col gap-3">
            {LANGUAGES.map((lang) => (
                <div key={lang} className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                        {lang === "en" ? "English" : lang === "ru" ? "Русский" : "Azərbaycan"}
                        {lang === "en" && <span className="text-red-400"> *</span>}
                    </label>
                    <input
                        type="text"
                        value={translations[lang] ?? ""}
                        onChange={(e) => setLang(lang, e.target.value)}
                        placeholder={
                            lang === "en" ? "Swimming Pool" :
                                lang === "ru" ? "Бассейн" : "Hovuz"
                        }
                        className={`border rounded-lg px-3 py-2 text-sm focus:outline-none bg-white transition-colors ${
                            lang === "en" && isEnInvalid
                                ? "border-red-400 focus:border-red-500"
                                : "border-stone-300 focus:border-amber-500"
                        }`}
                    />
                    {lang === "en" && enError && enValue.length > 0 && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                            {enError}
                        </p>
                    )}
                    {lang === "en" && slugPreview && !isEnInvalid && (
                        <p className="text-xs text-stone-400 flex items-center gap-1">
                            <span className="text-stone-300">#</span>
                            <span>
                                Slug: <span className="font-mono text-amber-600">{slugPreview}</span>
                            </span>
                        </p>
                    )}
                </div>
            ))}

            {!enValue && !enError && (
                <p className="text-xs text-stone-400 -mt-1">
                    English name is used to generate the slug. Latin letters only.
                </p>
            )}

            <div className="flex gap-2 mt-1">
                <button
                    onClick={() => void handleSave()}
                    disabled={isSaving || isEnInvalid}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg py-2 font-medium transition-colors"
                >
                    {isSaving ? "Saving..." : initial ? "Save changes" : "Create tag"}
                </button>
                <button
                    onClick={onCancel}
                    className="flex-1 border border-stone-300 text-stone-600 text-sm rounded-lg py-2 hover:border-stone-400 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

function TagRow({
                    tag,
                    onEdit,
                    onDelete,
                    isDeleting,
                }: {
    tag: TagResponseDto;
    onEdit: () => void;
    onDelete: () => void;
    isDeleting: boolean;
}) {
    return (
        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-stone-50 group transition-colors">
            <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    <span className="text-sm font-medium text-stone-700 truncate">
                        {tag.translations["en"] ?? tag.slug}
                    </span>
                    <span className="text-xs text-stone-400 hidden sm:block">{tag.slug}</span>
                </div>
                {Object.entries(tag.translations)
                    .filter(([lang]) => lang !== "en")
                    .filter(([, val]) => val)
                    .length > 0 && (
                    <div className="flex gap-2 ml-4 mt-0.5">
                        {Object.entries(tag.translations)
                            .filter(([lang]) => lang !== "en")
                            .filter(([, val]) => val)
                            .map(([lang, val]) => (
                                <span key={lang} className="text-xs text-stone-400">
                                    {lang}: {val}
                                </span>
                            ))}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                <button
                    onClick={onEdit}
                    className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    title="Edit tag"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                </button>
                <button
                    onClick={onDelete}
                    disabled={isDeleting}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:cursor-not-allowed transition-colors"
                    title="Delete tag"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

export default function TagsModal({ isOpen, onClose }: Props) {
    const [mode, setMode] = useState<"list" | "create" | "edit">("list");
    const [editingTag, setEditingTag] = useState<TagResponseDto | null>(null);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [confirmDeleteName, setConfirmDeleteName] = useState("");

    const createTagMutation = useCreateTag();
    const updateTagMutation = useUpdateTag();
    const deleteTagMutation = useDeleteTag();

    const {
        data: tagsData,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteTags({
        pageSize: 20,
        sortBy: "Slug:asc",
        search: debouncedSearch,
    });

    const observerRef = useRef<HTMLDivElement>(null);
    const overlayMouseDown = useRef(false);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const handleObserver = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                void fetchNextPage();
            }
        },
        [fetchNextPage, hasNextPage, isFetchingNextPage]
    );

    useEffect(() => {
        const el = observerRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
        observer.observe(el);
        return () => observer.disconnect();
    }, [handleObserver, isOpen]);

    const allTags = tagsData?.pages.flatMap((p) => p.items).filter(Boolean) ?? [];

    const handleCreate = async (translations: Record<string, string>) => {
        setIsSaving(true);
        await createTagMutation.mutateAsync({ translations });
        setMode("list");
        setIsSaving(false);
    };

    const handleUpdate = async (translations: Record<string, string>) => {
        if (!editingTag) return;
        setIsSaving(true);
        await updateTagMutation.mutateAsync({ id: editingTag.id, dto: { translations } });
        setMode("list");
        setEditingTag(null);
        setIsSaving(false);
    };

    const handleDeleteConfirm = async () => {
        if (!confirmDeleteId) return;
        await deleteTagMutation.mutateAsync(confirmDeleteId);
        setConfirmDeleteId(null);
    };

    const handleEdit = (tag: TagResponseDto) => {
        setEditingTag(tag);
        setMode("edit");
    };

    const handleCancel = () => {
        setMode("list");
        setEditingTag(null);
    };

    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                onMouseDown={(e) => { overlayMouseDown.current = e.target === e.currentTarget; }}
                onMouseUp={(e) => {
                    if (overlayMouseDown.current && e.target === e.currentTarget) onClose();
                    overlayMouseDown.current = false;
                }}
            >
                <div
                    className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col"
                    style={{ maxHeight: "85vh" }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 pb-4 border-b border-stone-200 shrink-0">
                        <div>
                            <h2 className="font-bold text-stone-800 text-lg">Tags Manager</h2>
                            <p className="text-stone-500 text-sm mt-0.5">
                                {mode === "create" ? "New tag" :
                                    mode === "edit" ? `Editing: ${editingTag?.slug}` :
                                        "Create and manage tags"}
                            </p>
                        </div>
                        <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-lg leading-none ml-3">✕</button>
                    </div>

                    {/* Create / Edit form */}
                    {(mode === "create" || mode === "edit") && (
                        <div className="px-5 py-4 overflow-y-auto flex-1">
                            <TagForm
                                initial={mode === "edit" ? editingTag ?? undefined : undefined}
                                onSave={mode === "edit" ? handleUpdate : handleCreate}
                                onCancel={handleCancel}
                                isSaving={isSaving}
                            />
                        </div>
                    )}

                    {/* List mode */}
                    {mode === "list" && (
                        <>
                            <div className="px-5 pt-4 shrink-0">
                                <div className="relative">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
                                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search by slug..."
                                        className="w-full pl-9 pr-8 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500 text-sm bg-white"
                                    />
                                    {search && (
                                        <button
                                            onClick={() => setSearch("")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto px-5 py-3">
                                {isLoading && (
                                    <div className="flex flex-col gap-2 py-2">
                                        {[...Array(4)].map((_, i) => (
                                            <div key={i} className="h-9 bg-stone-100 animate-pulse rounded-xl" />
                                        ))}
                                    </div>
                                )}

                                {!isLoading && allTags.length === 0 && (
                                    <div className="text-center py-8">
                                        <p className="text-stone-400 text-sm">
                                            {search ? "No tags match your search" : "No tags yet. Create one!"}
                                        </p>
                                    </div>
                                )}

                                <div className="flex flex-col gap-1">
                                    {allTags.map((tag) => (
                                        <TagRow
                                            key={tag.id}
                                            tag={tag}
                                            onEdit={() => handleEdit(tag)}
                                            onDelete={() => {
                                                setConfirmDeleteId(tag.id);
                                                setConfirmDeleteName(tag.translations["en"] ?? tag.slug);
                                            }}
                                            isDeleting={deleteTagMutation.isPending}
                                        />
                                    ))}
                                </div>

                                <div ref={observerRef} className="py-2 text-center">
                                    {isFetchingNextPage && (
                                        <span className="text-xs text-stone-400">Loading more...</span>
                                    )}
                                </div>
                            </div>

                            <div className="px-5 py-4 border-t border-stone-200 shrink-0 flex items-center justify-between">
                                <span className="text-xs text-stone-400">
                                    {allTags.length} tag{allTags.length !== 1 ? "s" : ""}{hasNextPage ? "+" : ""}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setMode("create")}
                                        className="bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg px-4 py-1.5 transition-colors font-medium"
                                    >
                                        + New tag
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="border border-stone-300 bg-white hover:border-stone-400 text-stone-600 text-sm rounded-lg px-4 py-1.5 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <ConfirmDialog
                isOpen={confirmDeleteId !== null}
                title="Delete tag?"
                description={`"${confirmDeleteName}" will be removed from all room types.`}
                confirmText="Delete"
                cancelText="Cancel"
                danger
                isLoading={deleteTagMutation.isPending}
                onConfirm={() => void handleDeleteConfirm()}
                onCancel={() => setConfirmDeleteId(null)}
            />
        </>
    );
}