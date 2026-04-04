# 🧪 E-comus API Professional Audit Cache
Generated at: Sat Apr  4 12:05:35 PM CAT 2026

## Cluster 1: Public Interface
### Health Check
**Endpoint**: `GET /health`
**Response**:
```json
```
---
### List Categories
**Endpoint**: `GET /api/categories`
**Response**:
```json
```
---
### Fetch Single Product
**Endpoint**: `GET /api/public/products?limit=1`
**Response**:
```json
```
---
## Cluster 2: Identity & Admin Actions
### Create Category (Admin)
**Endpoint**: `POST /api/categories`
**Response**:
```json
```
---
## Cluster 3: User Flow
### Access Profile (User)
**Endpoint**: `GET /api/auth/users/me`
**Response**:
```json
```
---
### Direct Buy (Stock Failure Check)
**Endpoint**: `POST /api/auth/orders/buy`
**Response**:
```json
```
---
