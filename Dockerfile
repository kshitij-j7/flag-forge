FROM node:18

WORKDIR /app

COPY package*.json ./
COPY packages/ ./packages/
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]