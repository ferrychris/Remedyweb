import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/auth';
import { 
  Users, 
  Calendar, 
  MessageSquare, 
  Star,
  Clock,
  Settings,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalPatients: number;
  upcomingAppointments: number;
  unreadMessages: number;
  averageRating: number;
}

export function ConsultantOverview() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    upcomingAppointments: 0,
    unreadMessages: 0,
    averageRating: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchDashboardStats();
  }, [user]);

  const fetchDashboardStats = async () => {
    if (!user) {
      console.error('No authenticated user found');
      return;
    }

    try {
      setLoading(true);
      
      // If user is admin, use their user_id directly
      if (isAdmin) {
        const consultantId = user.id;

        // Fetch total patients (unique users who have had consultations)
        const { count: patientCount, error: patientError } = await supabase
          .from('consultations')
          .select('user_id', { count: 'exact', head: true })
          .eq('consultant_id', consultantId);

        if (patientError) {
          console.error('Error fetching patients:', patientError);
          throw patientError;
        }

        // Fetch upcoming appointments
        const { count: appointmentCount, error: appointmentError } = await supabase
          .from('consultations')
          .select('*', { count: 'exact', head: true })
          .eq('consultant_id', consultantId)
          .eq('status', 'scheduled')
          .gte('scheduled_for', new Date().toISOString());

        if (appointmentError) {
          console.error('Error fetching appointments:', appointmentError);
          throw appointmentError;
        }

        // Fetch unread messages
        const { count: messageCount, error: messageError } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('consultant_id', consultantId)
          .eq('is_read', false);

        if (messageError) {
          console.error('Error fetching messages:', messageError);
          // Don't throw the error, just set message count to 0
          setStats(prev => ({
            ...prev,
            unreadMessages: 0
          }));
        } else {
          setStats(prev => ({
            ...prev,
            unreadMessages: messageCount || 0
          }));
        }

        // Fetch average rating
        const { data: ratings, error: ratingError } = await supabase
          .from('consultation_reviews')
          .select('rating')
          .eq('consultant_id', consultantId);

        if (ratingError) {
          console.error('Error fetching ratings:', ratingError);
          // Don't throw the error, just set rating to 0
          setStats(prev => ({
            ...prev,
            averageRating: 0
          }));
        } else {
          const averageRating = ratings?.length 
            ? ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length 
            : 0;
          setStats(prev => ({
            ...prev,
            averageRating: Number(averageRating.toFixed(1))
          }));
        }

        // Update all stats at once
        setStats(prev => ({
          ...prev,
          totalPatients: patientCount || 0,
          upcomingAppointments: appointmentCount || 0
        }));
        return;
      }

      // For non-admin users, check profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, display_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }

      if (!profile) {
        navigate('/consultant-dashboard/settings');
        return;
      }

      const consultantId = profile.id;
      const consultantName = profile.display_name || 'Consultant';

      // Fetch total patients (unique users who have had consultations)
      const { count: patientCount, error: patientError } = await supabase
        .from('consultations')
        .select('user_id', { count: 'exact', head: true })
        .eq('consultant_id', consultantId);

      if (patientError) {
        console.error('Error fetching patients:', patientError);
        throw patientError;
      }

      // Fetch upcoming appointments
      const { count: appointmentCount, error: appointmentError } = await supabase
        .from('consultations')
        .select('*', { count: 'exact', head: true })
        .eq('consultant_id', consultantId)
        .eq('status', 'scheduled')
        .gte('scheduled_for', new Date().toISOString());

      if (appointmentError) {
        console.error('Error fetching appointments:', appointmentError);
        throw appointmentError;
      }

      // Fetch unread messages
      const { count: messageCount, error: messageError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('consultant_id', consultantId)
        .eq('is_read', false);

      if (messageError) {
        console.error('Error fetching messages:', messageError);
        // Don't throw the error, just set message count to 0
        setStats(prev => ({
          ...prev,
          unreadMessages: 0
        }));
      } else {
        setStats(prev => ({
          ...prev,
          unreadMessages: messageCount || 0
        }));
      }

      // Fetch average rating
      const { data: ratings, error: ratingError } = await supabase
        .from('consultation_reviews')
        .select('rating')
        .eq('consultant_id', consultantId);

      if (ratingError) {
        console.error('Error fetching ratings:', ratingError);
        // Don't throw the error, just set rating to 0
        setStats(prev => ({
          ...prev,
          averageRating: 0
        }));
      } else {
        const averageRating = ratings?.length 
          ? ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length 
          : 0;
        setStats(prev => ({
          ...prev,
          averageRating: Number(averageRating.toFixed(1))
        }));
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500">Welcome back, {isAdmin ? 'Admin' : 'Consultant'}</p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => navigate('/consultant-dashboard/settings')}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </button>
          <button
            onClick={() => navigate('/consultant-dashboard/set-availability')}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
          >
            <Clock className="w-4 h-4 mr-2" />
            Set Availability
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Patients Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-emerald-100">
              <Users className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Patients</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalPatients}</p>
            </div>
          </div>
        </div>

        {/* Upcoming Appointments Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Upcoming Appointments</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.upcomingAppointments}</p>
            </div>
          </div>
        </div>

        {/* Unread Messages Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <MessageSquare className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unread Messages</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.unreadMessages}</p>
            </div>
          </div>
        </div>

        {/* Average Rating Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Rating</p>
              <div className="flex items-center">
                <p className="text-2xl font-semibold text-gray-900">{stats.averageRating}</p>
                <span className="ml-1 text-gray-500">/5</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/consultant-dashboard/appointments')}
              className="flex items-center justify-center p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <Calendar className="w-5 h-5 text-emerald-600 mr-2" />
              <span className="text-sm font-medium text-emerald-700">View Appointments</span>
            </button>
            <button
              onClick={() => navigate('/consultant-dashboard/messages')}
              className="flex items-center justify-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <MessageSquare className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-700">View Messages</span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-emerald-100 rounded-full">
                <Calendar className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">New Appointment</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-full">
                <MessageSquare className="w-4 h-4 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">New Message</p>
                <p className="text-xs text-gray-500">4 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 