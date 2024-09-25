# build app with node
FROM node:latest as builder

RUN npm i -g pnpm

WORKDIR /app

COPY package.json .
COPY patches patches
COPY pnpm-lock.yaml .

RUN pnpm install

COPY . .
RUN npm run build:embedded

# set up production image (static assets served by nginx)
FROM nginx:stable-alpine

WORKDIR /usr/share/nginx/

RUN rm -rf html
RUN mkdir html

WORKDIR /

COPY --from=builder /app/dist /usr/share/nginx/html
COPY ./nginx/nginx.conf /etc/nginx

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]