import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut 
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  where,
  orderBy, 
  doc, 
  getDoc, 
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

const AppContext = createContext(null);

// ── seed data (as fallback/initial) ──────────────────────────────────────────
const SEED_PRODUCTS = [
  { id: 'p1', name: 'Pampers Size 1', category: 'Diapers', size: 'Size 1', brand: 'Pampers', price: 12.00, costPrice: 8.00, sku: 'PAM-S1', supplierId: 's1' },
  { id: 'p2', name: 'Pampers Size 2', category: 'Diapers', size: 'Size 2', brand: 'Pampers', price: 13.00, costPrice: 9.00, sku: 'PAM-S2', supplierId: 's1' },
  { id: 'p3', name: 'Pampers Size 3', category: 'Diapers', size: 'Size 3', brand: 'Pampers', price: 14.00, costPrice: 10.00, sku: 'PAM-S3', supplierId: 's1' },
  { id: 'p4', name: 'Pampers Size 4', category: 'Diapers', size: 'Size 4', brand: 'Pampers', price: 15.00, costPrice: 11.00, sku: 'PAM-S4', supplierId: 's1' },
  { id: 'p5', name: 'Huggies Newborn',category: 'Diapers', size: 'Newborn',brand: 'Huggies', price: 11.00, costPrice: 7.50, sku: 'HUG-NB', supplierId: 's2' },
  { id: 'p6', name: 'Huggies Size 3', category: 'Diapers', size: 'Size 3', brand: 'Huggies', price: 14.50, costPrice: 10.50,sku: 'HUG-S3', supplierId: 's2' },
  { id: 'p7', name: 'Baby Wipes (80ct)',category:'Wipes',  size: null,      brand: 'WaterWipes',price:5.50, costPrice:3.00, sku:'WW-80', supplierId:'s2' },
  { id: 'p8', name: 'Baby Wipes (120ct)',category:'Wipes', size: null,      brand: 'WaterWipes',price:7.50, costPrice:4.50, sku:'WW-120',supplierId:'s2' },
  { id: 'p9', name: 'Lavender Baby Soap',category:'Soap', size: null,      brand: 'Johnson\'s', price:3.00, costPrice:1.80, sku:'JBL-SOA',supplierId:'s3' },
  { id:'p10', name: 'Gentle Baby Soap', category:'Soap',  size: null,      brand: 'Dove',       price:3.50, costPrice:2.00, sku:'DOVE-SOA',supplierId:'s3' },
];

const SEED_INVENTORY = [
  { id:'i1', productId:'p1', quantity:45, lowStockThreshold:10, expiryDate:'2026-12-01' },
  { id:'i2', productId:'p2', quantity:30, lowStockThreshold:10, expiryDate:'2026-12-01' },
  { id:'i3', productId:'p3', quantity: 8, lowStockThreshold:10, expiryDate:'2026-11-01' },
  { id:'i4', productId:'p4', quantity:20, lowStockThreshold:10, expiryDate:'2026-12-01' },
  { id:'i5', productId:'p5', quantity: 5, lowStockThreshold:10, expiryDate:'2026-10-01' },
  { id:'i6', productId:'p6', quantity:18, lowStockThreshold:10, expiryDate:'2026-12-01' },
  { id:'i7', productId:'p7', quantity:60, lowStockThreshold:15, expiryDate:null },
  { id:'i8', productId:'p8', quantity:40, lowStockThreshold:15, expiryDate:null },
  { id:'i9', productId:'p9', quantity: 3, lowStockThreshold:10, expiryDate:'2027-06-01' },
  { id:'i10',productId:'p10',quantity:22, lowStockThreshold:10, expiryDate:'2027-06-01' },
];

const SEED_SUPPLIERS = [
  { id:'s1', name:'DiapersGH Distributors', contact:'Kwame Asante', phone:'0244123456', email:'kwame@diapergh.com',    address:'Accra, Ghana' },
  { id:'s2', name:'BabyCare Wholesale',     contact:'Ama Boateng',   phone:'0277654321', email:'ama@babywholesale.com', address:'Kumasi, Ghana' },
  { id:'s3', name:'Hygiene Imports Ltd',    contact:'Kofi Mensah',   phone:'0201987654', email:'kofi@hygienimp.com',   address:'Takoradi, Ghana' },
];

const SEED_USERS = [
  { id:'u1', name:'Sarah Mensah',   email:'sarah@novapos.com',    role:'owner',    pin:'1234' },
  { id:'u2', name:'Jennifer Park',  email:'jennifer@novapos.com', role:'cashier',  pin:'5678' },
  { id:'u3', name:'Kofi Boateng',   email:'kofi@novapos.com',     role:'inventory',pin:'9012' },
];

function buildSeedSales() {
  const sales = [];
  const now = new Date();
  let saleCounter = 1;
  for (let d = 29; d >= 0; d--) {
    const date = new Date(now);
    date.setDate(now.getDate() - d);
    const txCount = Math.floor(Math.random() * 6) + 2;
    for (let t = 0; t < txCount; t++) {
      const pid = `p${Math.floor(Math.random() * 10) + 1}`;
      const product = SEED_PRODUCTS.find(p => p.id === pid);
      const qty  = Math.floor(Math.random() * 3) + 1;
      const total = product.price * qty;
      sales.push({
        id: `sale${saleCounter++}`,
        date: date.toISOString(),
        cashierId: Math.random() > 0.5 ? 'u2' : 'u1',
        items: [{ productId: pid, productName: product.name, qty, unitPrice: product.price, subtotal: total }],
        total,
        paymentMethod: Math.random() > 0.4 ? 'cash' : 'mobile_money',
        amountPaid: total + (Math.random() > 0.4 ? Math.ceil(total % 5 === 0 ? 0 : 5 - (total % 5)) : 0),
        change: 0,
        status: 'completed',
      });
    }
  }
  return sales;
}

export async function seedFirestore() {
  const productsSnap = await getDocs(collection(db, 'products'));
  if (productsSnap.empty) {
    for (const p of SEED_PRODUCTS) {
      const { id, ...data } = p;
      await setDoc(doc(db, 'products', id), data);
    }
    for (const i of SEED_INVENTORY) {
      const { id, ...data } = i;
      await setDoc(doc(db, 'inventory', id), data);
    }
    for (const s of SEED_SUPPLIERS) {
      const { id, ...data } = s;
      await setDoc(doc(db, 'suppliers', id), data);
    }
    const sales = buildSeedSales();
    for (const s of sales) {
      const { id, ...data } = s;
      await setDoc(doc(db, 'sales', id), data);
    }
  }
}

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [products,    setProducts]    = useState([]);
  const [inventory,   setInventory]   = useState([]);
  const [suppliers,   setSuppliers]   = useState([]);
  const [sales,       setSales]       = useState([]);
  const [users,       setUsers]       = useState([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setCurrentUser({ uid: user.uid, ...userDoc.data() });
        } else {
          const newUser = { 
            name: user.displayName || user.email.split('@')[0],
            email: user.email, 
            role: 'customer' 
          };
          await setDoc(userDocRef, newUser);
          setCurrentUser({ uid: user.uid, ...newUser });
        }
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubInventory = onSnapshot(collection(db, 'inventory'), (snap) => {
      setInventory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubSuppliers = onSnapshot(collection(db, 'suppliers'), (snap) => {
      setSuppliers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const salesQuery = query(collection(db, 'sales'), orderBy('date', 'desc'));
    const unsubSales = onSnapshot(salesQuery, (snap) => {
      setSales(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => {
      unsubProducts(); unsubInventory(); unsubSuppliers(); unsubSales(); unsubUsers();
    };
  }, [currentUser]);

  const login = useCallback(async (email, pin) => {
    try {
      const authEmail = email.trim().toLowerCase();
      const password = pin + "novapos_secret"; 
      try {
        await signInWithEmailAndPassword(auth, authEmail, password); 
        return { ok: true };
      } catch (authError) {
        if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('email', '==', authEmail));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            if (userData.pin === pin) {
              await createUserWithEmailAndPassword(auth, authEmail, password);
              await signInWithEmailAndPassword(auth, authEmail, password);
              return { ok: true };
            }
          }
        }
        throw authError;
      }
    } catch (error) {
      console.error("Login Error:", error.code, error.message);
      let message = 'Invalid email or PIN.';
      if (error.code === 'auth/user-disabled') message = 'This account has been disabled.';
      if (error.code === 'auth/too-many-requests') message = 'Too many attempts. Please try again later.';
      return { ok: false, error: message };
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return { ok: true, user: result.user };
    } catch (error) {
      console.error("Google Auth Error:", error.code, error.message);
      let message = 'Google login failed.';
      if (error.code === 'auth/operation-not-allowed') {
        message = 'Google Sign-In is not enabled in the Firebase Console.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        message = 'Login popup was closed before completion.';
      } else if (error.code === 'auth/unauthorized-domain') {
        message = 'This domain is not authorized for Google Sign-In.';
      }
      return { ok: false, error: message };
    }
  }, []);

  const signup = useCallback(async (name, email, pin) => {
    try {
      const authEmail = email.trim().toLowerCase();
      const password = pin + "novapos_secret";
      const userCredential = await createUserWithEmailAndPassword(auth, authEmail, password);
      const user = userCredential.user;
      const userData = {
        name: name.trim(),
        email: authEmail,
        role: 'customer',
        pin: pin,
        createdAt: serverTimestamp()
      };
      await setDoc(doc(db, 'users', user.uid), userData);
      setCurrentUser({ uid: user.uid, ...userData });
      return { ok: true };
    } catch (error) {
      console.error("Signup Error:", error.code, error.message);
      let message = 'Signup failed.';
      if (error.code === 'auth/email-already-in-use') message = 'This email is already registered.';
      if (error.code === 'auth/weak-password') message = 'The PIN is too short.';
      if (error.code === 'auth/invalid-email') message = 'Invalid email address.';
      return { ok: false, error: message };
    }
  }, []);

  const logout = useCallback(() => signOut(auth).then(() => setCurrentUser(null)), []);

  const addProduct = useCallback(async (product) => {
    const newId = `p${Date.now()}`;
    const newProduct = { ...product, id: newId };
    await setDoc(doc(db, 'products', newId), newProduct);
    const inventoryId = `i${Date.now()}`;
    await setDoc(doc(db, 'inventory', inventoryId), { 
      id: inventoryId, productId: newId, quantity: 0, lowStockThreshold: 10, expiryDate: null 
    });
    return newProduct;
  }, []);

  const updateProduct = useCallback(async (id, updates) => {
    await updateDoc(doc(db, 'products', id), updates);
  }, []);

  const deleteProduct = useCallback(async (id) => {
    await deleteDoc(doc(db, 'products', id));
    const item = inventory.find(i => i.productId === id);
    if (item) await deleteDoc(doc(db, 'inventory', item.id));
  }, [inventory]);

  const updateStock = useCallback(async (productId, newQuantity, threshold, expiryDate) => {
    const item = inventory.find(i => i.productId === productId);
    if (item) {
      const updates = { quantity: newQuantity };
      if (threshold !== undefined) updates.lowStockThreshold = threshold;
      if (expiryDate !== undefined) updates.expiryDate = expiryDate;
      await updateDoc(doc(db, 'inventory', item.id), updates);
    }
  }, [inventory]);

  const getStockForProduct = useCallback((productId) => {
    return inventory.find(i => i.productId === productId) || null;
  }, [inventory]);

  const getLowStockItems = useCallback(() => {
    return inventory.filter(i => i.quantity <= i.lowStockThreshold).map(i => ({
      ...i, product: products.find(p => p.id === i.productId),
    }));
  }, [inventory, products]);

  const processSale = useCallback(async (cartItems, paymentMethod, amountPaid) => {
    const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    const change = amountPaid - total;
    const saleId = `sale${Date.now()}`;
    const newSale = {
      id: saleId,
      date: new Date().toISOString(),
      cashierId: currentUser?.uid || 'u2',
      items: cartItems.map(item => {
        const product = products.find(p => p.id === item.productId);
        return { ...item, costPrice: product?.costPrice || 0 };
      }),
      total, paymentMethod, amountPaid, change, status: 'completed',
    };
    await setDoc(doc(db, 'sales', saleId), newSale);
    for (const item of cartItems) {
      const invItem = inventory.find(i => i.productId === item.productId);
      if (invItem) {
        await updateDoc(doc(db, 'inventory', invItem.id), {
          quantity: Math.max(0, invItem.quantity - item.qty)
        });
      }
    }
    return newSale;
  }, [currentUser, inventory, products]);

  const addSupplier = useCallback(async (supplier) => {
    const id = `s${Date.now()}`;
    const newSupplier = { ...supplier, id };
    await setDoc(doc(db, 'suppliers', id), newSupplier);
    return newSupplier;
  }, []);

  const updateSupplier = useCallback(async (id, updates) => {
    await updateDoc(doc(db, 'suppliers', id), updates);
  }, []);

  const deleteSupplier = useCallback(async (id) => {
    await deleteDoc(doc(db, 'suppliers', id));
  }, []);

  const updateUserRole = useCallback(async (uid, newRole) => {
    await updateDoc(doc(db, 'users', uid), { role: newRole });
  }, []);

  const deleteUser = useCallback(async (uid) => {
    await deleteDoc(doc(db, 'users', uid));
  }, []);

  const getSalesByDateRange = useCallback((days = 7) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return sales.filter(s => new Date(s.date) >= cutoff);
  }, [sales]);

  const getTodaySales = useCallback(() => {
    const today = new Date().toDateString();
    return sales.filter(s => new Date(s.date).toDateString() === today);
  }, [sales]);

  const getTopProducts = useCallback((days = 7, limit = 5) => {
    const recent = getSalesByDateRange(days);
    const counts = {};
    recent.forEach(sale => {
      sale.items.forEach(item => {
        counts[item.productId] = (counts[item.productId] || 0) + item.qty;
      });
    });
    return Object.entries(counts)
      .map(([productId, qty]) => ({ product: products.find(p => p.id === productId), qty }))
      .filter(x => x.product)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, limit);
  }, [getSalesByDateRange, products]);

  const value = {
    currentUser, login, signup, loginWithGoogle, logout, isLoading,
    sidebarOpen, setSidebarOpen,
    products, inventory, suppliers, sales, users,
    addProduct, updateProduct, deleteProduct,
    updateStock, getStockForProduct, getLowStockItems,
    processSale,
    addSupplier, updateSupplier, deleteSupplier,
    updateUserRole, deleteUser,
    getSalesByDateRange, getTodaySales, getTopProducts,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
