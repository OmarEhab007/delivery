FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Clean install of dependencies
RUN npm ci

# Explicitly install required packages to ensure they're available
# RUN npm install express-async-handler express-validatorn

COPY . .

# Set MongoDB URI for Docker environment
ENV MONGODB_URI=mongodb://mongodb:27017/delivery-app
ENV NODE_ENV=production
ENV PORT=3000
ENV JWT_SECRET=your_jwt_secret_key_here
ENV JWT_EXPIRES_IN=1d
ENV COOKIE_SECRET=your_cookie_secret_key_here

EXPOSE 3000

CMD ["npm", "start"]
