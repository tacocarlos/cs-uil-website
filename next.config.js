/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
    images: {
        remotePatterns: [
            // allow google user profile images
            {
                protocol: "https",
                hostname: "*.googleusercontent.com",
                port: "",
                pathname: "**",
            },
        ],
    },
};

export default config;
