# 🧪 API Testing Guide: Step-by-Step

This document provides a systematic walkthrough to test the **E-comus Professional API** from a clean slate. Use it with **Swagger UI** ([http://localhost:3000/api-docs](http://localhost:3000/api-docs)) or **Postman**.

---

## 🚦 Phase 1: Initial Health & Public Data
Before logging in, verify that the system is alive and the database seed worked.

| Step | Endpoint | Action | Expected Result |
| :--- | :--- | :--- | :--- |
| 1 | `GET /health` | Check heartbeat | `{ "status": "ok", ... }` |
| 2 | `GET /api/public/products` | View all items | List of 50 products grouped by price |
| 3 | `GET /api/categories` | View categories | List of categories (Electronics, Fashion, etc.) |
| 4 | `GET /api/public/products/category/{id}` | Filter by id | Only products from that category |

---

## 🔐 Phase 2: Identity Management
Register a new account and obtain your identity token.

### 1. Register a User
- **POST** `/api/auth/users/register`
- **Body**: 
```json
{
  "email": "test@user.com", // [Required]
  "password": "password123", // [Required]
  "role": "USER" // [Optional] - USER or SELLER
}
```

### 2. Login & Token Retrieval
- **POST** `/api/auth/users/login`
- **Body**: 
```json
{
  "email": "test@user.com", // [Required]
  "password": "password123" // [Required]
}
```
- **Result**: You will receive a `token`. **Copy this token** for all subsequent steps.

---

## 🛒 Phase 3: The Shopping Experience
Testing the authenticated cart operations.

### 1. Add to Cart
- **POST** `/api/auth/cart/items`
- **Body**: 
```json
{
  "productId": "60d5ec49f1b2c8a1234567ab", // [Required]
  "variantId": "60d5ec49f1b2c8a1234567cd", // [Required]
  "quantity": 2 // [Required]
}
```

### 2. Update Quantity
- **PATCH** `/api/auth/cart/items/{itemId}`
- **Body**: 
```json
{
  "quantity": 5 // [Required]
}
```

---

## 📦 Phase 4: Ordering & Stock Management
Testing direct purchases and cart fulfillment.

### 🚀 Direct Buy (Fast Track)
- **POST** `/api/auth/orders/buy`
- **Body**: 
```json
{
  "productId": "60d5ec49f1b2c8a1234567ab", // [Required]
  "variantId": "60d5ec49f1b2c8a1234567cd", // [Optional]
  "quantity": 1 // [Required]
}
```

---

## 🔧 Phase 5: Administrative Control (Management Only)

### 1. Manage Categories
- **POST** `/api/categories`
- **Body**: 
```json
{
  "name": "GAMING", // [Required]
  "description": "Consoles and PC hardware" // [Optional]
}
```

### 2. Manage Inventory (Product CRUD)
- **POST** `/api/admin/products`
- **Body**: 
```json
{
  "name": "PS5 Pro", // [Required]
  "description": "Ultimate gaming console", // [Optional]
  "categoryId": "60d5ec49f1b2c8a1234567ab", // [Required]
  "brand": "Sony", // [Optional]
  "price": 699.99, // [Required]
  "stock": 50, // [Required]
  "variants": [], // [Optional]
  "images": [] // [Optional]
}
```

- **PATCH** `/api/admin/products/{id}`
- **Body**: 
```json
{
  "price": 749.99, // [Optional]
  "stock": 45 // [Optional]
}
```

### 3. Fulfill Orders
- **PATCH** `/api/auth/orders/{id}/status`
- **Body**: 
```json
{
  "status": "SHIPPED" // [Required] - PENDING, PAID, SHIPPED, DELIVERED, CANCELLED
}
```

---

> [!TIP]
> Use the **[Swagger Documentation](http://localhost:3000/api-docs)** to try out these requests interactively without writing a single line of code!
