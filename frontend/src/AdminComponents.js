import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  PlusIcon, 
  TrashIcon, 
  EyeIcon, 
  XMarkIcon,
  CloudArrowUpIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Admin Dashboard Component
export const AdminDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({});

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-12 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'products', name: 'Products', icon: '📦' },
    { id: 'categories', name: 'Categories', icon: '📋' },
    { id: 'orders', name: 'Orders', icon: '🛒' },
    { id: 'customers', name: 'Customers', icon: '👥' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#362222]">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your IllustraDesign Studio</p>
        </div>

        <div className="grid lg:grid-cols-6 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left p-3 rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[#B3541E] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-3">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-5">
            {activeTab === 'dashboard' && <AdminDashboardStats stats={stats} />}
            {activeTab === 'products' && <AdminProducts />}
            {activeTab === 'categories' && <AdminCategories />}
            {activeTab === 'orders' && <AdminOrders />}
            {activeTab === 'customers' && <AdminCustomers />}
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Stats Component
const AdminDashboardStats = ({ stats, setActiveTab }) => {
  const statCards = [
    {
      title: 'Total Orders',
      value: stats.total_orders || 0,
      icon: '🛒',
      color: 'bg-blue-500'
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.total_revenue || 0}`,
      icon: '💰',
      color: 'bg-green-500'
    },
    {
      title: 'Total Products',
      value: stats.total_products || 0,
      icon: '📦',
      color: 'bg-purple-500'
    },
    {
      title: 'Total Customers',
      value: stats.total_users || 0,
      icon: '👥',
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center">
              <div className={`${stat.color} text-white p-3 rounded-lg mr-4`}>
                <span className="text-xl">{stat.icon}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Quick Actions</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('products')}
                  className="bg-gradient-to-br from-primary-600 to-accent-600 text-white p-6 rounded-2xl hover:shadow-elegant-lg transition-all duration-300"
                >
                  <div className="text-center space-y-3">
                    <div className="text-3xl">➕</div>
                    <div className="font-medium">Add Product</div>
                    <div className="text-xs opacity-80">Create new product listing</div>
                  </div>
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('categories')}
                  className="bg-gradient-to-br from-neutral-700 to-neutral-800 text-white p-6 rounded-2xl hover:shadow-elegant-lg transition-all duration-300"
                >
                  <div className="text-center space-y-3">
                    <div className="text-3xl">📋</div>
                    <div className="font-medium">Add Category</div>
                    <div className="text-xs opacity-80">Organize your products</div>
                  </div>
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('orders')}
                  className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-2xl hover:shadow-elegant-lg transition-all duration-300"
                >
                  <div className="text-center space-y-3">
                    <div className="text-3xl">📦</div>
                    <div className="font-medium">Manage Orders</div>
                    <div className="text-xs opacity-80">Process customer orders</div>
                  </div>
                </motion.button>
              </div>
            </div>
    </div>
  );
};

// Admin Products Component
const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    subcategory_id: '',
    price: '',
    sizes: [],
    is_customizable: false,
    quantity: ''
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSizes();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
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

  const fetchSubcategories = async (categoryId) => {
    try {
      const response = await axios.get(`${API}/subcategories?category_id=${categoryId}`);
      setSubcategories(response.data);
    } catch (error) {
      console.error('Failed to fetch subcategories:', error);
    }
  };

  const fetchSizes = async () => {
    try {
      const response = await axios.get(`${API}/sizes`);
      setSizes(response.data);
    } catch (error) {
      console.error('Failed to fetch sizes:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Upload images first if any are selected
      let uploadedImageUrls = [];
      if (imageFiles.length > 0) {
        uploadedImageUrls = await uploadImages();
      }
      
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        images: uploadedImageUrls.length > 0 ? uploadedImageUrls : (editingProduct ? editingProduct.images : [])
      };

      if (editingProduct) {
        await axios.put(`${API}/products/${editingProduct.id}`, productData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Product updated successfully! 🎉', {
          style: {
            borderRadius: '12px',
            background: '#10b981',
            color: '#fff',
          },
        });
      } else {
        await axios.post(`${API}/products`, productData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Product added successfully! ✨', {
          style: {
            borderRadius: '12px',
            background: '#10b981',
            color: '#fff',
          },
        });
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        category_id: '',
        subcategory_id: '',
        price: '',
        sizes: [],
        is_customizable: false,
        quantity: ''
      });
      setImageFiles([]);
      setShowAddForm(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to save product');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Product deleted successfully!');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description,
      category_id: product.category_id,
      subcategory_id: product.subcategory_id || '',
      price: product.price.toString(),
      sizes: product.sizes,
      is_customizable: product.is_customizable,
      quantity: product.quantity.toString()
    });
    setShowAddForm(true);
    if (product.category_id) {
      fetchSubcategories(product.category_id);
    }
  };

  const handleCategoryChange = (categoryId) => {
    setFormData({ ...formData, category_id: categoryId, subcategory_id: '' });
    if (categoryId) {
      fetchSubcategories(categoryId);
    }
  };

  const handleSizeToggle = (sizeName) => {
    const newSizes = formData.sizes.includes(sizeName)
      ? formData.sizes.filter(s => s !== sizeName)
      : [...formData.sizes, sizeName];
    setFormData({ ...formData, sizes: newSizes });
  };

  const handleImageUpload = (files) => {
    const newFiles = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setImageFiles(prev => [...prev, ...newFiles]);
  };

  const removeImage = (index) => {
    setImageFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const uploadImages = async () => {
    if (imageFiles.length === 0) return [];
    
    setUploadingImages(true);
    const uploadedUrls = [];
    
    try {
      for (const imageFile of imageFiles) {
        const formData = new FormData();
        formData.append('file', imageFile.file);
        formData.append('folder', 'products');
        
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API}/upload-image`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        uploadedUrls.push(response.data.image_url);
      }
      
      return uploadedUrls;
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error('Failed to upload images');
      return [];
    } finally {
      setUploadingImages(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Products Management</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-[#B3541E] text-white px-4 py-2 rounded-md hover:bg-[#9a4519] transition-colors"
        >
          <PlusIcon className="h-5 w-5 inline mr-2" />
          Add Product
        </button>
      </div>

      {/* Add/Edit Product Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#B3541E] focus:border-[#B3541E]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
                <input
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#B3541E] focus:border-[#B3541E]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                required
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#B3541E] focus:border-[#B3541E]"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  required
                  value={formData.category_id}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#B3541E] focus:border-[#B3541E]"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
                <select
                  value={formData.subcategory_id}
                  onChange={(e) => setFormData({ ...formData, subcategory_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#B3541E] focus:border-[#B3541E]"
                >
                  <option value="">Select Subcategory</option>
                  {subcategories.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#B3541E] focus:border-[#B3541E]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sizes</label>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => handleSizeToggle(size.name)}
                    className={`px-3 py-1 rounded-md border ${
                      formData.sizes.includes(size.name)
                        ? 'bg-[#B3541E] text-white border-[#B3541E]'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-[#B3541E]'
                    }`}
                  >
                    {size.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Customizable Option */}
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
              <input
                type="checkbox"
                id="customizable"
                checked={formData.is_customizable}
                onChange={(e) => setFormData({ ...formData, is_customizable: e.target.checked })}
                className="w-5 h-5 text-[#B3541E] bg-gray-100 border-gray-300 rounded focus:ring-[#B3541E] focus:ring-2"
              />
              <label htmlFor="customizable" className="text-sm font-medium text-gray-700">
                <span className="font-semibold">Allow customer customization</span>
                <span className="block text-xs text-gray-500 mt-1">
                  Customers can upload their own images for this product
                </span>
              </label>
            </div>

            {/* Product Images */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Images</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#B3541E] transition-colors">
                  <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-gray-600">Drag & drop images here, or click to select</p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      id="image-upload"
                      onChange={(e) => handleImageUpload(e.target.files)}
                    />
                    <label
                      htmlFor="image-upload"
                      className="inline-flex items-center px-4 py-2 bg-[#B3541E] text-white rounded-lg hover:bg-[#9a4519] cursor-pointer transition-colors"
                    >
                      <PhotoIcon className="h-5 w-5 mr-2" />
                      Choose Images
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">PNG, JPG, WebP up to 5MB each</p>
                </div>
                
                {/* Image Preview */}
                {imageFiles.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    {imageFiles.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={file.preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#B3541E] text-white px-6 py-2 rounded-md hover:bg-[#9a4519] transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingProduct(null);
                  setFormData({
                    title: '',
                    description: '',
                    category_id: '',
                    subcategory_id: '',
                    price: '',
                    sizes: [],
                    is_customizable: false,
                    quantity: ''
                  });
                }}
                className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">All Products ({products.length})</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customizable
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={product.images[0] || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab'}
                          alt={product.title}
                          className="h-12 w-12 object-cover rounded-md mr-4"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.title}</div>
                          <div className="text-sm text-gray-500">{product.description.slice(0, 50)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{product.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.is_customizable 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.is_customizable ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-[#B3541E] hover:text-[#9a4519]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Admin Categories Component
const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddSubcategory, setShowAddSubcategory] = useState(false);
  const [showAddSize, setShowAddSize] = useState(false);
  const [loading, setLoading] = useState(false);

  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [subcategoryForm, setSubcategoryForm] = useState({ name: '', category_id: '', description: '' });
  const [sizeForm, setSizeForm] = useState({ name: '', category_id: '' });

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
    fetchSizes();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchSubcategories = async () => {
    try {
      const response = await axios.get(`${API}/subcategories`);
      setSubcategories(response.data);
    } catch (error) {
      console.error('Failed to fetch subcategories:', error);
    }
  };

  const fetchSizes = async () => {
    try {
      const response = await axios.get(`${API}/sizes`);
      setSizes(response.data);
    } catch (error) {
      console.error('Failed to fetch sizes:', error);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/categories`, categoryForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Category added successfully!');
      setCategoryForm({ name: '', description: '' });
      setShowAddCategory(false);
      fetchCategories();
    } catch (error) {
      toast.error('Failed to add category');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubcategory = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/subcategories`, subcategoryForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Subcategory added successfully!');
      setSubcategoryForm({ name: '', category_id: '', description: '' });
      setShowAddSubcategory(false);
      fetchSubcategories();
    } catch (error) {
      toast.error('Failed to add subcategory');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSize = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/sizes`, sizeForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Size added successfully!');
      setSizeForm({ name: '', category_id: '' });
      setShowAddSize(false);
      fetchSizes();
    } catch (error) {
      toast.error('Failed to add size');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">Categories & Organization</h2>

      {/* Categories Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Categories ({categories.length})</h3>
          <button
            onClick={() => setShowAddCategory(true)}
            className="bg-[#B3541E] text-white px-4 py-2 rounded-md hover:bg-[#9a4519] transition-colors"
          >
            <PlusIcon className="h-5 w-5 inline mr-2" />
            Add Category
          </button>
        </div>

        {showAddCategory && (
          <form onSubmit={handleAddCategory} className="mb-6 p-4 border border-gray-200 rounded-md">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#B3541E] focus:border-[#B3541E]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#B3541E] focus:border-[#B3541E]"
                />
              </div>
            </div>
            <div className="flex space-x-4 mt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#B3541E] text-white px-4 py-2 rounded-md hover:bg-[#9a4519] transition-colors disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Category'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddCategory(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div key={category.id} className="border border-gray-200 rounded-md p-4">
              <h4 className="font-semibold text-gray-800">{category.name}</h4>
              <p className="text-sm text-gray-600 mt-1">{category.description}</p>
              <div className="text-xs text-gray-400 mt-2">
                {subcategories.filter(sub => sub.category_id === category.id).length} subcategories
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subcategories Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Subcategories ({subcategories.length})</h3>
          <button
            onClick={() => setShowAddSubcategory(true)}
            className="bg-[#362222] text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            <PlusIcon className="h-5 w-5 inline mr-2" />
            Add Subcategory
          </button>
        </div>

        {showAddSubcategory && (
          <form onSubmit={handleAddSubcategory} className="mb-6 p-4 border border-gray-200 rounded-md">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  required
                  value={subcategoryForm.category_id}
                  onChange={(e) => setSubcategoryForm({ ...subcategoryForm, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#B3541E] focus:border-[#B3541E]"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  required
                  value={subcategoryForm.name}
                  onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#B3541E] focus:border-[#B3541E]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={subcategoryForm.description}
                  onChange={(e) => setSubcategoryForm({ ...subcategoryForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#B3541E] focus:border-[#B3541E]"
                />
              </div>
            </div>
            <div className="flex space-x-4 mt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#362222] text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Subcategory'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddSubcategory(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subcategories.map((subcategory) => {
                const category = categories.find(cat => cat.id === subcategory.category_id);
                return (
                  <tr key={subcategory.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {subcategory.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {subcategory.description}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sizes Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Sizes ({sizes.length})</h3>
          <button
            onClick={() => setShowAddSize(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 inline mr-2" />
            Add Size
          </button>
        </div>

        {showAddSize && (
          <form onSubmit={handleAddSize} className="mb-6 p-4 border border-gray-200 rounded-md">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  required
                  value={sizeForm.category_id}
                  onChange={(e) => setSizeForm({ ...sizeForm, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#B3541E] focus:border-[#B3541E]"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Size Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., S, M, L, XL"
                  value={sizeForm.name}
                  onChange={(e) => setSizeForm({ ...sizeForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#B3541E] focus:border-[#B3541E]"
                />
              </div>
            </div>
            <div className="flex space-x-4 mt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Size'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddSize(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => {
            const category = categories.find(cat => cat.id === size.category_id);
            return (
              <div key={size.id} className="bg-gray-100 px-3 py-2 rounded-md">
                <span className="font-semibold">{size.name}</span>
                <span className="text-sm text-gray-500 ml-2">({category?.name})</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Admin Orders Component
const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/orders/${orderId}/status?status=${status}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Order status updated!');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'preparing': return 'bg-yellow-100 text-yellow-800';
      case 'dispatched': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B3541E]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Orders Management</h2>
        <div className="text-sm text-gray-600">
          Total Orders: {orders.length}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order.id.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      User ID: {order.user_id.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.items.length} item(s)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{order.total_amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded-md px-2 py-1"
                      >
                        <option value="preparing">Preparing</option>
                        <option value="dispatched">Dispatched</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No orders found.</p>
        </div>
      )}
    </div>
  );
};

// Admin Customers Component
const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      // Note: You'd need to implement a customers endpoint in the backend
      // For now, this is a placeholder
      setCustomers([]);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Customers Management</h2>
        <div className="text-sm text-gray-600">
          Total Customers: {customers.length}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Customer management feature coming soon!</p>
          <p className="text-sm text-gray-400 mt-2">
            This will show customer list, order history, and customer analytics.
          </p>
        </div>
      </div>
    </div>
  );
};