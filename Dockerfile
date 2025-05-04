FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Clean install of dependencies
RUN npm ci

# Explicitly install express-async-handler to ensure it's available
# RUN npm install express-async-handler

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
