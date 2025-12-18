const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
// app.use('/css', express.static(path.join(__dirname, 'public/css'))); // Optional explicit route
// app.use('/js', express.static(path.join(__dirname, 'public/js'))); // Optional explicit route

// Session middleware
// Session middleware
const sessionSecret = process.env.SESSION_SECRET || 'happyshop-secret-key-2024';
if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
    console.warn('⚠️  WARNING: No SESSION_SECRET found. Using default unsafe secret. Please set it in environment variables.');
}

app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    } // 24 hours
}));

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Database Setup
const dbPath = path.join(__dirname, "ecommerce.db");

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Database connection error:", err.message);
    } else {
        console.log("Connected to SQLite database");
        initDatabase();
    }
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Closed the database connection.');
        process.exit(0);
    });
});

function initDatabase() {
    // Products table
    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        image TEXT,
        description TEXT,
        rating REAL DEFAULT 4.5,
        stock INTEGER DEFAULT 100,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Orders table
    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        order_number TEXT UNIQUE NOT NULL,
        total REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        shipping_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Order items table
    db.run(`CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        product_id INTEGER,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
    )`);

    // Contact messages table
    db.run(`CREATE TABLE IF NOT EXISTS contact_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'new',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Newsletter subscribers table
    db.run(`CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Wishlist table
    db.run(`CREATE TABLE IF NOT EXISTS wishlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        product_id INTEGER,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
    )`);

    // Seed products if empty
    db.get("SELECT count(*) as count FROM products", (err, row) => {
        if (row.count === 0) {
            console.log("Seeding products...");
            const products = [
                { name: "Colorful Building Blocks", category: "Toys", price: 25.00, image: "https://images.unsplash.com/photo-1587654780291-39c940483719?auto=format&fit=crop&w=500&q=60", description: "Set of 100 vibrant plastic building blocks for endless creativity. Perfect for developing motor skills and imagination.", rating: 4.5, stock: 50 },
                { name: "Plush Teddy Bear", category: "Toys", price: 15.50, image: "https://images.unsplash.com/photo-1559454403-b8fb87521bc7?auto=format&fit=crop&w=500&q=60", description: "Soft and cuddly teddy bear, perfect for hugs. Made with hypoallergenic materials.", rating: 4.8, stock: 75 },
                { name: "Luxury Fountain Pen", category: "Stationery", price: 45.00, image: "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?auto=format&fit=crop&w=500&q=60", description: "Elegant fountain pen for smooth writing. Premium metal construction with refillable ink cartridge.", rating: 4.7, stock: 30 },
                { name: "Spiral Notebook Set", category: "Stationery", price: 12.00, image: "https://images.unsplash.com/photo-1531346878377-a513bc951a46?auto=format&fit=crop&w=500&q=60", description: "Pack of 3 colorful spiral notebooks. 200 pages each with quality paper.", rating: 4.2, stock: 100 },
                { name: "Plastic Storage Containers", category: "Plastic Goods", price: 30.00, image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=500&q=60", description: "Durable and stackable storage containers for your kitchen. BPA-free and dishwasher safe.", rating: 4.6, stock: 60 },
                { name: "Birthday Gift Box", category: "Gifts", price: 20.00, image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=500&q=60", description: "Beautifully wrapped gift box with assorted surprises. Perfect for any celebration.", rating: 4.9, stock: 40 },
                { name: "Water Bottle", category: "Plastic Goods", price: 8.00, image: "https://images.unsplash.com/photo-1602143407151-11115cdbf69c?auto=format&fit=crop&w=500&q=60", description: "Eco-friendly reusable plastic water bottle. 1L capacity with leak-proof cap.", rating: 4.3, stock: 150 },
                { name: "Remote Control Car", category: "Toys", price: 55.00, image: "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=500&q=60", description: "High-speed remote control car with rechargeable battery. Reaches speeds up to 20mph.", rating: 4.8, stock: 25 },
                { name: "Art Supply Kit", category: "Stationery", price: 35.00, image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=500&q=60", description: "Complete art supply kit with pencils, markers, and sketchpad.", rating: 4.6, stock: 45 },
                { name: "Puzzle Game Set", category: "Toys", price: 18.00, image: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=500&q=60", description: "Educational puzzle game set for ages 5+. Develops problem-solving skills.", rating: 4.4, stock: 80 },
                { name: "Gift Card Holder", category: "Gifts", price: 5.00, image: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=500&q=60", description: "Elegant gift card holder with envelope. Perfect for any occasion.", rating: 4.1, stock: 200 },
                { name: "Kitchen Organizer Set", category: "Plastic Goods", price: 22.00, image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=500&q=60", description: "Complete kitchen organizer set with multiple compartments.", rating: 4.5, stock: 55 }
            ];

            const insert = db.prepare("INSERT INTO products (name, category, price, image, description, rating, stock) VALUES (?, ?, ?, ?, ?, ?, ?)");
            products.forEach(product => {
                insert.run(product.name, product.category, product.price, product.image, product.description, product.rating, product.stock);
            });
            insert.finalize();
            console.log("Products seeded successfully.");
        }
    });
}

// Authentication middleware
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Page Routes
app.get('/', (req, res) => {
    res.render('index', {
        user: req.session.user || null,
        title: 'Home',
        page: 'home'
    });
});

app.get('/toys', (req, res) => {
    res.render('category', {
        category: 'Toys',
        heroTitle: 'World of Toys',
        heroDescription: 'Explore our vast collection of educational and fun toys for children of all ages.',
        heroImage: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=1920&q=80',
        heroImage: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=1920&q=80',
        filterOptions: ['Educational', 'Outdoor'],
        user: req.session.user || null,
        title: 'Toys',
        page: 'toys'
    });
});

app.get('/gifts', (req, res) => {
    res.render('category', {
        category: 'Gifts',
        heroTitle: 'Perfect Gifts',
        heroDescription: 'Find the perfect present for your loved ones.',
        heroImage: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=1920&q=80',
        heroImage: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=1920&q=80',
        filterOptions: ['For Him', 'For Her'],
        user: req.session.user || null,
        title: 'Gifts',
        page: 'gifts'
    });
});

app.get('/stationery', (req, res) => {
    res.render('category', {
        category: 'Stationery',
        heroTitle: 'Premium Stationery',
        heroDescription: 'Elevate your workspace with our curated collection.',
        heroImage: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a6?auto=format&fit=crop&w=1920&q=80',
        heroImage: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a6?auto=format&fit=crop&w=1920&q=80',
        filterOptions: ['Office', 'School'],
        user: req.session.user || null,
        title: 'Stationery',
        page: 'stationery'
    });
});

app.get('/plastic', (req, res) => {
    res.render('category', {
        category: 'Plastic Goods',
        heroTitle: 'Durable Plastic Goods',
        heroDescription: 'High-quality, long-lasting essentials for your home.',
        heroImage: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=1920&q=80',
        heroImage: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=1920&q=80',
        filterOptions: ['Kitchen', 'Storage'],
        user: req.session.user || null,
        title: 'Plastic Goods',
        page: 'plastic'
    });
});

app.get('/product', (req, res) => {
    res.render('product', {
        user: req.session.user || null,
        title: 'Products',
        page: 'product'
    });
});

app.get('/wishlist', (req, res) => {
    res.render('wishlist', {
        user: req.session.user || null,
        title: 'Wishlist',
        page: 'wishlist'
    });
});

app.get('/checkout', (req, res) => {
    res.render('checkout', {
        user: req.session.user || null,
        title: 'Checkout',
        page: 'checkout'
    });
});

app.get('/about', (req, res) => {
    res.render('about', {
        user: req.session.user || null,
        title: 'About Us',
        page: 'about'
    });
});

app.get('/contact', (req, res) => {
    res.render('contact', {
        user: req.session.user || null,
        title: 'Contact Us',
        page: 'contact'
    });
});

app.get('/track-order', (req, res) => {
    res.render('track-order', {
        user: req.session.user || null,
        title: 'Track Order',
        page: 'track-order'
    });
});

app.get('/help', (req, res) => {
    res.render('help', {
        user: req.session.user || null,
        title: 'Help Center',
        page: 'help'
    });
});

app.get('/account', isAuthenticated, (req, res) => {
    // Get user's orders
    db.all(`
        SELECT o.*, 
               GROUP_CONCAT(p.name || ' (x' || oi.quantity || ')') as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.user_id = ?
        GROUP BY o.id
        ORDER BY o.created_at DESC
    `, [req.session.userId], (err, orders) => {
        res.render('account', {
            user: req.session.user,
            orders: orders || [],
            title: 'My Account',
            page: 'account'
        });
    });
});

app.get('/login', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/account');
    }
    res.render('login', { error: null, user: null, title: 'Login', page: 'login' });
});

app.get('/register', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/account');
    }
    res.render('register', { error: null, user: null, title: 'Register', page: 'register' });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// API Routes - Products
app.get('/api/products', (req, res) => {
    const category = req.query.category;
    let sql = "SELECT * FROM products";
    let params = [];

    if (category) {
        sql += " WHERE category = ?";
        params.push(category);
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

app.get('/api/products/:id', (req, res) => {
    const sql = "SELECT * FROM products WHERE id = ?";
    const params = [req.params.id];
    db.get(sql, params, (err, row) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": row
        });
    });
});

// API Routes - Authentication
app.post('/api/register', async (req, res) => {
    const { firstName, lastName, email, password, phone } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(`INSERT INTO users (first_name, last_name, email, password, phone) VALUES (?, ?, ?, ?, ?)`,
            [firstName, lastName, email, hashedPassword, phone],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE')) {
                        return res.status(400).json({ error: 'Email already exists' });
                    }
                    return res.status(500).json({ error: err.message });
                }

                req.session.userId = this.lastID;
                req.session.user = { id: this.lastID, firstName, lastName, email };

                res.json({
                    message: 'Registration successful',
                    redirect: '/account'
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Server error' });
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        req.session.userId = user.id;
        req.session.user = {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email
        };

        res.json({
            message: 'Login successful',
            redirect: '/account'
        });
    });
});

// API Routes - Orders
app.post('/api/orders', (req, res) => {
    const { items, total, shippingAddress, userInfo } = req.body;
    const userId = req.session.userId || null;
    const orderNumber = 'ORD-' + Date.now();

    db.run(`INSERT INTO orders (user_id, order_number, total, status, shipping_address) VALUES (?, ?, ?, ?, ?)`,
        [userId, orderNumber, total, 'pending', JSON.stringify(shippingAddress)],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            const orderId = this.lastID;
            const stmt = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');

            items.forEach(item => {
                stmt.run(orderId, item.id, item.quantity, item.price);
            });

            stmt.finalize();

            res.json({
                message: 'Order placed successfully',
                orderNumber: orderNumber,
                orderId: orderId
            });
        }
    );
});

app.get('/api/orders/:orderNumber', (req, res) => {
    db.get(`
        SELECT o.*, 
               json_group_array(json_object('name', p.name, 'quantity', oi.quantity, 'price', oi.price, 'image', p.image)) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.order_number = ?
        GROUP BY o.id
    `, [req.params.orderNumber], (err, order) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        order.items = JSON.parse(order.items);
        order.shipping_address = JSON.parse(order.shipping_address);

        res.json({
            message: 'success',
            data: order
        });
    });
});

// API Routes - Contact
app.post('/api/contact', (req, res) => {
    const { name, email, message } = req.body;

    db.run('INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)',
        [name, email, message],
        (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Message received successfully! We\'ll get back to you soon.' });
        }
    );
});

// API Routes - Newsletter
app.post('/api/newsletter', (req, res) => {
    const { email } = req.body;

    db.run('INSERT INTO newsletter_subscribers (email) VALUES (?)', [email], (err) => {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'Email already subscribed' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Successfully subscribed to newsletter!' });
    });
});

// Start Server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
