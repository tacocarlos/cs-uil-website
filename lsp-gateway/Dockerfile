# LSP gateway with its language servers: jdtls (Java), pyright (Python),
# clangd (C/C++). Build from this directory:
#   docker build -t lsp-gateway .

# Recent jdtls releases need Java 21 to run (they can still target older Java).
FROM eclipse-temurin:21-jre AS jre

FROM oven/bun:1.4.2-debian

# The stock x64 Bun needs AVX2, which some servers (including the Judge0 host)
# lack; on x64 swap in Bun's "baseline" build, which runs on any x64 CPU.
# Keep BUN_VERSION in step with the base image tag. The hash comes from the
# release's SHASUMS256.txt.
ARG TARGETARCH
ARG BUN_VERSION=1.4.2
ARG BUN_BASELINE_SHA256=c678040f14fe0440eb839d37cbd0ce4c051a32da72806ac97de6a6aab6bf728f

# jdtls milestone, pinned and checksum-verified. To upgrade, pick a version
# from https://download.eclipse.org/jdtls/milestones/, then take the tarball
# name from <version>/latest.txt and the hash from its .sha256 file.
ARG JDTLS_VERSION=1.61.0
ARG JDTLS_BUILD=202609031315
ARG JDTLS_SHA256=338e7e73d61836651ba2453919a0d34fa763eb4e7c03342092309bffb8934c64

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates curl python3 nodejs npm \
        # clangd needs the C and C++ standard library headers.
        clangd libc6-dev libstdc++-14-dev \
    && npm install -g pyright \
    && JDTLS_TAR="jdt-language-server-${JDTLS_VERSION}-${JDTLS_BUILD}.tar.gz" \
    && curl -fsSL -o "/tmp/${JDTLS_TAR}" \
        "https://download.eclipse.org/jdtls/milestones/${JDTLS_VERSION}/${JDTLS_TAR}" \
    && echo "${JDTLS_SHA256}  /tmp/${JDTLS_TAR}" | sha256sum -c - \
    && mkdir -p /opt/jdtls \
    # The tarball's files belong to a very high UID that user-namespaced
    # Docker hosts can't map, so don't try to keep it; we chown below anyway.
    && tar -xzf "/tmp/${JDTLS_TAR}" -C /opt/jdtls --no-same-owner \
    && rm "/tmp/${JDTLS_TAR}" \
    && ln -s /opt/jdtls/bin/jdtls /usr/local/bin/jdtls \
    # jdtls writes to its configuration area inside the install directory.
    && chown -R bun:bun /opt/jdtls \
    && if [ "${TARGETARCH:-$(dpkg --print-architecture)}" = "amd64" ]; then \
        curl -fsSL -o /tmp/bun.zip \
            "https://github.com/oven-sh/bun/releases/download/bun-v${BUN_VERSION}/bun-linux-x64-baseline.zip" \
        && echo "${BUN_BASELINE_SHA256}  /tmp/bun.zip" | sha256sum -c - \
        && python3 -m zipfile -e /tmp/bun.zip /tmp/bun \
        && install -m 755 /tmp/bun/bun-linux-x64-baseline/bun "$(command -v bun)" \
        && rm -rf /tmp/bun.zip /tmp/bun; \
    fi \
    && apt-get purge -y curl \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

COPY --from=jre /opt/java/openjdk /opt/java/openjdk
ENV JAVA_HOME=/opt/java/openjdk \
    PATH="/opt/java/openjdk/bin:${PATH}"

WORKDIR /app
COPY package.json tsconfig.json ./
COPY src ./src

USER bun
ENV PORT=3100 \
    WORKSPACE_ROOT=/tmp/lsp-sessions
EXPOSE 3100

HEALTHCHECK --interval=30s --timeout=5s \
    CMD bun -e "fetch('http://localhost:3100/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", "src/index.ts"]
