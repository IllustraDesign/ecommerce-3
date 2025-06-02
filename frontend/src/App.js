import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import { 
  ShoppingCartIcon, 
  UserIcon, 
  HeartIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  EyeIcon,
  StarIcon,
  CheckIcon,
  CreditCardIcon,
  TruckIcon,
  ShieldCheckIcon,
  PhotoIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartSolidIcon,
  StarIcon as StarSolidIcon,
  CheckCircleIcon
} from '@heroicons/react/24/solid';
import axios from 'axios';
import { AdminDashboard } from './AdminComponents';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Context for authentication and cart
const AppContext = createContext();

const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

// AppProvider component
const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load user from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
      fetchCart();
    }
  }, []);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.get(`${API}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(response.data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { access_token, user } = response.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      toast.success('Welcome back!', {
        icon: '👋',
        style: {
          borderRadius: '12px',
          background: '#362222',
          color: '#fff',
        },
      });
      await fetchCart();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed', {
        style: {
          borderRadius: '12px',
          background: '#ef4444',
          color: '#fff',
        },
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API}/auth/register`, userData);
      const { access_token, user } = response.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      toast.success('Welcome to IllustraDesign! 🎨', {
        style: {
          borderRadius: '12px',
          background: '#10b981',
          color: '#fff',
        },
      });
      return true;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCart([]);
    setWishlist([]);
    toast.success('See you soon! 👋');
  };

  const addToCart = async (productId, quantity = 1, size = null) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to add items to cart');
        return;
      }

      const formData = new FormData();
      formData.append('product_id', productId);
      formData.append('quantity', quantity);
      if (size) formData.append('size', size);

      await axios.post(`${API}/cart/items`, formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      await fetchCart();
      toast.success('Added to cart! 🛒', {
        style: {
          borderRadius: '12px',
          background: '#B3541E',
          color: '#fff',
        },
      });
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error('Failed to add item to cart');
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/cart/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchCart();
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const value = {
    user,
    cart,
    wishlist,
    loading,
    login,
    register,
    logout,
    addToCart,
    removeFromCart,
    fetchCart
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Enhanced Navigation component with elegant design
const Navigation = () => {
  const { user, cart, logout } = useAppContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <nav className="nav-elegant fixed w-full top-0 z-50 shadow-elegant">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Elegant Logo */}
          <Link to="/" className="flex items-center space-x-4 group">
            <div className="relative logo-float">
              <div className="w-14 h-14 bg-gradient-elegant-bg rounded-2xl flex items-center justify-center shadow-elegant group-hover:shadow-elegant-lg transition-all duration-300">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-primary-600">
                  <path d="M12 2L13.5 8.5L20 9.5L13.5 10.5L12 17L10.5 10.5L4 9.5L10.5 8.5L12 2Z" fill="currentColor"/>
                  <path d="M19 15L19.75 17.25L22 18L19.75 18.75L19 21L18.25 18.75L16 18L18.25 17.25L19 15Z" fill="currentColor"/>
                </svg>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center">
                <span className="text-2xl font-serif font-semibold text-gradient-elegant">
                  illustra
                </span>
                <span className="text-2xl font-serif font-semibold text-accent-600 ml-1">Design</span>
              </div>
              <span className="text-xs font-sans font-medium tracking-elegant-wide text-neutral-500 -mt-1">STUDIO</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-10">
            <Link to="/" className="text-neutral-700 hover:text-primary-600 transition-all duration-300 font-medium relative group font-sans">
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-400 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link to="/products" className="text-neutral-700 hover:text-primary-600 transition-all duration-300 font-medium relative group font-sans">
              Collection
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-400 group-hover:w-full transition-all duration-300"></span>
            </Link>
            
            <Link to="/cart" className="relative p-3 text-neutral-700 hover:text-primary-600 transition-all duration-300 group">
              <ShoppingCartIcon className="h-6 w-6" />
              {cartItemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-accent-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-semibold shadow-elegant"
                >
                  {cartItemCount}
                </motion.span>
              )}
            </Link>
            
            {user ? (
              <div className="flex items-center space-x-4">
                {user.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    className="btn-elegant-primary"
                  >
                    Dashboard
                  </Link>
                )}
                <Link to="/profile" className="p-3 text-neutral-700 hover:text-primary-600 transition-all duration-300">
                  <UserIcon className="h-6 w-6" />
                </Link>
                <button 
                  onClick={logout}
                  className="btn-elegant-secondary"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className="text-neutral-700 hover:text-primary-600 transition-all duration-300 font-medium font-sans"
                >
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="btn-elegant-primary"
                >
                  Join Us
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-neutral-700 hover:text-primary-600 transition-all duration-300"
            >
              {isMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-neutral-200"
            >
              <div className="px-2 pt-4 pb-4 space-y-3 bg-white rounded-b-2xl">
                <Link to="/" className="block px-4 py-3 text-neutral-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all font-medium font-sans">Home</Link>
                <Link to="/products" className="block px-4 py-3 text-neutral-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all font-medium font-sans">Collection</Link>
                <Link to="/cart" className="block px-4 py-3 text-neutral-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all font-medium font-sans">
                  Cart {cartItemCount > 0 && `(${cartItemCount})`}
                </Link>
                {user ? (
                  <>
                    {user.role === 'admin' && (
                      <Link to="/admin" className="block px-4 py-3 text-primary-600 hover:bg-primary-50 rounded-xl transition-all font-semibold font-sans">
                        Admin Dashboard
                      </Link>
                    )}
                    <Link to="/profile" className="block px-4 py-3 text-neutral-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all font-medium font-sans">Profile</Link>
                    <button 
                      onClick={logout} 
                      className="block w-full text-left px-4 py-3 text-neutral-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all font-medium font-sans"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="block px-4 py-3 text-neutral-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all font-medium font-sans">Sign In</Link>
                    <Link to="/register" className="block px-4 py-3 text-neutral-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all font-medium font-sans">Join Us</Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

// Enhanced Hero Section Component
const HeroSection = () => {
  const [heroImages, setHeroImages] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    fetchHeroImages();
  }, []);

  const fetchHeroImages = async () => {
    try {
      const response = await axios.get(`${API}/hero-images`);
      setHeroImages(response.data);
    } catch (error) {
      console.error('Failed to fetch hero images:', error);
      // Enhanced fallback hero images
      setHeroImages([
        {
          image_url: "https://images.unsplash.com/photo-1503694978374-8a2fa686963a",
          title: "Design Dreams Into Reality",
          subtitle: "Premium Custom Printing Solutions"
        },
        {
          image_url: "https://images.pexels.com/photos/9324380/pexels-photo-9324380.jpeg",
          title: "Crafted With Precision",
          subtitle: "Where Quality Meets Creativity"
        }
      ]);
    }
  };

  useEffect(() => {
    if (heroImages.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % heroImages.length);
      }, 6000);
      return () => clearInterval(timer);
    }
  }, [heroImages.length]);

  if (heroImages.length === 0) return null;

  return (
    <div className="relative h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <div
            className="h-full bg-cover bg-center bg-no-repeat relative"
            style={{ backgroundImage: `url(${heroImages[currentSlide]?.image_url})` }}
          >
            {/* Enhanced overlay with gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30"></div>
            
            {/* Floating design elements */}
            <div className="absolute top-20 left-10 w-32 h-32 bg-[#B3541E]/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            
            <div className="relative z-10 h-full flex items-center justify-center text-center text-white">
              <motion.div
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="max-w-5xl mx-auto px-4"
              >
                <motion.h1 
                  className="text-6xl md:text-8xl font-bold mb-8 leading-tight"
                  style={{ 
                    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  {heroImages[currentSlide]?.title || "Design Dreams Into Reality"}
                </motion.h1>
                
                <motion.p 
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="text-xl md:text-3xl mb-12 text-gray-200 font-light tracking-wide"
                >
                  {heroImages[currentSlide]?.subtitle || "Premium Custom Printing Solutions"}
                </motion.p>
                
                <motion.div 
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.1, duration: 0.6 }}
                  className="flex flex-col sm:flex-row gap-6 justify-center items-center"
                >
                  <Link 
                    to="/products"
                    className="group bg-gradient-to-r from-[#B3541E] to-[#9a4519] text-white px-10 py-4 rounded-full text-lg font-semibold hover:from-[#9a4519] hover:to-[#7d3615] transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center space-x-3"
                  >
                    <span>Explore Collection</span>
                    <motion.div
                      className="group-hover:translate-x-1 transition-transform duration-300"
                    >
                      →
                    </motion.div>
                  </Link>
                  
                  <Link 
                    to="/products?category=custom"
                    className="group border-2 border-white/80 text-white px-10 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-[#362222] transition-all duration-300 transform hover:scale-105 backdrop-blur-sm bg-white/10"
                  >
                    Start Designing
                  </Link>
                </motion.div>

                {/* Trust indicators */}
                <motion.div
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.4, duration: 0.6 }}
                  className="mt-16 flex justify-center items-center space-x-8 text-white/80"
                >
                  <div className="flex items-center space-x-2">
                    <CheckCircleIcon className="h-5 w-5" />
                    <span className="text-sm">Premium Quality</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TruckIcon className="h-5 w-5" />
                    <span className="text-sm">Fast Delivery</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ShieldCheckIcon className="h-5 w-5" />
                    <span className="text-sm">100% Satisfaction</span>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Enhanced slide indicators */}
      {heroImages.length > 1 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-white scale-125 shadow-lg' 
                  : 'bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Enhanced Product Card Component
const ProductCard = ({ product, onQuickView }) => {
  const { addToCart } = useAppContext();
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = async () => {
    setIsLoading(true);
    await addToCart(product.id);
    setIsLoading(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 group"
    >
      <div className="relative overflow-hidden">
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab'}
          alt={product.title}
          className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Overlay actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex space-x-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onQuickView(product)}
              className="bg-white/90 backdrop-blur-sm text-gray-800 p-3 rounded-full hover:bg-white transition-colors shadow-lg"
            >
              <EyeIcon className="h-5 w-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsLiked(!isLiked)}
              className="bg-white/90 backdrop-blur-sm p-3 rounded-full hover:bg-white transition-colors shadow-lg"
            >
              {isLiked ? (
                <HeartSolidIcon className="h-5 w-5 text-red-500" />
              ) : (
                <HeartIcon className="h-5 w-5 text-gray-800" />
              )}
            </motion.button>
          </div>
        </div>
        
        {/* Product badges */}
        <div className="absolute top-4 left-4 flex flex-col space-y-2">
          {product.is_customizable && (
            <span className="bg-gradient-to-r from-[#B3541E] to-[#9a4519] text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
              Customizable
            </span>
          )}
        </div>

        {/* Quick add to cart */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
            disabled={isLoading}
            className="bg-[#B3541E] text-white p-3 rounded-full hover:bg-[#9a4519] transition-colors shadow-lg disabled:opacity-50"
          >
            {isLoading ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <PlusIcon className="h-5 w-5" />
            )}
          </motion.button>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="font-bold text-gray-800 mb-2 text-lg group-hover:text-[#B3541E] transition-colors">
          {product.title}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
          {product.description}
        </p>
        
        {/* Price and rating */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-[#362222]">₹{product.price}</span>
            {product.sizes && product.sizes.length > 0 && (
              <span className="text-xs text-gray-500">Available in {product.sizes.length} sizes</span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <StarSolidIcon key={i} className="h-4 w-4 text-yellow-400" />
            ))}
            <span className="text-sm text-gray-500 ml-1">(4.8)</span>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAddToCart}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-[#B3541E] to-[#9a4519] text-white py-3 rounded-xl font-semibold hover:from-[#9a4519] hover:to-[#7d3615] transition-all duration-300 transform hover:shadow-lg disabled:opacity-50"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              <span>Adding...</span>
            </div>
          ) : (
            'Add to Cart'
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

// Enhanced Product Detail Modal
const ProductDetailModal = ({ product, isOpen, onClose }) => {
  const { addToCart } = useAppContext();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !product) return null;

  const handleAddToCart = async () => {
    setIsLoading(true);
    await addToCart(product.id, quantity, selectedSize);
    setIsLoading(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-3xl max-w-5xl w-full max-h-screen overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="grid md:grid-cols-2 gap-8 p-8">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-2xl">
                <img
                  src={product.images[selectedImage] || product.images[0]}
                  alt={product.title}
                  className="w-full h-96 object-cover"
                />
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`border-2 rounded-lg overflow-hidden transition-all ${
                        selectedImage === index ? 'border-[#B3541E] ring-2 ring-[#B3541E]/20' : 'border-gray-200 hover:border-[#B3541E]/50'
                      }`}
                    >
                      <img src={image} alt="" className="w-full h-20 object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <h2 className="text-4xl font-bold text-gray-800 mb-4">{product.title}</h2>
                <p className="text-gray-600 text-lg leading-relaxed">{product.description}</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-4xl font-bold text-[#362222]">₹{product.price}</span>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <StarSolidIcon key={i} className="h-5 w-5 text-yellow-400" />
                  ))}
                  <span className="text-gray-500 ml-2">(4.8 rating)</span>
                </div>
              </div>

              {/* Size Selection */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg">Size:</h4>
                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map((size) => (
                      <motion.button
                        key={size}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedSize(size)}
                        className={`px-6 py-3 border-2 rounded-xl font-medium transition-all ${
                          selectedSize === size
                            ? 'border-[#B3541E] bg-[#B3541E] text-white shadow-lg'
                            : 'border-gray-300 hover:border-[#B3541E] hover:shadow-md'
                        }`}
                      >
                        {size}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selection */}
              <div className="space-y-3">
                <h4 className="font-semibold text-lg">Quantity:</h4>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 border-2 border-gray-300 rounded-xl hover:border-[#B3541E] hover:bg-gray-50 transition-colors"
                  >
                    <MinusIcon className="h-5 w-5" />
                  </button>
                  <span className="text-2xl font-semibold w-16 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 border-2 border-gray-300 rounded-xl hover:border-[#B3541E] hover:bg-gray-50 transition-colors"
                  >
                    <PlusIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToCart}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#B3541E] to-[#9a4519] text-white py-4 rounded-xl text-lg font-semibold hover:from-[#9a4519] hover:to-[#7d3615] transition-all duration-300 shadow-lg disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                      <span>Adding to Cart...</span>
                    </div>
                  ) : (
                    'Add to Cart'
                  )}
                </motion.button>
                
                <button className="w-full border-2 border-[#B3541E] text-[#B3541E] py-4 rounded-xl text-lg font-semibold hover:bg-[#B3541E] hover:text-white transition-all duration-300">
                  Add to Wishlist
                </button>
              </div>

              {/* Product Features */}
              {product.is_customizable && (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <PhotoIcon className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-orange-800 mb-2">Customization Available</h4>
                      <p className="text-sm text-orange-700">
                        This product can be personalized with your own design. Upload your image during checkout for a truly unique creation.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center space-y-2">
                  <ShieldCheckIcon className="h-8 w-8 text-green-500 mx-auto" />
                  <span className="text-sm font-medium text-gray-700">Quality Guaranteed</span>
                </div>
                <div className="text-center space-y-2">
                  <TruckIcon className="h-8 w-8 text-blue-500 mx-auto" />
                  <span className="text-sm font-medium text-gray-700">Fast Shipping</span>
                </div>
                <div className="text-center space-y-2">
                  <CheckCircleIcon className="h-8 w-8 text-purple-500 mx-auto" />
                  <span className="text-sm font-medium text-gray-700">Easy Returns</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Enhanced Home Page Component
const HomePage = () => {
  const [newArrivals, setNewArrivals] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchNewArrivals();
  }, []);

  const fetchNewArrivals = async () => {
    try {
      const response = await axios.get(`${API}/products?limit=8`);
      setNewArrivals(response.data);
    } catch (error) {
      console.error('Failed to fetch new arrivals:', error);
    }
  };

  const handleQuickView = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen">
      <HeroSection />
      
      {/* New Arrivals Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-[#362222] mb-6">New Arrivals</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover our latest collection of customizable products, crafted with precision and designed to bring your creative vision to life.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {newArrivals.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <ProductCard product={product} onQuickView={handleQuickView} />
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/products"
              className="inline-flex items-center space-x-3 bg-gradient-to-r from-[#B3541E] to-[#9a4519] text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-[#9a4519] hover:to-[#7d3615] transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <span>View All Products</span>
              <motion.div
                className="group-hover:translate-x-1 transition-transform duration-300"
              >
                →
              </motion.div>
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-5xl font-bold text-[#362222] mb-6">About IllustraDesign Studio</h2>
                <p className="text-xl text-gray-600 leading-relaxed mb-8">
                  We are passionate creators who transform your ideas into high-quality printed masterpieces. 
                  With cutting-edge technology and unwavering commitment to excellence, we deliver 
                  personalized products that exceed expectations.
                </p>
              </div>
              
              <div className="space-y-6">
                {[
                  { icon: '🎨', title: 'Premium Quality Materials', desc: 'Only the finest materials for lasting beauty' },
                  { icon: '🚀', title: 'Fast & Reliable Delivery', desc: 'Express shipping with tracking included' },
                  { icon: '💡', title: 'Custom Design Support', desc: 'Professional design assistance available' }
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.2 }}
                    className="flex items-start space-x-4"
                  >
                    <div className="text-2xl">{feature.icon}</div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">{feature.title}</h3>
                      <p className="text-gray-600">{feature.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative overflow-hidden rounded-3xl shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1556761175-4b46a572b786"
                  alt="Design Studio"
                  className="w-full h-96 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              
              {/* Floating stats */}
              <div className="absolute -bottom-8 -left-8 bg-white rounded-2xl shadow-xl p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#B3541E]">10,000+</div>
                  <div className="text-sm text-gray-600">Happy Customers</div>
                </div>
              </div>
              
              <div className="absolute -top-8 -right-8 bg-white rounded-2xl shadow-xl p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#362222]">24/7</div>
                  <div className="text-sm text-gray-600">Support</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-r from-[#362222] to-[#2d1b1b] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#B3541E] to-[#9a4519] rounded-xl flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
                    <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/>
                  </svg>
                </div>
                <div>
                  <span className="text-xl font-bold">illustraDesign</span>
                  <div className="text-xs text-gray-300 font-medium">STUDIO</div>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Transforming ideas into beautiful printed products with passion, precision, and unmatched quality.
              </p>
              <div className="flex space-x-4">
                {['📧', '📞', '📍'].map((icon, index) => (
                  <div key={index} className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                    <span>{icon}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-6 text-lg">Quick Links</h3>
              <ul className="space-y-3 text-gray-300">
                {['Home', 'Products', 'About', 'Contact'].map((link) => (
                  <li key={link}>
                    <Link to={`/${link.toLowerCase()}`} className="hover:text-[#B3541E] transition-colors">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-6 text-lg">Categories</h3>
              <ul className="space-y-3 text-gray-300">
                {['Clothing', 'Mugs', 'Business Cards', 'Posters'].map((category) => (
                  <li key={category}>
                    <Link to={`/products?category=${category.toLowerCase()}`} className="hover:text-[#B3541E] transition-colors">
                      {category}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-6 text-lg">Contact Info</h3>
              <div className="space-y-4 text-gray-300">
                <div className="flex items-center space-x-3">
                  <span>📧</span>
                  <span>info@illustradesign.com</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span>📞</span>
                  <span>+91 98765 43210</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span>📍</span>
                  <span>Mumbai, India</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-8 text-center text-gray-300">
            <p>&copy; 2025 IllustraDesign Studio. All rights reserved. Made with ❤️ for creators.</p>
          </div>
        </div>
      </footer>

      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

// Enhanced Products Page
const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [selectedCategory, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category_id', selectedCategory);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await axios.get(`${API}/products?${params}`);
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleQuickView = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold text-[#362222] mb-6"
          >
            Our Products
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Discover our wide range of customizable products designed to bring your creative vision to life
          </motion.p>
        </div>

        {/* Enhanced Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-12"
        >
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#B3541E] focus:border-[#B3541E] text-lg"
              />
            </div>

            {/* Category Filter */}
            <div className="lg:w-80">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#B3541E] focus:border-[#B3541E] text-lg"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#B3541E] border-t-transparent"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-[#B3541E] rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <ProductCard product={product} onQuickView={handleQuickView} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {!loading && products.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">No products found</h3>
            <p className="text-gray-600 text-lg">Try adjusting your search or filters to find what you're looking for.</p>
          </motion.div>
        )}
      </div>

      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

// Enhanced Cart Page
const CartPage = () => {
  const { cart, removeFromCart, fetchCart } = useAppContext();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      return total + (599 * item.quantity); // Using default price for demo
    }, 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-[#362222] mb-8"
        >
          Shopping Cart
        </motion.h1>

        {cart.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-lg p-16 text-center"
          >
            <div className="text-8xl mb-6">🛒</div>
            <h2 className="text-3xl font-semibold text-gray-600 mb-4">Your cart is empty</h2>
            <p className="text-gray-500 mb-8 text-lg">Discover our amazing products and add them to your cart!</p>
            <Link
              to="/products"
              className="inline-flex items-center space-x-3 bg-gradient-to-r from-[#B3541E] to-[#9a4519] text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-[#9a4519] hover:to-[#7d3615] transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <span>Continue Shopping</span>
              <motion.div className="group-hover:translate-x-1 transition-transform duration-300">→</motion.div>
            </Link>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl shadow-lg p-8">
                <h2 className="text-2xl font-semibold mb-8">Cart Items ({cart.length})</h2>
                <div className="space-y-6">
                  {cart.map((item, index) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-6 p-6 border border-gray-100 rounded-2xl hover:shadow-md transition-shadow"
                    >
                      <img
                        src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab"
                        alt="Product"
                        className="w-24 h-24 object-cover rounded-xl"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-lg">Custom Product</h3>
                        <p className="text-gray-600">Size: {item.size || 'M'}</p>
                        <p className="text-[#B3541E] font-semibold text-lg">₹599</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                          <MinusIcon className="h-4 w-4" />
                        </button>
                        <span className="w-12 text-center font-medium text-lg">{item.quantity}</span>
                        <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-3xl shadow-lg p-8 sticky top-8"
              >
                <h2 className="text-2xl font-semibold mb-8">Order Summary</h2>
                <div className="space-y-6">
                  <div className="flex justify-between text-lg">
                    <span>Subtotal</span>
                    <span>₹{getTotalPrice()}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span>Shipping</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span>Tax</span>
                    <span>₹{Math.round(getTotalPrice() * 0.18)}</span>
                  </div>
                  <div className="border-t pt-6">
                    <div className="flex justify-between font-bold text-xl">
                      <span>Total</span>
                      <span>₹{getTotalPrice() + Math.round(getTotalPrice() * 0.18)}</span>
                    </div>
                  </div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-[#B3541E] to-[#9a4519] text-white py-4 rounded-xl text-lg font-semibold hover:from-[#9a4519] hover:to-[#7d3615] transition-all duration-300 shadow-lg mt-8"
                >
                  Proceed to Checkout
                </motion.button>

                {/* Trust badges */}
                <div className="mt-8 space-y-4">
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <ShieldCheckIcon className="h-5 w-5 text-green-500" />
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <TruckIcon className="h-5 w-5 text-blue-500" />
                    <span>Free shipping on orders over ₹500</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <CheckCircleIcon className="h-5 w-5 text-purple-500" />
                    <span>30-day return policy</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Checkout Page
const CheckoutPage = () => {
  const { cart, user } = useAppContext();
  const [formData, setFormData] = useState({
    billingAddress: '',
    phone: '',
    couponCode: '',
    shippingOption: 'standard'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (599 * item.quantity), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/orders`, {
        billing_address: formData.billingAddress,
        phone: formData.phone
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Order placed successfully! 🎉', {
        style: {
          borderRadius: '12px',
          background: '#10b981',
          color: '#fff',
        },
      });

      navigate('/profile');
    } catch (error) {
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4 text-lg">Please login to proceed with checkout</p>
          <Link to="/login" className="bg-[#B3541E] text-white px-6 py-3 rounded-lg hover:bg-[#9a4519] transition-colors">
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4 text-lg">Your cart is empty</p>
          <Link to="/products" className="bg-[#B3541E] text-white px-6 py-3 rounded-lg hover:bg-[#9a4519] transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-[#362222] mb-8"
        >
          Checkout
        </motion.h1>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Billing Information */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-lg p-8"
            >
              <h2 className="text-2xl font-semibold mb-6">Billing Information</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Address</label>
                  <textarea
                    required
                    rows="3"
                    value={formData.billingAddress}
                    onChange={(e) => setFormData({...formData, billingAddress: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#B3541E] focus:border-[#B3541E]"
                    placeholder="Enter your complete address..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#B3541E] focus:border-[#B3541E]"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            </motion.div>

            {/* Shipping Options */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl shadow-lg p-8"
            >
              <h2 className="text-2xl font-semibold mb-6">Shipping Options</h2>
              <div className="space-y-4">
                {[
                  { id: 'standard', name: 'Standard Delivery', time: '5-7 business days', price: 'Free' },
                  { id: 'express', name: 'Express Delivery', time: '2-3 business days', price: '₹99' },
                  { id: 'overnight', name: 'Overnight Delivery', time: 'Next business day', price: '₹299' }
                ].map((option) => (
                  <label key={option.id} className="flex items-center p-4 border border-gray-200 rounded-xl hover:border-[#B3541E] cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="shipping"
                      value={option.id}
                      checked={formData.shippingOption === option.id}
                      onChange={(e) => setFormData({...formData, shippingOption: e.target.value})}
                      className="text-[#B3541E] focus:ring-[#B3541E]"
                    />
                    <div className="ml-4 flex-1">
                      <div className="font-medium">{option.name}</div>
                      <div className="text-sm text-gray-600">{option.time}</div>
                    </div>
                    <div className="font-semibold text-[#B3541E]">{option.price}</div>
                  </label>
                ))}
              </div>
            </motion.div>

            {/* Payment Method */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl shadow-lg p-8"
            >
              <h2 className="text-2xl font-semibold mb-6">Payment Method</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center space-x-3">
                  <CreditCardIcon className="h-6 w-6 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-blue-800">Secure Payment</h3>
                    <p className="text-sm text-blue-600">Payment gateway integration available in production</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-3xl shadow-lg p-8 sticky top-8"
            >
              <h2 className="text-2xl font-semibold mb-6">Order Summary</h2>
              
              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <img
                      src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab"
                      alt="Product"
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">Custom Product</div>
                      <div className="text-xs text-gray-600">Qty: {item.quantity}</div>
                    </div>
                    <div className="font-semibold">₹{599 * item.quantity}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 border-t pt-6">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{getTotalPrice()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (18%)</span>
                  <span>₹{Math.round(getTotalPrice() * 0.18)}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-xl">
                    <span>Total</span>
                    <span>₹{getTotalPrice() + Math.round(getTotalPrice() * 0.18)}</span>
                  </div>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={isProcessing}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-[#B3541E] to-[#9a4519] text-white py-4 rounded-xl text-lg font-semibold hover:from-[#9a4519] hover:to-[#7d3615] transition-all duration-300 shadow-lg mt-8 disabled:opacity-50"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  'Place Order'
                )}
              </motion.button>
            </motion.div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Profile, Login, Register components (keeping existing enhanced versions)
const ProfilePage = () => {
  const { user } = useAppContext();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please login to view your profile</p>
          <Link to="/login" className="bg-[#B3541E] text-white px-6 py-2 rounded-md hover:bg-[#9a4519]">
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-[#362222] mb-8"
        >
          My Profile
        </motion.h1>

        <div className="grid md:grid-cols-3 gap-8">
          {/* User Info */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:col-span-1"
          >
            <div className="bg-white rounded-3xl shadow-lg p-8">
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-[#B3541E] to-[#9a4519] rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserIcon className="h-12 w-12 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-800">{user.name}</h2>
                <p className="text-gray-600">{user.email}</p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-gray-600 mt-1">{user.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Address</label>
                  <p className="text-gray-600 mt-1">{user.address || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Member Since</label>
                  <p className="text-gray-600 mt-1">{new Date(user.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Order History */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:col-span-2"
          >
            <div className="bg-white rounded-3xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold mb-8">Order History</h2>
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <p className="text-gray-500 mb-6 text-lg">No orders yet</p>
                  <Link
                    to="/products"
                    className="bg-[#B3541E] text-white px-6 py-3 rounded-xl hover:bg-[#9a4519] transition-colors"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">Order #{order.id.slice(-8)}</h3>
                          <p className="text-gray-600">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">₹{order.total_amount}</p>
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'dispatched' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="text-gray-600">
                        {order.items.length} item(s)
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const LoginPage = () => {
  const { login } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24 pb-12 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 mx-4"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#362222]">Welcome Back</h2>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#B3541E] focus:border-[#B3541E] transition-colors"
              placeholder="Enter your email"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#B3541E] focus:border-[#B3541E] transition-colors"
              placeholder="Enter your password"
            />
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-[#B3541E] to-[#9a4519] text-white py-3 rounded-xl font-semibold hover:from-[#9a4519] hover:to-[#7d3615] transition-all duration-300 shadow-lg"
          >
            Sign In
          </motion.button>
        </form>

        <p className="mt-8 text-center text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-[#B3541E] hover:text-[#9a4519] transition-colors">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

const RegisterPage = () => {
  const { register } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await register(formData);
    if (success) {
      navigate('/');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24 pb-12 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 mx-4"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#362222]">Create Account</h2>
          <p className="mt-2 text-gray-600">Join the IllustraDesign community</p>
        </div>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#B3541E] focus:border-[#B3541E] transition-colors"
              placeholder="Enter your full name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#B3541E] focus:border-[#B3541E] transition-colors"
              placeholder="Enter your email"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#B3541E] focus:border-[#B3541E] transition-colors"
              placeholder="Create a password"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#B3541E] focus:border-[#B3541E] transition-colors"
              placeholder="+91 98765 43210"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <textarea
              name="address"
              rows="2"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#B3541E] focus:border-[#B3541E] transition-colors"
              placeholder="Enter your address"
            />
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-[#B3541E] to-[#9a4519] text-white py-3 rounded-xl font-semibold hover:from-[#9a4519] hover:to-[#7d3615] transition-all duration-300 shadow-lg"
          >
            Create Account
          </motion.button>
        </form>

        <p className="mt-8 text-center text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-[#B3541E] hover:text-[#9a4519] transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

// Admin Wrapper Component
const AdminWrapper = () => {
  const { user } = useAppContext();
  return <AdminDashboard user={user} />;
};

// Main App Component
function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="App">
          <Navigation />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminWrapper />} />
          </Routes>
          <Toaster 
            position="top-right" 
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '12px',
              },
            }}
          />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;