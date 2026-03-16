// src/data/db.js

const SEED_DATA = {
  products: [
    { id: '1', name: 'Premium Diapers - Size 1', category: 'Diapers', size: 'Size 1', price: 15.99, stock: 100, supplierId: 's1' },
    { id: '2', name: 'Premium Diapers - Size 2', category: 'Diapers', size: 'Size 2', price: 16.99, stock: 85, supplierId: 's1' },
    { id: '3', name: 'Premium Diapers - Size 3', category: 'Diapers', size: 'Size 3', price: 17.99, stock: 50, supplierId: 's1' },
    { id: '4', name: 'Premium Diapers - Size 4', category: 'Diapers', size: 'Size 4', price: 18.99, stock: 12, supplierId: 's1' },
    { id: '5', name: 'Gentle Baby Wipes (100ct)', category: 'Wipes', size: 'Standard', price: 4.99, stock: 200, supplierId: 's2' },
    { id: '6', name: 'Moisturizing Baby Soap', category: 'Bath', size: 'Standard', price: 6.50, stock: 60, supplierId: 's3' },
  ],
  categories: ['Diapers', 'Wipes', 'Bath', 'Feeding', 'Clothing'],
  sales: [],
  suppliers: [
    { id: 's1', name: 'Pampers Supply Co.', contact: 'info@pamperssupply.com', products: ['Diapers'] },
    { id: 's2', name: 'Wipes Direct', contact: 'sales@wipesdirect.com', products: ['Wipes'] },
    { id: 's3', name: 'Baby Care Naturals', contact: 'orders@bcnaturals.com', products: ['Bath'] }
  ],
  users: [
    { id: 'u1', username: 'owner', role: 'Store Owner', name: 'Jane Doe' },
    { id: 'u2', username: 'cashier', role: 'Cashier', name: 'John Smith' },
    { id: 'u3', username: 'manager', role: 'Inventory Manager', name: 'Alice Johnson' }
  ]
};

export const initDB = () => {
  if (!localStorage.getItem('nova_initialized')) {
    localStorage.setItem('nova_products', JSON.stringify(SEED_DATA.products));
    localStorage.setItem('nova_categories', JSON.stringify(SEED_DATA.categories));
    localStorage.setItem('nova_sales', JSON.stringify(SEED_DATA.sales));
    localStorage.setItem('nova_suppliers', JSON.stringify(SEED_DATA.suppliers));
    localStorage.setItem('nova_users', JSON.stringify(SEED_DATA.users));
    localStorage.setItem('nova_initialized', 'true');
  }
};

// Generic DB Helpers
const getTable = (table) => JSON.parse(localStorage.getItem(`nova_${table}`)) || [];
const setTable = (table, data) => localStorage.setItem(`nova_${table}`, JSON.stringify(data));

// Product Operations
export const getProducts = () => getTable('products');
export const saveProduct = (product) => {
  const products = getProducts();
  if (product.id) {
    const index = products.findIndex((p) => p.id === product.id);
    if (index !== -1) products[index] = product;
    else products.push(product);
  } else {
    product.id = Date.now().toString();
    products.push(product);
  }
  setTable('products', products);
};
export const deleteProduct = (id) => {
  setTable('products', getProducts().filter((p) => p.id !== id));
};

// Sales & Checkout Operations
export const getSales = () => getTable('sales');
export const processSale = (saleData) => {
  const sales = getSales();
  const products = getProducts();
  
  // Create sale record
  const newSale = {
    ...saleData,
    id: 'TXN-' + Date.now(),
    date: new Date().toISOString()
  };
  
  // Deduct inventory
  saleData.items.forEach(item => {
    const pIndex = products.findIndex(p => p.id === item.product.id);
    if (pIndex !== -1) {
      products[pIndex].stock -= item.quantity;
    }
  });

  sales.push(newSale);
  setTable('sales', sales);
  setTable('products', products); // Save new stock levels
  return newSale;
};

// Supplier Operations
export const getSuppliers = () => getTable('suppliers');
export const receiveRestock = (productId, quantity) => {
  const products = getProducts();
  const pIndex = products.findIndex(p => p.id === productId);
  if (pIndex !== -1) {
    products[pIndex].stock += quantity;
    setTable('products', products);
  }
};

// Other Getters
export const getCategories = () => getTable('categories');
export const getUsers = () => getTable('users');
