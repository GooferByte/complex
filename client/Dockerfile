FROM node:16-alpine AS builder
WORKDIR '/app'

COPY ./package.json ./
RUN npm install

COPY . .
RUN npm run builder

FROM nginx
EXPOSE 3000
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html