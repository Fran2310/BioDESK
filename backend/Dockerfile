FROM node:24-alpine3.20

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

# Configurar Puppeteer
ENV PUPPETEER_CACHE_DIR=/app/.cache/puppeteer
RUN mkdir -p ${PUPPETEER_CACHE_DIR} && \
    npx puppeteer browsers install chrome

COPY . .

RUN npm run prisma:generate:system && \
    npm run prisma:generate:lab && \
    npm run build --webpack false

EXPOSE 3000