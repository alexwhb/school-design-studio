FROM node:20-alpine  AS builder

WORKDIR /usr/src/app

COPY ./package*.json ./

RUN npm install --registry=https://registry.npmmirror.com

COPY ./ ./

RUN npm run build && cp -r ./src/mock ./dist

FROM ghcr.io/puppeteer/puppeteer:latest

USER root

RUN mkdir -p /cache

WORKDIR /usr/src/app


COPY --from=builder /usr/src/app/dist ./

RUN npm install --registry=https://registry.npmmirror.com

RUN mkdir -p server && mv -f server.js server/index.js

EXPOSE 3000

CMD ["node", "server/index.js"]