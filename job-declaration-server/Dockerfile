# Stage 1: Build the jd-server
FROM rust:1.89-bookworm AS builder

# Set working directory
WORKDIR /build

# Copy the sv2-apps source
COPY sv2-apps ./sv2-apps

# Build the jd-server from the workspace
WORKDIR /build/sv2-apps/pool-apps
RUN cargo build --release --package jd_server

# Stage 2: Create minimal runtime image
FROM debian:bookworm-slim

# Create app directories
RUN mkdir -p /app/config /app/data

# Copy the binary from builder
COPY --from=builder /build/sv2-apps/pool-apps/target/release/jd_server /usr/local/bin/jd_server

# Copy config examples for reference
COPY --from=builder /build/sv2-apps/pool-apps/jd-server/config-examples /app/config-examples

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
CMD ["/app/config/jds-config.toml"]
