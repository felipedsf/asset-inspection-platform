FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

# Seed the database and start the server
CMD ["sh", "-c", "npm run seed && npm start"]
