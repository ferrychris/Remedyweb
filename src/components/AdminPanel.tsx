import React, { useEffect } from 'react';
import { Admin, Resource, ListGuesser, EditGuesser, ShowGuesser } from 'react-admin';
import { supabaseDataProvider } from '../supabaseDataProvider';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast'; // Import hot-toast

interface LoginCredentials {
    username: string;
    password: string;
}

interface ErrorCheck {
    status: number;
}

interface Profile {
    is_admin?: boolean;
    display_name?: string;
    avatar_url?: string;
}

const authProvider = {
    login: async (credentials: LoginCredentials) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.username,
            password: credentials.password,
        });
        if (error) throw error;
        return data;
    },
    logout: async () => {
        await supabase.auth.signOut();
        return Promise.resolve();
    },
    checkError: (error: ErrorCheck) => {
        if (error.status === 401 || error.status === 403) {
            return Promise.reject();
        }
        return Promise.resolve();
    },
    checkAuth: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error();
        return Promise.resolve();
    },
    getPermissions: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return Promise.reject();
        
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single() as { data: Profile };
            
        return profile?.is_admin ? Promise.resolve('admin') : Promise.reject();
    },
    getIdentity: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return Promise.reject();
        
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('display_name, avatar_url')
            .eq('id', user.id)
            .single() as { data: Profile };
            
        return Promise.resolve({
            id: user.id,
            fullName: profile?.display_name || user.email,
            avatar: profile?.avatar_url,
        });
    },
};

// Function to create admin user
const createAdminUser = async () => {
  try {
    // First sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'admin@admin.com',
      password: 'admin',
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          display_name: 'Administrator',
        }
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No user returned from sign up');

    // Create user profile with admin privileges
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert([
        {
          id: authData.user.id,
          display_name: 'Administrator',
          bio: 'System Administrator',
          is_admin: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

    if (profileError) throw profileError;

    toast.success('Admin user created successfully! Please check email for verification.');
  } catch (error: any) {
    console.error('Error creating admin:', error);
    toast.error(error.message || 'Failed to create admin user');
  }
};

// Function to make a user an admin by email
const makeUserAdmin = async (email: string) => {
  try {
    // First get the user's ID from auth.users
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError) throw userError;
    if (!userData) throw new Error('User not found');

    // Update the user_profiles table to set is_admin to true
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ is_admin: true })
      .eq('id', userData.id);

    if (updateError) throw updateError;

    toast.success(`Successfully made ${email} an admin`);
  } catch (error: any) {
    console.error('Error making user admin:', error);
    toast.error(error.message || 'Failed to make user admin');
  }
};

const AdminPanel: React.FC = () => {
    const { profile } = useAuth() as { profile: Profile | null };
    const navigate = useNavigate();

    useEffect(() => {
        if (!profile?.is_admin) {
            navigate('/admin/login');
        }
    }, [profile, navigate]);

    if (!profile || !profile.is_admin) {
        return null;
    }

    return (
        <div>
            <div className="flex justify-end mb-4">
                <button
                    onClick={createAdminUser}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 mr-2"
                >
                    Create Admin User
                </button>
                <button
                    onClick={() => makeUserAdmin('itzhorlamilekan@gmail.com')}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 mr-2"
                >
                    Make User Admin
                </button>
            </div>
            <Admin 
                dataProvider={supabaseDataProvider}
                authProvider={authProvider}
                requireAuth
            >
                <Resource 
                    name="remedies" 
                    list={ListGuesser} 
                    edit={EditGuesser} 
                    show={ShowGuesser}
                />
                <Resource 
                    name="ailments" 
                    list={ListGuesser} 
                    edit={EditGuesser} 
                    show={ShowGuesser}
                />
                <Resource 
                    name="consultants" 
                    list={ListGuesser} 
                    edit={EditGuesser} 
                    show={ShowGuesser}
                />
                <Resource 
                    name="orders" 
                    list={ListGuesser} 
                    show={ShowGuesser}
                />
                <Resource 
                    name="products" 
                    list={ListGuesser} 
                    edit={EditGuesser} 
                    show={ShowGuesser}
                />
                <Resource 
                    name="remedy_comments" 
                    list={ListGuesser} 
                    edit={EditGuesser} 
                    show={ShowGuesser}
                />
            </Admin>
        </div>
    );
};

export default AdminPanel;