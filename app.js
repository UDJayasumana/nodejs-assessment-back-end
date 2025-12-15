const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;


// Import routes
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Ensure products.json exists
const productFilePath = path.join(__dirname, 'data/products.json');
if (!fs.existsSync(productFilePath)) {
    fs.writeFileSync(productFilePath, JSON.stringify([], null, 2));
    console.log('Created products.json file');
}

// Ensure orders.json exists
const orderFilePath = path.join(__dirname, 'data/orders.json');
if (!fs.existsSync(orderFilePath)) {
    fs.writeFileSync(orderFilePath, JSON.stringify([], null, 2));
    console.log('Created orders.json file');
}

// Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Product API is running',
        endpoints:{
            getProducts: 'GET /api/products',
            getProduct: 'GET /api/products/:id',
            createProduct: 'POST /api/products',
            updateFullProduct: 'PUT /api/products/:id',
            updatePartialProduct: 'PATCH /api/products/:id',
            getOrders: 'GET /api/orders'
        }
    })
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`API Endpoints available at http://localhost:${PORT}/api/users`);
});