FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy Prisma schema and config
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Expose the API port
EXPOSE 3000

# Set environment variables (these should ideally be passed in docker-compose or run command)
ENV NODE_ENV=production

# Start the application
CMD ["node", "server.js"]
