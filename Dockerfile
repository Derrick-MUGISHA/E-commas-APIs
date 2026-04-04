# Base image: Node.js 18 on Alpine Linux for a small footprint
FROM node:18-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package management files to leverage layer caching
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and produce Prisma engines
RUN npm install
RUN npx prisma generate

# Copy the rest of the application source code
COPY . .

# Expose the API port
EXPOSE 3000

# Metadata
LABEL maintainer="Antigravity Dev Team"
LABEL version="1.0.0"

# Main entry point for the container
CMD ["npm", "start"]
