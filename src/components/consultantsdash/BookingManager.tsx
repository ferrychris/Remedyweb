import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import toast from 'react-hot-toast';
import { Calendar, Clock, User } from 'lucide-react';

interface Booking {
  id: string;
  user_id: string;
  scheduled_for: string;
  status: string;
  created_at: string;
  user_details?: {
    name: string;
    email: string;
  };
}

export default function BookingManager() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select(`
          id,
          user_id,
          scheduled_for,
          status,
          created_at,
          users:user_id (name, email)
        `)
        .eq('consultant_id', user.id)
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      
      const formattedBookings = data?.map(booking => ({
        ...booking,
        user_details: booking.users
      })) || [];
      
      setBookings(formattedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Your Bookings</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow-md">
          <p className="text-gray-600">No bookings found.</p>
          <p className="text-gray-500 mt-2">Bookings will appear here when patients schedule appointments with you.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(booking => (
            <div key={booking.id} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                    <p className="font-medium text-gray-800">{formatDate(booking.scheduled_for)}</p>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="h-5 w-5 text-emerald-600" />
                    <p className="text-gray-600">{formatTime(booking.scheduled_for)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-emerald-600" />
                    <p className="text-gray-600">
                      {booking.user_details?.name || 'Unknown Patient'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 