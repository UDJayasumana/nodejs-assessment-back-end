const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const productsFilePath = path.join(__dirname, '../data/products.json');

const readProducts = () => {
    try{
        if(!fs.existsSync(productsFilePath)){
            return [];
        }
        const data = fs.readFileSync(productsFilePath, 'utf8');
        return JSON.parse(data);
    }catch(error){
        console.error('Error reading products:', error);
        return [];
    }
};

const writeProducts = (products) => {
    try {
        fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing products:', error);
        return false;
    }
};


//Get all products
router.get('/', (req, res) => {
    try{
        const { name, category, minPrice, maxPrice, page, limit } = req.query;
        let products = readProducts();

        // Query param validation
        if (!page || !limit ) {
            return res.status(400).json({
            success: false,
            error: 'page and limit query params are required fields'
            });
        }
        //validate page param
        if (isNaN(page) || page < 1) {
            return res.status(400).json({
                success: false,
                error: 'Invalid page'
            });
        }

        //validate limit param
        if (isNaN(limit) || limit < 1) {
            return res.status(400).json({
                success: false,
                error: 'Invalid limit'
            });
        }

        // If name parameter exists, filter by product name
        if (name) {
            products = products.filter(product => {
            return product.name && 
                product.name.toLowerCase() === name.toLowerCase();
            });
        }

        // If category parameter exists, filter by category
        if (category) {
            products = products.filter(product => {
            return product.category && 
                product.category.toLowerCase() === category.toLowerCase();
            });
        }

        //If minPrice parameter exists, filter by minimum price
        if (minPrice){
            const minPriceValue = parseFloat(minPrice);
            if (isNaN(minPriceValue) || minPriceValue < 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid minPrice'
                });
            }
            products = products.filter(product => {
                return product.price && product.price >= minPriceValue;
            });
        }

        //If maxPrice parameter exists, filter by maximum price
        if (maxPrice){
            const maxPriceValue = parseFloat(maxPrice);
            if (isNaN(maxPriceValue) || maxPriceValue < 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid maxPrice'
                });
            }
            products = products.filter(product => {
                return product.price && product.price <= maxPriceValue;
            });
        }

        //Paginate theresult
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedProducts = products.slice(startIndex, endIndex);
        
        res.json({
            success: true,
            count: products.length,
            data: paginatedProducts
        })
    }catch (error){
        res.status(500).json({
            success: false,
            error: 'Failed to fetch products'
        });
    }
});

//Get product by id
router.get('/:id', (req, res) => {
    try {
        const products = readProducts();
        const productId = parseInt(req.params.id);

        if (isNaN(productId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid product ID'
            });
        }

        const product = products.find(u => u.id === productId);

        if (product) {
            res.json({
                success: true,
                data: product
            });
        }else{
            res.status(404).json({
                success: false,
                error: `Product with ID ${productId} not found`
            });
        }
        
    }catch(error){
        res.status(500).json({
            success: false,
            error: 'Failed to fetch product'
        });
    }
});

// POST create new product
router.post('/', (req, res) => {
    try{
        const { name, description, category, imageUrl, stock, ratings, status } = req.body;

        // Input validation
        if (!name || !description || !category || !status ) {
            return res.status(400).json({
                success: false,
                error: 'Name, description, category and status are required fields'
            });
        }

        //Status validation
        if(status !== "ACTIVE" && status !== "INACTIVE")
        {
            return res.status(400).json({
                success: false,
                error: 'Invalid status'
            });
        }

        const products = readProducts();

        // Check if product name already exists
        const existingProduct = products.find(u => u.name.toLowerCase() === name.toLowerCase());

        if (existingProduct) {
            return res.status(400).json({
                success: false,
                error: 'Product already exists'
            });
        }

        // Generate new ID
        const newId = products.length > 0 ? Math.max(...products.map(u => u.id)) + 1 : 1;

        // Create new user object
        const newProduct = {
            id: newId,
            name: name.trim(),
            description: description.trim(),
            category: category.trim(),
            imageUrl: imageUrl.trim(),
            stock: stock ? parseInt(stock) : 0,
            ratings: ratings ? parseInt(ratings) : 0,
            status: status.trim()
        }

        products.push(newProduct);

        if (writeProducts(products)) {
            res.status(201).json({
                success: true,
                message: 'Product created successfully',
                data: newProduct
            });
        }else{
            res.status(500).json({
                success: false,
                error: 'Failed to save product'
            });
        }

    }catch(error){
        console.error('Error creating product:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create product'
        });
    }
})

// PUT update entire product
router.put('/:id', (req, res) => {
    try{
        const products = readProducts();
        const productId = parseInt(req.params.id);
        const { stock, status } = req.body;

        if (isNaN(productId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid product ID'
            });
        }

        // Input validation
        if (!stock || !status ) {
            return res.status(400).json({
                success: false,
                error: 'Stock and status are required fields'
            });
        }

        //Stock validation
        if (isNaN(stock) || parseInt(stock) < 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid product quantity'
            });
        }

        //Status validation
        if(status !== "ACTIVE" && status !== "INACTIVE")
        {
            return res.status(400).json({
                success: false,
                error: 'Invalid status'
            });
        }

        const product = products.find(u => u.id === productId);

        if (product) {
            // Update product
            const productIndex = products.findIndex(u => u.id === productId);
            products[productIndex] = {
                ...product,
                stock: parseInt(stock),
                status: status.trim()
            };

            if (writeProducts(products)) {
                res.json({
                    success: true,
                    message: 'Product updated successfully',
                    data: products[productIndex]
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Failed to update user'
                });
            }

        }else{
            res.status(404).json({
                success: false,
                error: `Product with ID ${productId} not found`
            });
        }

    }catch(error){

    }
});

// PATCH partial update product
router.patch('/:id', (req, res) => {
    try{
        const products = readProducts();
        const productId = parseInt(req.params.id);
        const { stock, status } = req.body;

        if (isNaN(productId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid product ID'
            });
        }

        // Input validation
        if(stock && status){
            return res.status(400).json({
                success: false,
                error: 'Update all fields not supported'
            });
        }else if(!stock && !status ) {
            return res.status(400).json({
                success: false,
                error: 'Stock or status field required'
            });
        }


        const product = products.find(u => u.id === productId);
        

        if(product)
        {
            const productIndex = products.findIndex(u => u.id === productId);

            if(stock)
            {
                //Stock validation
                if (isNaN(stock) || parseInt(stock) < 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid product quantity'
                });
              }

               //Update product's stock
               products[productIndex] = {
                    ...product,
                    stock: parseInt(stock)
                };
            }

            if(status)
            {
                    //Status validation
                    if(status !== "ACTIVE" && status !== "INACTIVE")
                    {
                        return res.status(400).json({
                            success: false,
                            error: 'Invalid status'
                        });
                    }

                    //Update product's status
                    products[productIndex] = {
                        ...product,
                        status: status.trim()
                    };
            }

            if (writeProducts(products)) {
                res.json({
                    success: true,
                    message: 'Product patched successfully',
                    data: products[productIndex]
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Failed to update user'
                });
            }
        }
        else
        {
            res.status(404).json({
                success: false,
                error: `Product with ID ${productId} not found`
            });
        }

        


    }catch(error){

    }
});

module.exports = router;