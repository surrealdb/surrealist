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

COPY --from=builder /app/dist /usr/share/nginx/html
COPY ./docker/nginx/nginx.conf /etc/nginx

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]