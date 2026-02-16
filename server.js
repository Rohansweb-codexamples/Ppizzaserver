const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'db.json');

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Data File if it doesn't exist
const initDB = () => {
    if (!fs.existsSync(DATA_FILE)) {
        const initialData = {
            users: [],
            orders: [],
            rewards: []
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
    }
};

// Helper to read/write data
const readData = () => {
    try {
        const content = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(content);
    } catch (err) {
        return { users: [], orders: [], rewards: [] };
    }
};

const saveData = (data) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// --- ROUTES ---

// 1. Sign Up
app.post('/signup', (req, res) => {
    const { email, password } = req.body;
    const data = readData();
    
    if (data.users.find(u => u.email === email)) {
        return res.status(400).json({ message: "User already exists" });
    }

    const newUser = { 
        id: Date.now().toString(), 
        email: email, 
        password: password 
    };
    
    data.users.push(newUser);
    saveData(data);
    res.status(201).json({ message: "User created", user: { email: newUser.email, id: newUser.id } });
});

// 2. Login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    // Hardcoded Admin Check
    if (email === "rohanwest20@gmail.com" && password === "Ewanandlam100") {
        return res.json({ email, id: "admin-1", isAdmin: true });
    }

    const data = readData();
    const user = data.users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
    }
    res.json({ email: user.email, id: user.id, isAdmin: false });
});

// 3. Orders - Save new order
app.post('/orders', (req, res) => {
    const order = req.body;
    const data = readData();
    
    // Add unique ID if not present
    if (!order.id) order.id = "ORD-" + Date.now();
    
    data.orders.push(order);
    saveData(data);
    res.status(201).json(order);
});

// 4. Orders - Admin get all
app.get('/admin/orders', (req, res) => {
    const data = readData();
    res.json(data.orders || []);
});

// 5. Rewards - Save new reward
app.post('/rewards', (req, res) => {
    const reward = req.body; 
    const data = readData();
    data.rewards.push(reward);
    saveData(data);
    res.status(201).json(reward);
});

// 6. Rewards - Get user rewards
app.get('/rewards/:userId', (req, res) => {
    const { userId } = req.params;
    const data = readData();
    const userRewards = data.rewards.filter(r => r.userId === userId);
    res.json(userRewards);
});

// 7. Rewards - Admin get all
app.get('/admin/rewards', (req, res) => {
    const data = readData();
    res.json(data.rewards);
});

// 8. Rewards - Redeem
app.patch('/rewards/:rewardId', (req, res) => {
    const { rewardId } = req.params;
    const { status } = req.body;
    const data = readData();
    const idx = data.rewards.findIndex(r => r.id === rewardId);
    
    if (idx !== -1) {
        data.rewards[idx].status = status;
        saveData(data);
        return res.json(data.rewards[idx]);
    }
    res.status(404).json({ message: "Reward not found" });
});

// Start Server
app.listen(PORT, () => {
    initDB();
    console.log(`Server running on port ${PORT}`);
});