import { describe, expect, test } from "bun:test";
import {
    formatJoinCode,
    generateJoinCode,
    normalizeJoinCode,
} from "./join-codes";

describe("join codes", () => {
    test("generated codes are valid and vary", () => {
        const codes = new Set(Array.from({ length: 100 }, generateJoinCode));
        expect(codes.size).toBe(100);
        for (const code of codes) expect(normalizeJoinCode(code)).toBe(code);
    });

    test("accepts codes as people type them", () => {
        expect(normalizeJoinCode("abcd-2345")).toBe("ABCD2345");
        expect(normalizeJoinCode(" ABCD 2345 ")).toBe("ABCD2345");
    });

    test("rejects wrong lengths and look-alike characters", () => {
        expect(normalizeJoinCode("ABCD234")).toBeNull();
        expect(normalizeJoinCode("ABCD23456")).toBeNull();
        expect(normalizeJoinCode("ABCD0345")).toBeNull(); // 0
        expect(normalizeJoinCode("ABCDI345")).toBeNull(); // I
    });

    test("formats for display", () => {
        expect(formatJoinCode("ABCD2345")).toBe("ABCD-2345");
    });
});
