import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

// Constants for predefined categories and order statuses
const PRODUCT_CATEGORIES = [
  'Supplements',
  'Herbal Remedies',
  'Essential Oils',
  'Wellness Devices',
  'Books',
] as const;

const ORDER_STATUSES = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const;

// Type definitions
type ProductCategory = typeof PRODUCT_CATEGORIES[number];
type ProductStatus = 'active' | 'inactive';
type OrderStatus = typeof ORDER_STATUSES[number];

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  stock_quantity: number;
  image_url: string | null;
  category: ProductCategory | null;
  status: ProductStatus;
  created_at: string;
  updated_at: string | null;
}

interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string | null;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
  product?: Product; // Optional product details
}

interface NewProductFormData {
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  image_url: string | null;
  category: ProductCategory;
  status: ProductStatus;
}

// Custom error type for better error handling
class StoreManagementError extends Error {
  constructor(message: string, public readonly details?: unknown) {
    super(message);
    this.name = 'StoreManagementError';
  }
}

/**
 * StoreManagement component for managing products, orders, and order items in the admin panel.
 * Allows admins to create, update, and delete products, as well as manage orders and their items.
 */
export function StoreManagement() {
  // State management for products
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState<NewProductFormData>({
    name: '',
    description: '',
    price: 0,
    stock_quantity: 0,
    image_url: null,
    category: PRODUCT_CATEGORIES[0],
    status: 'active',
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // State management for orders and order items
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<{ [orderId: string]: OrderItem[] }>({});
  const [expandedOrders, setExpandedOrders] = useState<{ [orderId: string]: boolean }>({});
  const [editingOrderStatus, setEditingOrderStatus] = useState<string | null>(null);

  // Authentication and admin status
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [bucketExists, setBucketExists] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Check authentication and admin status on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw new StoreManagementError('Failed to fetch user', error);

        if (!user) {
          toast.error('Please log in to manage the store');
          setIsAuthenticated(false);
          return;
        }

        setCurrentUserId(user.id);
        setIsAuthenticated(true);

        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            throw new StoreManagementError(
              `No profile found for user ID ${user.id}. Please ensure the user has a profile in the user_profiles table.`
            );
          }
          throw new StoreManagementError('Failed to fetch user profile', profileError);
        }

        if (!profile) {
          throw new StoreManagementError(
            `No profile found for user ID ${user.id}. Please ensure the user has a profile in the user_profiles table.`
          );
        }

        if (!profile.is_admin) {
          throw new StoreManagementError(
            `User ID ${user.id} is not an admin. Please set is_admin to true in the user_profiles table.`
          );
        }

        setIsAdmin(profile.is_admin === true);
      } catch (err) {
        const error = err instanceof StoreManagementError ? err : new StoreManagementError('Unexpected error during authentication', err);
        console.error(error.message, error.details);
        toast.error(error.message);
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    };

    fetchUser();
  }, []);

  // Check if the product-images bucket exists on mount
  useEffect(() => {
    const checkBucket = async () => {
      try {
        const { data, error } = await supabase.storage.getBucket('product-images');
        if (error || !data) {
          console.error('Product-images bucket not found:', error?.message || 'No bucket data');
          setBucketExists(false);
          toast.error(
            'The "product-images" bucket is missing. Image uploads will be skipped until the bucket is created. See console for instructions.'
          );
          console.log(
            'To enable image uploads, create the "product-images" bucket in Supabase:\n' +
            '1. Go to Supabase Dashboard > Storage.\n' +
            '2. Click "New Bucket".\n' +
            '3. Name the bucket "product-images" (case-sensitive).\n' +
            '4. Set the bucket to public (recommended for product images).\n' +
            '5. Add the following policies in Supabase Dashboard > Authentication > Policies:\n' +
            '   - Allow authenticated users to read:\n' +
            '     CREATE POLICY "Allow authenticated users to read product images" ON storage.objects\n' +
            '     FOR SELECT TO authenticated USING (bucket_id = \'product-images\');\n' +
            '   - Allow authenticated users to upload:\n' +
            '     CREATE POLICY "Allow authenticated users to upload product images" ON storage.objects\n' +
            '     FOR INSERT TO authenticated WITH CHECK (bucket_id = \'product-images\');\n' +
            '   - Allow authenticated users to update:\n' +
            '     CREATE POLICY "Allow authenticated users to update product images" ON storage.objects\n' +
            '     FOR UPDATE TO authenticated USING (bucket_id = \'product-images\');\n' +
            '6. Refresh the page after creating the bucket.'
          );
        } else {
          setBucketExists(true);
        }
      } catch (err) {
        console.error('Error checking bucket:', err);
        setBucketExists(false);
      }
    };

    checkBucket();
  }, []);

  // Fetch products, orders, and order items when authenticated and admin
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchProducts();
      fetchOrders();
    }
  }, [isAuthenticated, isAdmin]);

  /**
   * Fetches all products from the database.
   */
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42501') {
          throw new StoreManagementError(
            'Permission denied: Unable to fetch products. Please check RLS policies on the products table.',
            error
          );
        }
        throw new StoreManagementError('Failed to fetch products', error);
      }

      setProducts(data || []);
    } catch (err) {
      const error = err instanceof StoreManagementError ? err : new StoreManagementError('Unexpected error fetching products', err);
      console.error(error.message, error.details);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetches all orders from the database.
   */
  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42501') {
          throw new StoreManagementError(
            'Permission denied: Unable to fetch orders. Please check RLS policies on the orders table.',
            error
          );
        }
        throw new StoreManagementError('Failed to fetch orders', error);
      }

      setOrders(data || []);
      // Fetch order items for each order
      for (const order of data || []) {
        await fetchOrderItems(order.id);
      }
    } catch (err) {
      const error = err instanceof StoreManagementError ? err : new StoreManagementError('Unexpected error fetching orders', err);
      console.error(error.message, error.details);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetches order items for a specific order and enriches them with product details.
   * @param orderId - The ID of the order to fetch items for.
   */
  const fetchOrderItems = useCallback(async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*, product:products(name)')
        .eq('order_id', orderId);

      if (error) {
        if (error.code === '42501') {
          throw new StoreManagementError(
            'Permission denied: Unable to fetch order items. Please check RLS policies on the order_items table.',
            error
          );
        }
        throw new StoreManagementError('Failed to fetch order items', error);
      }

      setOrderItems((prev) => ({
        ...prev,
        [orderId]: data.map((item: any) => ({
          ...item,
          product: item.product ? { name: item.product.name } : undefined,
        })),
      }));
    } catch (err) {
      const error = err instanceof StoreManagementError ? err : new StoreManagementError('Unexpected error fetching order items', err);
      console.error(error.message, error.details);
      toast.error(error.message);
    }
  }, []);

  /**
   * Validates the product form data.
   * @param formData - The product form data to validate.
   * @returns True if valid, false otherwise.
   */
  const validateForm = (formData: NewProductFormData | Product): boolean => {
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return false;
    }
    if (formData.price === null || formData.price <= 0) {
      toast.error('Price must be greater than 0');
      return false;
    }
    if (formData.stock_quantity < 0) {
      toast.error('Stock quantity cannot be negative');
      return false;
    }
    return true;
  };

  /**
   * Uploads an image to Supabase Storage.
   * @param file - The image file to upload.
   * @returns The public URL of the uploaded image, or null if the upload fails.
   */
  const uploadImage = async (file: File): Promise<string | null> => {
    if (!bucketExists) {
      toast.error('Cannot upload image: "product-images" bucket is missing. See console for instructions.');
      return null;
    }

    try {
      const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSizeInBytes) {
        throw new StoreManagementError('Image file is too large. Maximum size is 5MB.');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        if (uploadError.message.includes('Bucket not found')) {
          setBucketExists(false);
          throw new StoreManagementError('Storage bucket not found. Please create the "product-images" bucket.');
        }
        if (uploadError.message.includes('The resource already exists')) {
          throw new StoreManagementError('File already exists. Try renaming the file.');
        }
        throw new StoreManagementError('Failed to upload image', uploadError);
      }

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      if (!data.publicUrl) {
        throw new StoreManagementError('Failed to retrieve image URL after upload.');
      }

      return data.publicUrl;
    } catch (err) {
      const error = err instanceof StoreManagementError ? err : new StoreManagementError('Unexpected error uploading image', err);
      console.error(error.message, error.details);
      toast.error(error.message);
      return null;
    }
  };

  /**
   * Handles image file selection and generates a preview.
   * @param file - The selected image file.
   */
  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    } else {
      setImagePreview(null);
    }
  };

  /**
   * Creates a new product.
   * @param e - The form submission event.
   */
  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !isAdmin) {
      toast.error('Please log in as an admin to create a product');
      return;
    }

    if (!validateForm(newProduct)) return;

    try {
      setIsLoading(true);
      let imageUrl: string | null = null;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl && bucketExists) return; // Stop if image upload fails and bucket exists
      }

      const { data, error } = await supabase.from('products').insert({
        name: newProduct.name.trim(),
        description: newProduct.description || null,
        price: newProduct.price,
        stock_quantity: newProduct.stock_quantity,
        image_url: imageUrl,
        category: newProduct.category || null,
        status: newProduct.status,
      }).select();

      if (error) {
        if (error.code === '42501') {
          throw new StoreManagementError(
            'Permission denied: Unable to create product. Please check RLS policies on the products table. Ensure the user is an admin in user_profiles.',
            error
          );
        }
        throw new StoreManagementError('Failed to create product', error);
      }

      if (!data || data.length === 0) {
        throw new StoreManagementError('Product not created - check database permissions');
      }

      toast.success('Product created successfully');
      setNewProduct({
        name: '',
        description: '',
        price: 0,
        stock_quantity: 0,
        image_url: null,
        category: PRODUCT_CATEGORIES[0],
        status: 'active',
      });
      setImageFile(null);
      setImagePreview(null);
      fetchProducts();
    } catch (err) {
      const error = err instanceof StoreManagementError ? err : new StoreManagementError('Unexpected error creating product', err);
      console.error(error.message, error.details);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Updates an existing product.
   * @param e - The form submission event.
   */
  const updateProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !isAdmin || !editingProduct) return;

    if (!validateForm(editingProduct)) return;

    try {
      setIsLoading(true);
      let imageUrl: string | null = editingProduct.image_url;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl && bucketExists) return; // Stop if image upload fails and bucket exists
      }

      const { error } = await supabase
        .from('products')
        .update({
          name: editingProduct.name.trim(),
          description: editingProduct.description || null,
          price: editingProduct.price,
          stock_quantity: editingProduct.stock_quantity,
          image_url: imageUrl,
          category: editingProduct.category || null,
          status: editingProduct.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingProduct.id);

      if (error) {
        if (error.code === '42501') {
          throw new StoreManagementError(
            'Permission denied: Unable to update product. Please check RLS policies on the products table.',
            error
          );
        }
        throw new StoreManagementError('Failed to update product', error);
      }

      toast.success('Product updated successfully');
      setEditingProduct(null);
      setImageFile(null);
      setImagePreview(null);
      fetchProducts();
    } catch (err) {
      const error = err instanceof StoreManagementError ? err : new StoreManagementError('Unexpected error updating product', err);
      console.error(error.message, error.details);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cancels the edit mode for a product and resets the form.
   */
  const cancelEdit = () => {
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview(null);
  };

  /**
   * Deletes a product.
   * @param id - The ID of the product to delete.
   */
  const deleteProduct = async (id: string) => {
    if (!isAuthenticated || !isAdmin) return;

    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      setIsLoading(true);
      const product = products.find((p) => p.id === id);
      if (product?.image_url && bucketExists) {
        const filePath = product.image_url.split('/').slice(-2).join('/');
        await supabase.storage.from('product-images').remove([filePath]);
      }

      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        if (error.code === '42501') {
          throw new StoreManagementError(
            'Permission denied: Unable to delete product. Please check RLS policies on the products table.',
            error
          );
        }
        throw new StoreManagementError('Failed to delete product', error);
      }

      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (err) {
      const error = err instanceof StoreManagementError ? err : new StoreManagementError('Unexpected error deleting product', err);
      console.error(error.message, error.details);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Updates the status of an order.
   * @param orderId - The ID of the order to update.
   * @param newStatus - The new status for the order.
   */
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (!isAuthenticated || !isAdmin) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) {
        if (error.code === '42501') {
          throw new StoreManagementError(
            'Permission denied: Unable to update order status. Please check RLS policies on the orders table.',
            error
          );
        }
        throw new StoreManagementError('Failed to update order status', error);
      }

      toast.success('Order status updated successfully');
      setEditingOrderStatus(null);
      fetchOrders();
    } catch (err) {
      const error = err instanceof StoreManagementError ? err : new StoreManagementError('Unexpected error updating order status', err);
      console.error(error.message, error.details);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Toggles the expanded state of an order to show/hide its items.
   * @param orderId - The ID of the order to toggle.
   */
  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  // Render loading or permission error states
  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Manage Store</h2>
        <p className="text-red-600">You must be logged in to manage the store.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Manage Store</h2>
        <p className="text-red-600">
          You do not have permission to manage the store. Your user ID is: {currentUserId}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Manage Store</h2>

      {/* Products Section */}
      <div className="mb-12">
        <h3 className="text-xl font-semibold mb-4">Products</h3>

        {/* Create Product Form */}
        <form onSubmit={createProduct} className="mb-8 p-4 bg-white rounded-lg shadow">
          <h4 className="text-lg font-semibold mb-4">Add New Product</h4>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={newProduct.name}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))}
              className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Price</label>
            <input
              type="number"
              step="0.01"
              value={newProduct.price}
              onChange={(e) =>
                setNewProduct((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
              }
              className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              required
              min="0.01"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Stock Quantity</label>
            <input
              type="number"
              value={newProduct.stock_quantity}
              onChange={(e) =>
                setNewProduct((prev) => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))
              }
              className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              required
              min="0"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Image (Optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e.target.files ? e.target.files[0] : null)}
              className="border p-2 w-full rounded"
              disabled={!bucketExists || isLoading}
            />
            {!bucketExists && (
              <p className="text-red-600 text-sm mt-1">
                Image upload is disabled because the "product-images" bucket is missing. See console for instructions.
              </p>
            )}
            {imagePreview && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700">Image Preview:</p>
                <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded" />
              </div>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              value={newProduct.category}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, category: e.target.value as ProductCategory }))}
              className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {PRODUCT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={newProduct.status}
              onChange={(e) =>
                setNewProduct((prev) => ({ ...prev, status: e.target.value as ProductStatus }))
              }
              className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={newProduct.description}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, description: e.target.value }))}
              className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
            />
          </div>
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Product'}
          </button>
        </form>

        {/* Product List */}
        <div className="bg-white rounded-lg shadow">
          {isLoading && (
            <div className="p-4 text-center text-gray-600">Loading products...</div>
          )}
          {!isLoading && products.length === 0 && (
            <div className="p-4 text-center text-gray-600">No products found.</div>
          )}
          {products.map((product) => (
            <div
              key={product.id}
              className="border-b p-4 flex flex-col md:flex-row md:justify-between md:items-start gap-4"
            >
              {editingProduct?.id === product.id ? (
                <form onSubmit={updateProduct} className="flex-1">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      value={editingProduct.name}
                      onChange={(e) =>
                        setEditingProduct((prev) => ({ ...prev!, name: e.target.value }))
                      }
                      className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.price || 0}
                      onChange={(e) =>
                        setEditingProduct((prev) => ({
                          ...prev!,
                          price: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      min="0.01"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Stock Quantity</label>
                    <input
                      type="number"
                      value={editingProduct.stock_quantity}
                      onChange={(e) =>
                        setEditingProduct((prev) => ({
                          ...prev!,
                          stock_quantity: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      min="0"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Image (Optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e.target.files ? e.target.files[0] : null)}
                      className="border p-2 w-full rounded"
                      disabled={!bucketExists || isLoading}
                    />
                    {!bucketExists && (
                      <p className="text-red-600 text-sm mt-1">
                        Image upload is disabled because the "product-images" bucket is missing. See console for instructions.
                      </p>
                    )}
                    {imagePreview && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Image Preview:</p>
                        <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded" />
                      </div>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      value={editingProduct.category || ''}
                      onChange={(e) =>
                        setEditingProduct((prev) => ({ ...prev!, category: e.target.value as ProductCategory }))
                      }
                      className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {PRODUCT_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={editingProduct.status}
                      onChange={(e) =>
                        setEditingProduct((prev) => ({
                          ...prev!,
                          status: e.target.value as ProductStatus,
                        }))
                      }
                      className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={editingProduct.description || ''}
                      onChange={(e) =>
                        setEditingProduct((prev) => ({ ...prev!, description: e.target.value }))
                      }
                      className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 mt-2 z-10">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed pointer-events-auto"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:bg-gray-300 disabled:cursor-not-allowed pointer-events-auto"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex-1">
                  <h4 className="text-lg font-semibold">{product.name}</h4>
                  <p className="text-gray-600"><strong>Price:</strong> ${product.price?.toFixed(2) || '0.00'}</p>
                  <p className="text-gray-600"><strong>Stock Quantity:</strong> {product.stock_quantity}</p>
                  {product.image_url && (
                    <p className="text-gray-600">
                      <strong>Image:</strong>{' '}
                      <img src={product.image_url} alt={product.name} className="w-20 h-20 object-cover inline-block rounded" />
                    </p>
                  )}
                  <p className="text-gray-600"><strong>Category:</strong> {product.category || 'None'}</p>
                  <p className="text-gray-600"><strong>Status:</strong> {product.status}</p>
                  <p className="text-gray-600"><strong>Description:</strong> {product.description || 'None'}</p>
                  <p className="text-sm text-gray-500">Created: {new Date(product.created_at).toLocaleString()}</p>
                  {product.updated_at && (
                    <p className="text-sm text-gray-500">Updated: {new Date(product.updated_at).toLocaleString()}</p>
                  )}
                </div>
              )}
              {editingProduct?.id !== product.id && (
                <div className="flex gap-2 z-10">
                  <button
                    onClick={() => setEditingProduct(product)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:bg-gray-400 disabled:cursor-not-allowed pointer-events-auto"
                    disabled={isLoading}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed pointer-events-auto"
                    disabled={isLoading}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Orders Section */}
      <div className="mb-12">
        <h3 className="text-xl font-semibold mb-4">Orders</h3>
        <div className="bg-white rounded-lg shadow">
          {isLoading && (
            <div className="p-4 text-center text-gray-600">Loading orders...</div>
          )}
          {!isLoading && orders.length === 0 && (
            <div className="p-4 text-center text-gray-600">No orders found.</div>
          )}
          {orders.map((order) => (
            <div key={order.id} className="border-b p-4">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold">Order #{order.id.slice(0, 8)}</h4>
                  <p className="text-gray-600"><strong>User ID:</strong> {order.user_id}</p>
                  <p className="text-gray-600"><strong>Total Amount:</strong> ${order.total_amount.toFixed(2)}</p>
                  <p className="text-gray-600">
                    <strong>Status:</strong>{' '}
                    {editingOrderStatus === order.id ? (
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                        className="border p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}{' '}
                        <button
                          onClick={() => setEditingOrderStatus(order.id)}
                          className="text-blue-600 hover:underline text-sm"
                          disabled={isLoading}
                        >
                          Edit
                        </button>
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500">Created: {new Date(order.created_at).toLocaleString()}</p>
                  {order.updated_at && (
                    <p className="text-sm text-gray-500">Updated: {new Date(order.updated_at).toLocaleString()}</p>
                  )}
                </div>
                <div className="flex gap-2 z-10">
                  <button
                    onClick={() => toggleOrderExpansion(order.id)}
                    className="bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:bg-gray-400 disabled:cursor-not-allowed pointer-events-auto"
                    disabled={isLoading}
                  >
                    {expandedOrders[order.id] ? 'Hide Items' : 'Show Items'}
                  </button>
                </div>
              </div>
              {expandedOrders[order.id] && (
                <div className="mt-4 pl-4">
                  <h5 className="text-md font-semibold mb-2">Order Items</h5>
                  {orderItems[order.id]?.length ? (
                    <div className="border rounded-lg">
                      {orderItems[order.id].map((item) => (
                        <div key={item.id} className="border-b p-2 last:border-b-0">
                          <p className="text-gray-600">
                            <strong>Product:</strong> {item.product?.name || 'Unknown Product'}
                          </p>
                          <p className="text-gray-600"><strong>Quantity:</strong> {item.quantity}</p>
                          <p className="text-gray-600"><strong>Unit Price:</strong> ${item.unit_price.toFixed(2)}</p>
                          <p className="text-gray-600"><strong>Subtotal:</strong> ${(item.quantity * item.unit_price).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No items found for this order.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}