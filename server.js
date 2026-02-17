const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-Memory Database (Reset on server restart)
let users = [];
let orders = [];

// Helper: Generate a simple "token"
const generateToken = () => crypto.randomBytes(20).toString('hex');

// --- AUTH ROUTES ---

// Signup
app.post('/signup', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    if (users.find(u => u.email === email)) {
        return res.status(400).json({ message: "User already exists" });
    }

    const newUser = {
        id: crypto.randomUUID(),
        email,
        password, // In production, hash this!
        isAdmin: users.length === 0, // First user is automatically Admin
        token: generateToken()
    };

    users.push(newUser);
    const { password: _, ...userWithoutPass } = newUser;
    res.json(userWithoutPass);
});

// Login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    user.token = generateToken(); // Refresh token on login
    const { password: _, ...userWithoutPass } = user;
    res.json(userWithoutPass);
});

// --- ORDER ROUTES ---

// Create Order
app.post('/orders', (req, res) => {
    const { userId, userEmail, items, total } = req.body;
    
    const newOrder = {
        id: crypto.randomUUID(),
        userId,
        userEmail,
        items,
        total,
        status: 'pending', // Initial status
        createdAt: new Date()
    };

    orders.push(newOrder);
    res.status(201).json(newOrder);
});

// Update Order Status (Requires Admin Check)
app.patch('/orders/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const authHeader = req.headers.authorization;

    // Basic Token Auth Check
    const token = authHeader ? authHeader.split(' ')[1] : null;
    const adminUser = users.find(u => u.token === token && u.isAdmin);

    if (!adminUser) {
        return res.status(403).json({ message: "Unauthorized. Admin access required." });
    }

    const order = orders.find(o => o.id === id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    res.json(order);
});

// --- ADMIN ROUTES ---

// Get All Orders
app.get('/admin/orders', (req, res) => {
    // In a production app, you'd verify admin token here too
    res.json(orders);
});

// Get All Users
app.get('/admin/users', (req, res) => {
    const usersWithoutPass = users.map(({ password, ...u }) => u);
    res.json(usersWithoutPass);
});

// Promote User to Admin
app.post('/admin/users/:id/promote', (req, res) => {
    const { id } = req.params;
    const user = users.find(u => u.id === id);
    if (user) {
        user.isAdmin = true;
        return res.json({ message: "User promoted" });
    }
    res.status(404).json({ message: "User not found" });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Pancake Server running on http://localhost:${PORT}`);
    console.log(`First user to sign up will be the Admin.`);
});