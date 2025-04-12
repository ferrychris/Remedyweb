import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface AdminAuthCheckProps {
  children: React.ReactNode;
}

const AdminAuthCheck: React.FC<AdminAuthCheckProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error('Not authenticated');
        }

        // Check if user is admin
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (profileError) {
          throw new Error('Error checking admin status');
        }

        if (!profile?.is_admin) {
          throw new Error('Not authorized');
        }

        // If we get here, user is authenticated and is an admin
        setIsLoading(false);
      } catch (error: any) {
        console.error('Admin access check failed:', error);
        toast.error('Access denied. Please log in as an admin.');
        navigate('/adminlogin');
      }
    };

    checkAdminAccess();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminAuthCheck; 