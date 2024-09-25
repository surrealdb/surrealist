# build app with node
FROM node:latest as builder

RUN npm i -g pnpm

WORKDIR /app

COPY package.json .
COPY pnpn-lock.yaml .

RUN pnpm install

COPY . .
RUN npm run build:embedded

# set up production image (static assets served by nginx)
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]