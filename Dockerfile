# Use the official Nginx Alpine image as the base
FROM alpine:3.18

# Install build dependencies, Nginx and Nginx development packages
# (These will be removed later to keep the image small)
RUN apk add --no-cache \
    nginx \
    nginx-mod-http-brotli \
    # Build dependencies for Brotli module if needed, although Nginx module is often pre-built in Alpine
    # If the above line doesn't work, you'd typically need:
    # build-base \
    # pcre-dev \
    # zlib-dev \
    # openssl-dev \
    # linux-headers \
    # curl \
    # git \
    # autoconf \
    # automake \
    # libtool \
    # make \
    # gcc \
    # g++ \
    # For a custom build of nginx with brotli from source, you would typically:
    # 1. Download nginx source
    # 2. Download brotli source (google/ngx_brotli)
    # 3. Configure nginx with --add-module pointing to the brotli module
    # 4. make && make install

# Ensure Nginx's default configuration directory exists
RUN mkdir -p /etc/nginx/conf.d

# Remove default Nginx configuration
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy your custom Nginx configuration file
COPY nginx.conf /etc/nginx/nginx.conf

# Copy your application's static files (assuming they are built into a 'dist' directory)
# Adjust this path based on your project's build output
COPY dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Run Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
