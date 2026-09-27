# LSP gateway with its language servers: jdtls (Java), pyright (Python),
# clangd (C/C++). Build from this directory:
#   docker build -t lsp-gateway .

# Recent jdtls releases need Java 21 to run (they can still target older Java).
FROM eclipse-temurin:21-jre AS jre

FROM oven/bun:1-debian

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
    && tar -xzf "/tmp/${JDTLS_TAR}" -C /opt/jdtls \
    && rm "/tmp/${JDTLS_TAR}" \
    && ln -s /opt/jdtls/bin/jdtls /usr/local/bin/jdtls \
    # jdtls writes to its configuration area inside the install directory.
    && chown -R bun:bun /opt/jdtls \
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
