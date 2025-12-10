# build app with bun
FROM oven/bun:latest AS builder

WORKDIR /app

COPY ../package.json .
COPY ../patches patches
COPY ../bun.lock .

RUN bun install

COPY .. .
ENV VITE_SURREALIST_DOCKER=true
RUN bun run build

# set up production image (static assets served by nginx)
FROM nginx:1.28.0-alpine3.21-slim

WORKDIR /usr/share/nginx/

RUN rm -rf html
RUN mkdir html

WORKDIR /

RUN rm /etc/nginx/conf.d/default.conf
RUN addgroup -S surrealist && adduser -S -D -H -s /sbin/nologin -G surrealist surrealist
RUN mkdir -p /var/cache/nginx /var/run/nginx /var/log/nginx \
    && chown -R surrealist:surrealist /var/cache/nginx /var/run/nginx /var/log/nginx

COPY --from=builder /app/dist /usr/share/nginx/html
COPY ./docker/nginx/nginx.conf /etc/nginx
RUN chown -R surrealist:surrealist /usr/share/nginx/html /etc/nginx

USER surrealist

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
