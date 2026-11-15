# Shelfwise - Retail Inventory and Order Management

React + Node.js/Express + MongoDB (Mongoose). One deployable app: Express serves the built React site.

## Features
- Admin login (JWT, bcrypt-hashed password)
- Dashboard: revenue, 7-day sales chart, pending orders, stock value, low-stock alerts, top sellers, recent orders
- Products: add, edit, delete, search, SKU, reorder level, supplier link, stock adjustment with reason
- Orders: multi-item orders, live total, automatic stock deduction, deliver / cancel (cancel restores stock), printable invoice
- Customers and Suppliers: full CRUD with validation
- Stock log: every stock movement recorded with the running balance
- Referential integrity: records used elsewhere cannot be deleted

## Run locally
1. Create a free cluster on MongoDB Atlas, a database user, allow your IP, copy the connection string.
2. Copy backend/.env.example to backend/.env and fill in MONGODB_URI and JWT_SECRET.
3. Terminal 1: cd backend && npm install && npm start
4. Terminal 2: cd frontend && npm install && npm run dev
5. Open http://localhost:5173 and sign in with ADMIN_EMAIL / ADMIN_PASSWORD (default admin@retail.com / admin123).

On the first start the admin user and demo data are created automatically. Set SEED_DEMO=false to skip the demo data.

## Deploy on Render (free)
1. Push this folder to a GitHub repository.
2. In MongoDB Atlas: Network Access, add 0.0.0.0/0. Database Access, create a user.
3. On Render: New, Blueprint, pick the repository (render.yaml is included). Or create a Web Service with build command `npm run build` and start command `npm start`.
4. Set environment variables: MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD (JWT_SECRET is generated).
5. Open the Render URL and sign in.

## API (all routes except login need the Authorization: Bearer token header)
POST /api/auth/login
GET POST /api/products, PUT DELETE /api/products/:id, POST /api/products/:id/stock
GET POST /api/suppliers, PUT DELETE /api/suppliers/:id
GET POST /api/customers, PUT DELETE /api/customers/:id
GET POST /api/orders, PUT /api/orders/:id/status
GET /api/stock-logs
GET /api/dashboard
