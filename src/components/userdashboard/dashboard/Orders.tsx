// src/components/userdashboard/sections/Orders.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../lib/auth';
import toast from 'react-hot-toast';

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  product: { 
    id: string;
    name: string;
    // Add other product properties that might be needed
    price?: number;
    image?: string | null;
  };
}

interface Order {
  id: string;
  user_id: string;
  total: number;
  status: string;
  created_at: string;
  updated_at: string;
  shipping_address: { street: string; city: string; state: string; postalCode: string; country: string } | null;
  order_items: OrderItem[];
}

export function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('id, user_id, total, status, created_at, updated_at, shipping_address')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        if (!ordersData || ordersData.length === 0) {
          setOrders([]);
          return;
        }

        const processedOrders = await Promise.all(
          ordersData.map(async (order) => {
            const { data: itemsData, error: itemsError } = await supabase
              .from('order_items')
              .select('id, order_id, product_id, quantity, price_at_purchase, product:products(id, name, price, image)')
              .eq('order_id', order.id);

            if (itemsError) throw itemsError;

            // Transform the item data with proper typecasting to match OrderItem interface
            const transformedItems = (itemsData || []).map(item => {
              // Safely handle the product property regardless of format
              let productObj: { id: string; name: string; price?: number; image?: string | null };
              
              if (item.product) {
                // Handle either array or object format by using a type assertion
                const productData = Array.isArray(item.product) && item.product.length > 0
                  ? item.product[0] as any
                  : item.product as any;
                  
                // Now safely access properties with proper null checking
                productObj = {
                  id: String(productData?.id || item.product_id || ''),
                  name: String(productData?.name || 'Product'),
                  price: typeof productData?.price === 'number' ? productData.price : undefined,
                  image: productData?.image || null
                };
              } else {
                // Fallback if no product data
                productObj = {
                  id: String(item.product_id || ''),
                  name: 'Product',
                  image: null
                };
              }
              
              return {
                id: String(item.id),
                order_id: String(item.order_id),
                product_id: String(item.product_id),
                quantity: Number(item.quantity),
                price_at_purchase: Number(item.price_at_purchase),
                product: productObj
              } as OrderItem;
            });

            return {
              id: String(order.id),
              user_id: String(order.user_id),
              total: Number(order.total),
              status: String(order.status),
              created_at: String(order.created_at),
              updated_at: String(order.updated_at || ''),
              shipping_address: order.shipping_address,
              order_items: transformedItems
            } as Order;
          })
        );

        setOrders(processedOrders);
      } catch (error) {
        toast.error('Failed to load orders');
        console.error('Fetch orders error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  // ✅ FIXED: Move cancel handler above return
  const handleCancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Order cancelled successfully');
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: 'cancelled' } : order
        )
      );
    } catch (error) {
      toast.error('Failed to cancel order');
      console.error('Cancel order error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Orders</h1>

      <div className="bg-green-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold text-green-800">Your Order History</h2>
        <p className="text-green-600">View and manage your past orders here.</p>
      </div>

      {orders.length === 0 ? (
        <p className="text-gray-500">No orders found.</p>
      ) : (
        <div className="bg-white p-4 rounded-lg shadow transform transition duration-300 hover:scale-105">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipping Address</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.id.slice(0, 8)}...</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.shipping_address ? (
                        <ul className="list-disc list-inside">
                          <li>{order.shipping_address.street}</li>
                          <li>{order.shipping_address.city}, {order.shipping_address.state}</li>
                          <li>{order.shipping_address.postalCode}, {order.shipping_address.country}</li>
                        </ul>
                      ) : (
                        'Not provided'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <ul className="list-disc list-inside">
                        {order.order_items.map((item) => (
                          <li key={item.id}>
                            {item.product.name} (x{item.quantity}) - ${(
                              item.price_at_purchase * item.quantity
                            ).toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${order.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : order.status === 'shipped'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;