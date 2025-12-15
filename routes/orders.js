const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const ordersFilePath = path.join(__dirname, '../data/orders.json');

const readOrders = () => {
    try{
        if(!fs.existsSync(ordersFilePath)){
            return [];
        }
        const data = fs.readFileSync(ordersFilePath, 'utf8');
        return JSON.parse(data);
    }catch(error){
        console.error('Error reading orders:', error);
        return [];
    }
};


//Get all orders
router.get('/', (req, res) => {
    try{
        const { product, status } = req.query;
        let orders = readOrders();

        // If product parameter exists, filter by product name
        if (product) {
            orders = orders.filter(order => {
            return order.product && 
               order.product.toLowerCase() === product.toLowerCase();
            });
        }

        // If status parameter exists, filter by order status
        if (status) {
            orders = orders.filter(order => {
                return order.status && 
                    order.status.toLowerCase() === status.toLowerCase();
                });
        }

        res.json({
            success: true,
            count: orders.length,
            data: orders
        })
    }catch (error){
        res.status(500).json({
            success: false,
            error: 'Failed to fetch orders'
        });
    }
});


module.exports = router;