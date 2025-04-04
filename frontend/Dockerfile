FROM node:18 as build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:18-slim

RUN npm install -g serve

WORKDIR /app

COPY --from=build /app/build .

CMD ["serve", "-s", ".", "-l", "3000"]