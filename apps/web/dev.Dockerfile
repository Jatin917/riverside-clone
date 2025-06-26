FROM node:18-alpine

WORKDIR /app

COPY . .

RUN corepack enable && corepack prepare yarn@3.6.1 --activate
RUN yarn install

WORKDIR /app/apps/web

CMD ["yarn", "dev"]
