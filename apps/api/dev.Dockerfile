FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
COPY .yarn .yarn
COPY .yarnrc.yml ./
RUN corepack enable && corepack prepare yarn@3.6.1 --activate
RUN yarn install

# Copy source code
COPY . .

# Install dev tools like ts-node-dev or nodemon
RUN yarn add --dev ts-node-dev

CMD ["yarn", "dev"]
