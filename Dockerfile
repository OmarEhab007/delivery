FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Clean install of dependencies
RUN npm ci

# Explicitly install required packages to ensure they're available
# RUN npm install express-async-handler express-validatorn

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
