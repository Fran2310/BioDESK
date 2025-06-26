FROM node:24-alpine3.20

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --production && npm install -g @nestjs/cli

COPY . .

RUN npm run prisma:generate:system && npm run prisma:generate:lab && npm run build --webpack false && npm prune --production && rm -rf /root/.npm /root/.cache

EXPOSE 3000