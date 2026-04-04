FROM node:18

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install
RUN npx prisma generate

COPY . .

EXPOSE 3000

LABEL maintainer="Derrick MUGISHA" \
      description="A Node.js application using Prisma ORM" \
      repository="https://github.com/Derrick-MUGISHA/E-commas-APIs"
LABEL version="1.0.0"

CMD ["npm", "start"]