# Stage 1: Build the translator
FROM rust:1.89-bookworm AS builder

# Set working directory
WORKDIR /build

# Copy the sv2-apps source
COPY sv2-apps ./sv2-apps

# Build the jd-client from the workspace
WORKDIR /build/sv2-apps/miner-apps
RUN cargo build --release --package jd_client

# Stage 2: Create minimal runtime image
FROM debian:bookworm-slim

# Create app directories
RUN mkdir -p /app/config /app/data

# Copy the binary from builder
COPY --from=builder /build/sv2-apps/miner-apps/target/release/jd_client /usr/local/bin/jd_client

# Copy config examples for reference
COPY --from=builder /build/sv2-apps/miner-apps/jd-client/config-examples /app/config-examples

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set working directory
WORKDIR /app

# Expose default ports
# 34255 - Downstream (mining devices)
EXPOSE 34255

# Entrypoint and default command (will be overridden by StartOS)
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["/app/config/jdc-config.toml"]
