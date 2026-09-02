FROM node:20-alpine  AS builder

WORKDIR /usr/src/app


COPY ./ ./


RUN npm i --registry=https://registry.npmmirror.com


RUN npm run build

FROM alibaba-cloud-linux-3-registry.cn-hangzhou.cr.aliyuncs.com/alinux3/nginx_optimized

WORKDIR /usr/share/nginx/html

COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

COPY ./docker/web/static.conf /etc/nginx/default.d/

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
