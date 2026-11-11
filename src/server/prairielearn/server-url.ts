import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";

/**
 * Teachers give the address of their PrairieLearn server, and the site then
 * sends requests there with their token. These checks keep that from being
 * used to reach anything but a public HTTPS server (e.g. the site's own
 * network or a cloud metadata service). Development allows plain HTTP and
 * local addresses, for a PrairieLearn running locally.
 */

/**
 * The server's origin ("https://us.prairielearn.com") from what a teacher
 * typed: a bare host, or any URL on the server (such as a course page).
 * Null if it isn't an HTTP(S) address, or is plain HTTP when `allowHttp` is
 * off.
 */
export function normalizeServerUrl(
    input: string,
    { allowHttp = false } = {},
): string | null {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
        ? trimmed
        : `https://${trimmed}`;
    let url: URL;
    try {
        url = new URL(withScheme);
    } catch {
        return null;
    }
    if (url.username || url.password) return null;
    if (url.protocol === "https:") return url.origin;
    if (url.protocol === "http:" && allowHttp) return url.origin;
    return null;
}

/** Addresses that aren't on the public internet. */
const NON_PUBLIC = new BlockList();
for (const [network, prefix] of [
    ["0.0.0.0", 8], // "this network"
    ["10.0.0.0", 8], // private
    ["100.64.0.0", 10], // carrier-grade NAT
    ["127.0.0.0", 8], // loopback
    ["169.254.0.0", 16], // link-local, including cloud metadata
    ["172.16.0.0", 12], // private
    ["192.0.0.0", 24], // IETF protocol assignments
    ["192.168.0.0", 16], // private
    ["198.18.0.0", 15], // benchmarking
    ["224.0.0.0", 3], // multicast and reserved, up to 255.255.255.255
] as const) {
    NON_PUBLIC.addSubnet(network, prefix, "ipv4");
}
for (const [network, prefix] of [
    ["::", 128], // unspecified
    ["::1", 128], // loopback
    ["fc00::", 7], // unique local
    ["fe80::", 10], // link-local
    ["ff00::", 8], // multicast
] as const) {
    NON_PUBLIC.addSubnet(network, prefix, "ipv6");
}

/** Whether an IP address is on the public internet. */
export function isPublicAddress(address: string): boolean {
    const family = isIP(address);
    if (family === 0) return false;
    // IPv4 written as IPv6 (::ffff:10.0.0.1) is checked as IPv4.
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address);
    if (mapped) return isPublicAddress(mapped[1]!);
    return !NON_PUBLIC.check(address, family === 4 ? "ipv4" : "ipv6");
}

/**
 * Whether every address a host name resolves to is public (an IP address
 * is checked as is). False if it doesn't resolve.
 */
export async function resolvesToPublicAddresses(
    hostname: string,
): Promise<boolean> {
    // URL hosts write IPv6 in brackets.
    const host = hostname.replace(/^\[(.*)\]$/, "$1");
    if (isIP(host)) return isPublicAddress(host);
    try {
        const addresses = await lookup(host, { all: true });
        return (
            addresses.length > 0 &&
            addresses.every((a) => isPublicAddress(a.address))
        );
    } catch {
        return false;
    }
}
