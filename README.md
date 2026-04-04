# 🛍️ Ecomus Professional E-Commerce API

A professional-grade, production-ready REST API built with **Express.js**, **Prisma**, and **MongoDB**. This backend features robust identity management, dynamic categorization, atomic stock-aware ordering, and Cloudinary image integration.

---

## 🚀 Key Features

- 🔐 **Identity Management**: JWT-based Auth with **User**, **Seller**, and **Admin** roles.
- 📂 **Categorization**: Dynamic, relational category management (CRUD).
- 🛍️ **Product Engine**: Multi-variant products with embedded images and relational mapping.
- ☁️ **Media Hosting**: Automated image optimization and hosting via **Cloudinary**.
- 🛒 **Inventory Guard**: Atomic stock validation and deduction during purchase.
- 📦 **Order Lifecycle**: Direct "Buy Now" flow and traditional Cart-to-Order conversion.
- 📜 **Audit Logs**: Professional administrative logging for all critical data modifications.
- 📖 **Interactive Docs**: Full **Swagger UI** integration for rapid development.

---

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js (v5)
- **Database**: MongoDB (Atlas)
- **ORM**: Prisma
- **Validation**: Zod
- **Security**: Helmet, CORS, BcryptJS, JWT
- **Media**: Cloudinary + Multer

---

## ⚙️ Initial Setup

### 1. Environment Configuration
Create a `.env` file in the root directory:
```env
PORT=3000
DATABASE_URL="mongodb+srv://..."
JWT_SECRET="your_secure_secret"

# Cloudinary Integration
CLOUDINARY_CLOUD_NAME="your_name"
CLOUDINARY_API_KEY="your_key"
CLOUDINARY_API_SECRET="your_secret"
```

### 2. Dependency Installation
```bash
npm install
npx prisma generate
```

### 3. Database Sync & Seeding
This will reset your database and populate it with 50 professional template products across 5 categories.
```bash
npx prisma db push --force-reset
node prisma/seed.js
```

### 4. Start the Server
```bash
node server.js
```
- **API Docs**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **Health Check**: [http://localhost:3000/health](http://localhost:3000/health)

---

## 🧪 Testing the API

For a comprehensive, step-by-step guide on how to test every single endpoint (including user registration, cart management, and order fulfillment), please refer to the **[Step-by-Step Testing Guide](./api_testing_step_by_step.md)**.

---

## 📂 Folder Structure

```text
├── prisma/               # Prisma Schema & Seed Script
├── src/
│   ├── config/           # DB, Swagger, & External Services
│   ├── controller/       # Business Logic
│   ├── middleware/       # Auth, Upload, & Error Handling
│   ├── routes/           # API Endpoint Definitions
│   ├── utils/            # Shared Utilities (Logger, Response)
│   └── validations/      # Zod Schemas
├── server.js             # Entry Point
└── package.json          # Dependencies & Scripts
```

---

## ⚖️ License
ISC License. Built with ❤️ by Antigravity.
