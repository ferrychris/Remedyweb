// import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth'; 
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

interface AdminStats {
  totalOrders: number;
  totalProducts: number;
  totalConsultants: number;
  pendingAilments: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  status: string;
}

interface Consultant {
  id: string;
  name: string;
  email: string;
  specialty: string;
  status: string;
}

interface Order {
  id: string;
  user_id: string;
  status: string;
  total: number;
  created_at: string;
}

export function AdminDashboard() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalOrders: 0,
    totalProducts: 0,
    totalConsultants: 0,
    pendingAilments: 0,
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pendingAilments, setPendingAilments] = useState<any[]>([]);

  // Redirect if not admin
  if (!profile?.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    fetchAdminData();
  }, []);

  async function fetchAdminData() {
    try {
      setLoading(true);

      // Fetch stats
      const [
        { count: ordersCount },
        { count: productsCount },
        { count: consultantsCount },
        { count: ailmentsCount },
      ] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact' }),
        supabase.from('products').select('*', { count: 'exact' }),
        supabase.from('consultants').select('*', { count: 'exact' }),
        supabase.from('ailments').select('*', { count: 'exact' }).eq('status', 'pending'),
      ]);

      setStats({
        totalOrders: ordersCount || 0,
        totalProducts: productsCount || 0,
        totalConsultants: consultantsCount || 0,
        pendingAilments: ailmentsCount || 0,
      });

      // Fetch recent data based on active tab
      await fetchTabData(activeTab);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }

  async function fetchTabData(tab: string) {
    try {
      switch (tab) {
        case 'products':
          const { data: productsData } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
          setProducts(productsData || []);
          break;

        case 'consultants':
          const { data: consultantsData } = await supabase
            .from('consultants')
            .select('*')
            .order('created_at', { ascending: false });
          setConsultants(consultantsData || []);
          break;

        case 'orders':
          const { data: ordersData } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .order('created_at', { ascending: false });
          setOrders(ordersData || []);
          break;

        case 'ailments':
          const { data: ailmentsData } = await supabase
            .from('ailments')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
          setPendingAilments(ailmentsData || []);
          break;
      }
    } catch (error) {
      console.error('Error fetching tab data:', error);
      toast.error('Failed to load data');
    }
  }

  async function handleProductAction(action: string, productId: string) {
    try {
      switch (action) {
        case 'delete':
          await supabase.from('products').delete().eq('id', productId);
          break;
        case 'activate':
          await supabase.from('products').update({ status: 'active' }).eq('id', productId);
          break;
        case 'deactivate':
          await supabase.from('products').update({ status: 'inactive' }).eq('id', productId);
          break;
      }
      await fetchTabData('products');
      toast.success('Product updated successfully');
    } catch (error) {
      toast.error('Failed to update product');
    }
  }

  async function handleConsultantAction(action: string, consultantId: string) {
    try {
      switch (action) {
        case 'delete':
          await supabase.from('consultants').delete().eq('id', consultantId);
          break;
        case 'activate':
          await supabase.from('consultants').update({ status: 'active' }).eq('id', consultantId);
          break;
        case 'deactivate':
          await supabase.from('consultants').update({ status: 'inactive' }).eq('id', consultantId);
          break;
      }
      await fetchTabData('consultants');
      toast.success('Consultant updated successfully');
    } catch (error) {
      toast.error('Failed to update consultant');
    }
  }

  async function handleAilmentAction(action: string, ailmentId: string) {
    try {
      await supabase
        .from('ailments')
        .update({ status: action === 'approve' ? 'approved' : 'rejected' })
        .eq('id', ailmentId);
      await fetchTabData('ailments');
      toast.success(`Ailment ${action}d successfully`);
    } catch (error) {
      toast.error('Failed to update ailment');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
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
            <h3 className="text-sm font-medium text-yellow-600">Pending Ailments</h3>
            <p className="text-2xl font-bold text-yellow-900">{stats.pendingAilments}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {['overview', 'products', 'consultants', 'orders', 'ailments'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  fetchTabData(tab);
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
          {activeTab === 'products' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${product.price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.stock_quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleProductAction(product.status === 'active' ? 'deactivate' : 'activate', product.id)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          {product.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleProductAction('delete', product.id)}
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
          )}

          {activeTab === 'consultants' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Specialty
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {consultants.map((consultant) => (
                    <tr key={consultant.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {consultant.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {consultant.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {consultant.specialty}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          consultant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {consultant.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleConsultantAction(consultant.status === 'active' ? 'deactivate' : 'activate', consultant.id)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          {consultant.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleConsultantAction('delete', consultant.id)}
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
          )}

          {activeTab === 'orders' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{order.id.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${order.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'ailments' && (
            <div className="space-y-4">
              {pendingAilments.map((ailment) => (
                <div key={ailment.id} className="bg-white p-4 rounded-lg shadow">
                  <h3 className="font-medium text-lg">{ailment.name}</h3>
                  <p className="text-gray-600 mt-1">{ailment.description}</p>
                  <div className="mt-4 flex justify-end space-x-4">
                    <button
                      onClick={() => handleAilmentAction('approve', ailment.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAilmentAction('reject', ailment.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}