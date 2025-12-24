const express = require('express');
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

// Session middleware
const sessionSecret = process.env.SESSION_SECRET || 'happyshop-secret-key-2024';
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

// MOCK DATA
const MOCK_PRODUCTS = [
    { id: 1, name: 'Educational Toy Block Set', category: 'Toys', price: 29.99, image: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=800&q=80', description: 'A fun and educational block set for kids.' },
    { id: 2, name: 'Outdoor Adventure Kit', category: 'Toys', price: 45.00, image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80', description: 'Everything needed for a backyard adventure.' },
    { id: 3, name: 'Premium Fountain Pen', category: 'Gifts', price: 89.99, image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=800&q=80', description: 'Elegant writing instrument for professionals.' },
    { id: 4, name: 'Luxury Scented Candle', category: 'Gifts', price: 25.50, image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80', description: 'Relaxing lavender scent.' },
    { id: 5, name: 'Leather Notebook', category: 'Stationery', price: 35.00, image: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a6?auto=format&fit=crop&w=800&q=80', description: 'High-quality leather bound notebook.' },
    { id: 6, name: 'Desk Organizer', category: 'Stationery', price: 19.99, image: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a6?auto=format&fit=crop&w=800&q=80', description: 'Keep your workspace tidy.' },
    { id: 7, name: 'Durable Storage Bin', category: 'Plastic Goods', price: 15.00, image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80', description: 'Heavy-duty storage solution.' },
    { id: 8, name: 'Kitchen Container Set', category: 'Plastic Goods', price: 40.00, image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80', description: 'Airtight containers for food freshness.' }
];

// Authentication middleware (simplified for mock)
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
    // Return empty or dummy orders
    res.render('account', {
        user: req.session.user,
        orders: [],
        title: 'My Account',
        page: 'account'
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
    let products = MOCK_PRODUCTS;

    if (category) {
        products = products.filter(p => p.category === category);
    }

    res.json({
        "message": "success",
        "data": products
    });
});

app.get('/api/products/:id', (req, res) => {
    const product = MOCK_PRODUCTS.find(p => p.id == req.params.id);
    if (!product) {
        res.status(404).json({ "error": "Product not found" });
        return;
    }
    res.json({
        "message": "success",
        "data": product
    });
});

// API Routes - Authentication
app.post('/api/register', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    // Fake registration
    const fakeId = Date.now();
    req.session.userId = fakeId;
    req.session.user = { id: fakeId, firstName, lastName, email };

    res.json({
        message: 'Registration successful',
        redirect: '/account'
    });
});

app.post('/api/login', (req, res) => {
    const { email } = req.body;
    // Fake login - accept any credentials

    const fakeUser = {
        id: 123,
        firstName: 'Demo',
        lastName: 'User',
        email: email
    };

    req.session.userId = fakeUser.id;
    req.session.user = fakeUser;

    res.json({
        message: 'Login successful',
        redirect: '/account'
    });
});

// API Routes - Orders
app.post('/api/orders', (req, res) => {
    const { items, total, shippingAddress } = req.body;
    const orderNumber = 'ORD-' + Date.now();

    // Mock successful order
    res.json({
        message: 'Order placed successfully (Mock)',
        orderNumber: orderNumber,
        orderId: 999
    });
});

app.get('/api/orders/:orderNumber', (req, res) => {
    // Mock order details
    const order = {
        order_number: req.params.orderNumber,
        status: 'pending',
        total: 100.00,
        shipping_address: { address: 'Mock Address' },
        items: []
    };

    res.json({
        message: 'success',
        data: order
    });
});

// API Routes - Contact
app.post('/api/contact', (req, res) => {
    res.json({ message: 'Message received successfully! We\'ll get back to you soon.' });
});

// API Routes - Newsletter
app.post('/api/newsletter', (req, res) => {
    res.json({ message: 'Successfully subscribed to newsletter!' });
});

// Start Server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
