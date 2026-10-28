# The prototype as a static site, for looking at it without Node or docc on the host.
# Built by ../docker-compose.yml, which also hands in the documents as the `meta`
# context: the prototype reads the parent's docc.json and docs/ when it builds, the
# same as in a checkout (scripts/proto-docc.mjs walks up to the nearest docc.json).

FROM node:24-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1 AS build

# docc builds the documentation index and docs.html. Pinned by version and checksum
# (checksums.txt of the GitHub release); bump all three together.
ARG DOCC_VERSION=v0.8.0
ARG DOCC_SHA256_AMD64=55b96849ec0dc712c3a243bbcde0fe824cdfe48a2ca77362a03d7a704154c687
ARG DOCC_SHA256_ARM64=c6fa21bf247ae5e639e43c43cd441bb4460164e091dc4dcfbbe28a308aa7e0b3
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

FROM caddy:2-alpine@sha256:de23def33b17fb5d1290b0f6c2add1d70780e52341896c00a4c8a2a2fe9d355e
COPY --from=build /work/protokit/prototype/dist /srv
EXPOSE 80
CMD ["caddy", "file-server", "--root", "/srv", "--listen", ":80"]
