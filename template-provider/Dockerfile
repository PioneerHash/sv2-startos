# Stage 1: Build sv2-tp (Template Provider)
FROM debian:bookworm AS builder

# Install build dependencies for sv2-tp
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    libboost-dev \
    libboost-system-dev \
    libboost-filesystem-dev \
    libboost-thread-dev \
    libevent-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /build

# Copy the sv2-tp source
COPY sv2-tp ./sv2-tp

# Build sv2-tp using cmake
WORKDIR /build/sv2-tp
RUN cmake -B build && \
    cmake --build build && \
    ctest --test-dir build

# Stage 2: Create minimal runtime image
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libboost-system1.74.0 \
    libboost-filesystem1.74.0 \
    libboost-thread1.74.0 \
    libevent-2.1-7 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create app directories
RUN mkdir -p /app/data /mnt/bitcoind/ipc

# Copy the sv2-tp binary from builder
COPY --from=builder /build/sv2-tp/build/bin/sv2-tp /usr/local/bin/sv2-tp

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set working directory
WORKDIR /app

# Expose template provider port (Template Distribution Protocol)
# 8442 - Template Distribution Protocol port (for Pool connections)
EXPOSE 8442

# Entrypoint and default command (will be overridden by StartOS)
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["sv2-tp"]
