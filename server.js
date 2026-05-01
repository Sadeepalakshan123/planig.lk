const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const Stripe = require('stripe');

// Initialize Stripe with a test key (User needs to replace with their real key)
const stripe = Stripe('sk_test_51MockStripeKey1234567890');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

const dataFilePath = path.join(__dirname, 'data.json');

// Helper to read data
function readData() {
    if (!fs.existsSync(dataFilePath)) {
        const defaultData = {
            orders: [],
            content: {
                heroTitle: "Design Your <span>Dream Home</span> Today",
                heroSubtitle: "Explore our highly curated collection of modern, luxurious, and minimalistic architectural plans. Ready to build.",
                contactEmail: "info@planing.lk",
                phoneNumber: "+94 77 123 4567"
            }
        };
        fs.writeFileSync(dataFilePath, JSON.stringify(defaultData, null, 2));
    }
    const data = JSON.parse(fs.readFileSync(dataFilePath));
    if (!data.content) {
        data.content = {
            heroTitle: "Design Your <span>Dream Home</span> Today",
            heroSubtitle: "Explore our highly curated collection of modern, luxurious, and minimalistic architectural plans. Ready to build.",
            contactEmail: "info@planing.lk",
            phoneNumber: "+94 77 123 4567"
        };
    }
    return data;
}

// Helper to write data
function writeData(data) {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

// ---------------------------
// Payment Endpoint (Visa/Mastercard)
// ---------------------------
app.post('/create-checkout-session', async (req, res) => {
    try {
        const { planName, price, customerName, customerEmail } = req.body;
        const currentData = readData();
        currentData.orders.push({
            id: Date.now().toString(),
            date: new Date().toISOString(),
            planName,
            price,
            customerName,
            customerEmail,
            status: 'Paid'
        });
        writeData(currentData);
        res.json({ success: true, url: '/success.html' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ---------------------------
// CMS / Site Content Endpoints
// ---------------------------
app.get('/api/content', (req, res) => {
    const data = readData();
    res.json(data.content);
});

app.post('/api/admin/content', (req, res) => {
    const { token, content } = req.body;
    if (token !== 'secure-token-xyz') return res.status(401).json({ error: 'Unauthorized' });
    
    const data = readData();
    data.content = { ...data.content, ...content };
    writeData(data);
    res.json({ success: true });
});

// ---------------------------
// Admin Endpoints & Analytics
// ---------------------------
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === 'admin123') { // Hardcoded password
        res.json({ success: true, token: 'secure-token-xyz' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
    }
});

app.get('/api/admin/orders', (req, res) => {
    const { token } = req.query;
    if (token !== 'secure-token-xyz') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const data = readData();
    res.json({
        orders: data.orders,
        content: data.content
    });
});

app.get('/api/admin/analytics', (req, res) => {
    const { token } = req.query;
    if (token !== 'secure-token-xyz') return res.status(401).json({ error: 'Unauthorized' });
    
    const data = readData();
    // Calculate simple business analytics
    let totalRevenue = 0;
    const planSalesCount = {};
    const dailyRevenue = {};

    data.orders.forEach(order => {
        totalRevenue += parseInt(order.price);
        // Sales per plan
        planSalesCount[order.planName] = (planSalesCount[order.planName] || 0) + 1;
        
        // Revenue per day
        const day = new Date(order.date).toLocaleDateString();
        dailyRevenue[day] = (dailyRevenue[day] || 0) + parseInt(order.price);
    });

    const bestSellingPlan = Object.keys(planSalesCount).length > 0 
        ? Object.keys(planSalesCount).reduce((a, b) => planSalesCount[a] > planSalesCount[b] ? a : b) 
        : 'N/A';

    res.json({
        totalRevenue,
        totalOrders: data.orders.length,
        bestSellingPlan,
        dailyRevenue,
        planSalesCount
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
