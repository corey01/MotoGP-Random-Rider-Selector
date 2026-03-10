FROM node:22-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_URL
ARG NEXT_PUBLIC_RACECAL_URL
ENV NEXT_PUBLIC_URL=$NEXT_PUBLIC_URL
ENV NEXT_PUBLIC_RACECAL_URL=$NEXT_PUBLIC_RACECAL_URL

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
