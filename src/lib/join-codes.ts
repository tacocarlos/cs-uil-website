/**
 * School join codes: 8 characters from an alphabet without look-alikes
 * (no 0/O or 1/I), shown as XXXX-XXXX. 32^8 ≈ 10^12 possible codes, so
 * guessing one isn't practical.
 */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LENGTH = 8;

export function generateJoinCode(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(LENGTH));
    // 256 is a multiple of 32, so every character is equally likely.
    return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/**
 * The stored form of what someone typed: uppercase, without spaces or
 * dashes. Returns null if it can't be a join code.
 */
export function normalizeJoinCode(input: string): string | null {
    const code = input.toUpperCase().replace(/[\s-]/g, "");
    if (code.length !== LENGTH) return null;
    return [...code].every((c) => ALPHABET.includes(c)) ? code : null;
}

/** "ABCD2345" → "ABCD-2345", for display. */
export function formatJoinCode(code: string): string {
    return `${code.slice(0, 4)}-${code.slice(4)}`;
}
