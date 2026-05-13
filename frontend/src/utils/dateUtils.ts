// Pluralize "night" in Russian (ночь / ночи / ночей)
export function pluralNights(n: number): string {
    if (n % 10 === 1 && n % 100 !== 11) return `${n} ночь`;
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return `${n} ночи`;
    return `${n} ночей`;
}

// Format ISO date string to long Russian locale string e.g. "12 января 2025"
export function formatDateLong(iso: string): string {
    return new Date(iso).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

// Convert Date object to "YYYY-MM-DD" string using local timezone (not UTC)
export function toISO(date: Date | null): string {
    if (!date) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

// Parse "YYYY-MM-DD" string to Date object at local midnight (avoids UTC shift)
export function fromISO(iso: string): Date | null {
    if (!iso) return null;
    return new Date(iso + "T00:00:00");
}

// Insert zero-width spaces into words longer than maxLen to allow line breaking
export const breakLongWords = (text: string, maxLen = 15): string =>
    text.split(" ").map((word) =>
        word.length > maxLen
            ? word.match(new RegExp(`.{1,${maxLen}}`, "g"))?.join("\u200B") ?? word
            : word
    ).join(" ");


// Return today and tomorrow as "YYYY-MM-DD" strings in local timezone
export function getTodayAndTomorrow(): { today: string; tomorrow: string } {
    const now = new Date();
    const next = new Date(now);
    next.setDate(next.getDate() + 1);
    return { today: toISO(now), tomorrow: toISO(next) };
}

// Calculate number of nights between two "YYYY-MM-DD" date strings
export function nightsBetween(checkIn: string, checkOut: string): number {
    if (!checkIn || !checkOut) return 0;
    const [y1, m1, d1] = checkIn.split("-").map(Number);
    const [y2, m2, d2] = checkOut.split("-").map(Number);
    const a = new Date(y1, m1 - 1, d1);
    const b = new Date(y2, m2 - 1, d2);
    return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

// Return the next day as a "YYYY-MM-DD" string given an ISO date string
export function nextDay(isoDate: string): string {
    const d = new Date(isoDate);
    d.setDate(d.getDate() + 1);
    return toISO(d);
}