import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { Navigate } from 'react-router-dom';

// Type definitions
interface AdminStats {
  totalOrders: number;
  totalProducts: number;
  totalConsultants: number;
  pendingRemedies: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  status: 'active' | 'inactive';
  created_at: string;
}

interface Consultant {
  id: string;
  name: string;
  email: string;
  specialty: string;
  status: 'active' | 'inactive';
  created_at: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
  product?: Product;
}

interface Order {
  id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  created_at: string;
  order_items?: OrderItem[];
}

interface Remedy {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

class AdminDashboardError extends Error {
  constructor(message: string, public readonly details?: unknown) {
    super(message);
    this.name = 'AdminDashboardError';
  }
}

export function AdminDashboard() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'consultants' | 'orders' | 'remedies'>('overview');
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [stats, setStats] = useState<AdminStats>({
    totalOrders: 0,
    totalProducts: 0,
    totalConsultants: 0,
    pendingRemedies: 0,
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pendingRemedies, setPendingRemedies] = useState<Remedy[]>([]);

  if (!user || !profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);

      const [
        ordersResponse,
        productsResponse,
        consultantsResponse,
        remediesResponse,
      ] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('consultants').select('*', { count: 'exact', head: true }),
        supabase.from('remedies').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      if (ordersResponse.error) {
        throw new AdminDashboardError('Failed to fetch orders count', ordersResponse.error);
      }
      if (productsResponse.error) {
        throw new AdminDashboardError('Failed to fetch products count', productsResponse.error);
      }
      if (consultantsResponse.error) {
        throw new AdminDashboardError('Failed to fetch consultants count', consultantsResponse.error);
      }
      if (remediesResponse.error) {
        throw new AdminDashboardError('Failed to fetch pending remedies count', remediesResponse.error);
      }

      setStats({
        totalOrders: ordersResponse.count || 0,
        totalProducts: productsResponse.count || 0,
        totalConsultants: consultantsResponse.count || 0,
        pendingRemedies: remediesResponse.count || 0,
      });

      await fetchTabData(activeTab);
    } catch (err) {
      const error = err instanceof AdminDashboardError ? err : new AdminDashboardError('Unexpected error fetching admin data', err);
      console.error(error.message, error.details);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const fetchTabData = useCallback(async (tab: typeof activeTab) => {
    try {
      setTabLoading(true);

      switch (tab) {
        case 'products':
          console.log('Fetching products...');
          const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
          if (productsError) {
            console.error('Products fetch error:', productsError);
            if (productsError.code === '42501') {
              throw new AdminDashboardError(
                'Permission denied: Unable to fetch products. Please check RLS policies on the products table.',
                productsError
              );
            }
            throw new AdminDashboardError('Failed to fetch products', productsError);
          }
          console.log('Products fetched:', productsData);
          setProducts(productsData || []);
          break;

        case 'consultants':
          console.log('Fetching consultants...');
          const { data: consultantsData, error: consultantsError } = await supabase
            .from('consultants')
            .select('*')
            .order('created_at', { ascending: false });
          if (consultantsError) {
            console.error('Consultants fetch error:', consultantsError);
            if (consultantsError.code === '42501') {
              throw new AdminDashboardError(
                'Permission denied: Unable to fetch consultants. Please check RLS policies on the consultants table.',
                consultantsError
              );
            }
            throw new AdminDashboardError('Failed to fetch consultants', consultantsError);
          }
          console.log('Consultants fetched:', consultantsData);
          setConsultants(consultantsData || []);
          break;

        case 'orders':
          console.log('Fetching orders...');
          const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select('*, order_items(*, product:products(name))')
            .order('created_at', { ascending: false });
          if (ordersError) {
            console.error('Orders fetch error:', ordersError);
            if (ordersError.code === '42501') {
              throw new AdminDashboardError(
                'Permission denied: Unable to fetch orders. Please check RLS policies on the orders table.',
                ordersError
              );
            }
            throw new AdminDashboardError('Failed to fetch orders', ordersError);
          }
          console.log('Orders fetched:', ordersData);
          setOrders(ordersData || []);
          break;

        case 'remedies':
          console.log('Fetching remedies...');
          const { data: remediesData, error: remediesError } = await supabase
            .from('remedies')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
          if (remediesError) {
            console.error('Remedies fetch error:', remediesError);
            if (remediesError.code === '42501') {
              throw new AdminDashboardError(
                'Permission denied: Unable to fetch remedies. Please check RLS policies on the remedies table.',
                remediesError
              );
            }
            throw new AdminDashboardError('Failed to fetch remedies', remediesError);
          }
          console.log('Remedies fetched:', remediesData);
          setPendingRemedies(remediesData || []);
          break;

        default:
          break;
      }
    } catch (err) {
      const error = err instanceof AdminDashboardError ? err : new AdminDashboardError('Unexpected error fetching tab data', err);
      console.error('Fetch tab data error:', error.message, error.details);
      toast.error(error.message);
    } finally {
      setTabLoading(false);
    }
  }, []);

  const handleRemedyAction = async (action: 'approve' | 'reject', remedyId: string) => {
    try {
      const { error } = await supabase
        .from('remedies')
        .update({ status: action })
        .eq('id', remedyId);
      if (error) throw new AdminDashboardError(`Failed to ${action} remedy`, error);
      await fetchTabData('remedies');
      toast.success(`Remedy ${action}d successfully`);
    } catch (err) {
      const error = err instanceof AdminDashboardError ? err : new AdminDashboardError('Unexpected error updating remedy', err);
      console.error(error.message, error.details);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-600">Total Orders</h3>
            <p className="text-2xl font-bold text-green-900">{stats.totalOrders}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-600">Products</h3>
            <p className="text-2xl font-bold text-blue-900">{stats.totalProducts}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-600">Consultants</h3>
            <p className="text-2xl font-bold text-purple-900">{stats.totalConsultants}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-600">Pending Remedies</h3>
            <p className="text-2xl font-bold text-yellow-900">{stats.pendingRemedies}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {['overview', 'products', 'consultants', 'orders', 'remedies'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab as typeof activeTab);
                  fetchTabData(tab as typeof activeTab);
                }}
                className={`
                  ${activeTab === tab
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                `}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {tabLoading && (
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="text-center text-gray-600">
              <p>Select a tab to view details.</p>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="relative overflow-x-auto scroll-shadow">
              <table className="w-full min-w-[1200px] divide-y divide-gray-200">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[200px]">
                      Name
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                      Price
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                      Stock Quantity
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                      Status
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                      Created At
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[200px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.length === 0 && !tabLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No products found.
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${product.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.stock_quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {product.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(product.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={async () => {
                              const { error } = await supabase
                                .from('products')
                                .update({ status: product.status === 'active' ? 'inactive' : 'active' })
                                .eq('id', product.id);
                              if (error) {
                                toast.error('Failed to update product status: ' + error.message);
                              } else {
                                await fetchTabData('products');
                                toast.success('Product status updated successfully');
                              }
                            }}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            {product.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to delete this product?')) {
                                const { error } = await supabase
                                  .from('products')
                                  .delete()
                                  .eq('id', product.id);
                                if (error) {
                                  toast.error('Failed to delete product: ' + error.message);
                                } else {
                                  await fetchTabData('products');
                                  toast.success('Product deleted successfully');
                                }
                              }
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'consultants' && (
            <div className="relative overflow-x-auto scroll-shadow">
              <table className="w-full min-w-[1600px] divide-y divide-gray-200">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[200px]">
                      Name
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[250px]">
                      Email
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[200px]">
                      Specialty
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[300px]">
                      Bio
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                      Status
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                      Created At
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[200px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {consultants.length === 0 && !tabLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        No consultants found.
                      </td>
                    </tr>
                  ) : (
                    consultants.map((consultant) => (
                      <tr key={consultant.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {consultant.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {consultant.email || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {consultant.specialty || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-[300px] truncate">
                          {consultant.bio || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              consultant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {consultant.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(consultant.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={async () => {
                              const { error } = await supabase
                                .from('consultants')
                                .update({ status: consultant.status === 'active' ? 'inactive' : 'active' })
                                .eq('id', consultant.id);
                              if (error) {
                                toast.error('Failed to update consultant status: ' + error.message);
                              } else {
                                await fetchTabData('consultants');
                                toast.success('Consultant status updated successfully');
                              }
                            }}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            {consultant.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to delete this consultant?')) {
                                const { error } = await supabase
                                  .from('consultants')
                                  .delete()
                                  .eq('id', consultant.id);
                                if (error) {
                                  toast.error('Failed to delete consultant: ' + error.message);
                                } else {
                                  await fetchTabData('consultants');
                                  toast.success('Consultant deleted successfully');
                                }
                              }
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="relative overflow-x-auto scroll-shadow">
              <table className="w-full min-w-[1200px] divide-y divide-gray-200">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                      Order ID
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                      User ID
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                      Status
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                      Created At
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[200px]">
                      Items
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[200px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.length === 0 && !tabLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        No orders found.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.user_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${order.total_amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              order.status === 'delivered'
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {order.order_items?.map((item) => (
                            <div key={item.id}>
                              {item.product?.name} (Qty: {item.quantity})
                            </div>
                          ))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={async () => {
                              const newStatus =
                                order.status === 'pending'
                                  ? 'processing'
                                  : order.status === 'processing'
                                  ? 'shipped'
                                  : order.status === 'shipped'
                                  ? 'delivered'
                                  : 'pending';
                              const { error } = await supabase
                                .from('orders')
                                .update({ status: newStatus })
                                .eq('id', order.id);
                              if (error) {
                                toast.error('Failed to update order status: ' + error.message);
                              } else {
                                await fetchTabData('orders');
                                toast.success('Order status updated successfully');
                              }
                            }}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Update Status
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to cancel this order?')) {
                                const { error } = await supabase
                                  .from('orders')
                                  .update({ status: 'cancelled' })
                                  .eq('id', order.id);
                                if (error) {
                                  toast.error('Failed to cancel order: ' + error.message);
                                } else {
                                  await fetchTabData('orders');
                                  toast.success('Order cancelled successfully');
                                }
                              }
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'remedies' && (
            <div className="space-y-4">
              {pendingRemedies.length === 0 && !tabLoading ? (
                <p className="text-center text-gray-500">No pending remedies found.</p>
              ) : (
                pendingRemedies.map((remedy) => (
                  <div key={remedy.id} className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-medium text-lg">{remedy.name}</h3>
                    <p className="text-gray-600 mt-1">{remedy.description}</p>
                    <div className="mt-4 flex justify-end space-x-4">
                      <button
                        onClick={() => handleRemedyAction('approve', remedy.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRemedyAction('reject', remedy.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
