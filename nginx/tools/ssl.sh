#!/bin/bash

# Get domain name from environment variable or use default
DOMAIN=${DOMAIN_NAME:-localhost}

# Generate SSL certificate with the domain name
openssl req -x509 -nodes -days 365 -newkey rsa:4096 \
    -keyout /etc/ssl/private/nginx.key \
    -out /etc/ssl/certs/nginx.crt \
    -subj "/C=MO/ST=khouribga/L=khouribga/O=transcendence/CN=${DOMAIN}"

# Replace the server_name directly
sed -i "s/server_name localhost;/server_name ${DOMAIN};/" /etc/nginx/sites-enabled/default

# Update cookie domain settings
sed -i "s/proxy_cookie_domain localhost/proxy_cookie_domain ${DOMAIN}/g" /etc/nginx/sites-enabled/default

# Start nginx
exec "$@" 