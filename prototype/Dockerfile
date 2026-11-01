# The prototype as a static site, for looking at it without Node or docc on the host.
# Built by ../docker-compose.yml, which also hands in the documents as the `meta`
# context: the prototype reads the parent's docc.json and docs/ when it builds, the
# same as in a checkout (scripts/proto-docc.mjs walks up to the nearest docc.json).

FROM node:26-alpine@sha256:c6ad9e9c1d80f6eb607c26b4b0a132ff7a2344fad1c78ea3baa2a7d4c8de6d94 AS build

# docc builds the documentation index and docs.html. Pinned by version and checksum
# (checksums.txt of the GitHub release); bump all three together.
ARG DOCC_VERSION=v0.9.0
ARG DOCC_SHA256_AMD64=ad4fc3db566f755024d3f1b6d76ea1ba3d8d58ea18764f1e53a2f3814c3dd2e9
ARG DOCC_SHA256_ARM64=a5381fe8c6ae3f233b68a9014ddfc6b10d57428cff1f7c1c3127931a2ecf228e
ARG TARGETARCH
RUN set -eu; \
    case "$TARGETARCH" in \
      amd64) sum="$DOCC_SHA256_AMD64" ;; \
      arm64) sum="$DOCC_SHA256_ARM64" ;; \
      *) echo "no docc build for $TARGETARCH" >&2; exit 1 ;; \
    esac; \
    name="docc_${DOCC_VERSION}_linux_${TARGETARCH}"; \
    wget -q -O /tmp/docc.tar.gz "https://github.com/uxname/docc/releases/download/${DOCC_VERSION}/${name}.tar.gz"; \
    echo "$sum  /tmp/docc.tar.gz" | sha256sum -c -; \
    tar -xzf /tmp/docc.tar.gz -C /tmp; \
    install -m 0755 "/tmp/${name}/docc" /usr/local/bin/docc; \
    rm -rf /tmp/docc.tar.gz "/tmp/${name}"

# The layout of a checkout: docc.json and docs/ at the root, the prototype two levels down.
WORKDIR /work
COPY --from=meta docc.json ./
COPY --from=meta docs/src ./docs/src
COPY --from=meta docs/schemas ./docs/schemas

WORKDIR /work/protokit/prototype
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . ./
# Hash routing: the output opens from any static server, docs.html included.
RUN npm run build

FROM caddy:2-alpine@sha256:e70b164da81ef698b3ad19af799ea6086ce6d9e48ed4079eb9fe26f6fbf14ee5
COPY --from=build /work/protokit/prototype/dist /srv
EXPOSE 80
CMD ["caddy", "file-server", "--root", "/srv", "--listen", ":80"]
