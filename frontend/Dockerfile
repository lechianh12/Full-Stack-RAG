# ── Stage 1: Build React ──────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --silent

COPY . .

# API_URL dùng đường dẫn tương đối → nginx sẽ proxy /api → backend
ARG REACT_APP_API_URL=/api
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

# ── Stage 2: Serve với Nginx ─────────────────────────────
FROM nginx:1.27-alpine

# Copy file build
COPY --from=builder /app/build /usr/share/nginx/html

# nginx config: SPA routing + proxy /api → backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
