# HappyShop E-Commerce

Full-stack E-Commerce application built with Node.js, Express, SQLite, and EJS.

## Features

- User Authentication (Login/Register)
- Product Catalog (Toys, Gifts, Stationery, Plastic Goods)
- Shopping Cart & Wishlist
- Order Tracking & User Account Management
- Responsive Design (Mobile First)
- Admin capabilities (Seeding/Database)

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** SQLite3
- **Frontend:** EJS, CSS3 (Vanilla), JavaScript
- **Security:** bcrypt, express-session, dotenv

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Copy `.env.example` to `.env` (creates automatically on first run if configured, or use provided default)
   - defaults:
     ```
     PORT=3000
     SESSION_SECRET=your_secret_key
     ```

### Running the Project

- **Development:**
  ```bash
  npm run dev
  ```
- **Production:**
  ```bash
  npm start
  ```

## Deployment

### Deploying to Render (Recommended)
This application uses SQLite, which requires a persistent filesystem.

1. **Create Web Service** on Render.
2. **Connect Repo**: Select your repository.
3. **Build Command**: `npm install`
4. **Start Command**: `node server.js`
5. **Environment Variables**:
   - `NODE_ENV`: production
   - `SESSION_SECRET`: (Generate a strong random string)
6. **Persistent Disk (Critical)**:
   - Add a Disk in Render settings.
   - Mount path: `/var/data` (or similar)
   - Update `ecommerce.db` path in `server.js` to `/var/data/ecommerce.db` if using a disk, or accept that data is lost on restart without it.
   - *Note*: For a real production app, consider switching to PostgreSQL (available on Render).


**For Vercel/Netlify:**
- This app is **not** a static site. Standard static hosting won't work.
- You can deploy to Vercel using Serverless Functions, but SQLite support is limited.

## Project Structure

- `server.js`: Main application entry point
- `views/`: EJS templates for pages
- `public/` (served from root): Static assets
- `css/`: Stylesheets
- `js/`: Client-side scripts
- `ecommerce.db`: SQLite database file

