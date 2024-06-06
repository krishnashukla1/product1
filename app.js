const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Serve static files from the "public" directory
app.use('/public', express.static(path.join(__dirname, 'public')));

// Setup multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images/');
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Helper function to read/write JSON file
const readData = () => {
  const data = fs.readFileSync('data/products.json', 'utf8');
  return JSON.parse(data);
};

const writeData = (data) => {
  fs.writeFileSync('data/products.json', JSON.stringify(data, null, 2));
};

// API to insert products
app.post('/api/products', upload.single('productImage'), (req, res) => {

    console.log('req.file:', req.file); // Log the uploaded file
    console.log('req.body:', req.body); // Log the request body

  const { productId, productName, productDescription, isActive } = req.body;
  const productImage = req.file ? `/public/images/${req.file.filename}` : null;

  console.log('productImage:', productImage); // Log the product image path


  if (!productId || !productName || !productDescription || !isActive) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const products = readData();
  const newProduct = { productId, productName, productDescription, productImage, isActive: isActive === 'true' };
  products.push(newProduct);
  writeData(products);

  res.status(201).json(newProduct);
});

// API to get product information by productId
app.get('/api/products/:productId', (req, res) => {
  const products = readData();
  const product = products.find(p => p.productId === req.params.productId);

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  res.json(product);
});

// API to get a list of active products (max 10 per page)
app.get('/api/products', (req, res) => {
  const { page = 1 } = req.query;
  const products = readData();
  const activeProducts = products.filter(p => p.isActive);

  const startIndex = (page - 1) * 10;
  const paginatedProducts = activeProducts.slice(startIndex, startIndex + 10);

  res.json(paginatedProducts);
});

// API to update the product by productId
app.put('/api/products/:productId', upload.single('productImage'), (req, res) => {
  const { productId, productName, productDescription, isActive } = req.body;
  const productImage = req.file ? `/public/images/${req.file.filename}` : null;

  const products = readData();
  const productIndex = products.findIndex(p => p.productId === req.params.productId);

  if (productIndex === -1) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const updatedProduct = {
    ...products[productIndex],
    productName: productName || products[productIndex].productName,
    productDescription: productDescription || products[productIndex].productDescription,
    productImage: productImage || products[productIndex].productImage,
    isActive: isActive ? isActive === 'true' : products[productIndex].isActive
  };

  products[productIndex] = updatedProduct;
  writeData(products);

  res.json(updatedProduct);
});

// API to delete a product by productId
app.delete('/api/products/:productId', (req, res) => {
  const products = readData();
  const productIndex = products.findIndex(p => p.productId === req.params.productId);

  if (productIndex === -1) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json({message :'One data deleted'})

  products.splice(productIndex, 1);
  writeData(products);

  res.status(204).end();
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});



/*
POST----   http://localhost:3000/api/products

{
    "productId": "4",
    "productName": "Ford 4",
    "productDescription": "Racing car",
    "productImage": "/public/images/8b5d9cc4-993e-4906-b9b4-246dba50d3db-d.jpeg",
    "isActive": true
}
    ------------------
    GET---http://localhost:3000/api/products/
    GET--http://localhost:3000/api/products/4
    -------------------
    PUT--http://localhost:3000/api/products/4

    {
    "productId":3,
     "productName":"Ford car FLIGHT 3", 
     "productDescription":"Racing car", 
    //  "productImage":"https://stat.overdrive.in/wp-content/odgallery/2020/09/57752_2020_Ford_Endeavour_468x263.jpg",
     "isActive":"true"
}

*/