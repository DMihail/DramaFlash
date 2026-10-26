# Production web image for DramaFlash.
#
# The app uses Expo Router `web.output: "server"`. The export writes
# `dist/client` and `dist/server` with no static index.html, so this image runs
# `expo serve` instead of nginx.

FROM node:22.22.0-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ENV NODE_ENV=production
ENV APP_VARIANT=production

RUN npm run export:web


# Stage 2: Serve with Nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
