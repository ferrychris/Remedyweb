import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  Search,
  ChevronDown,
  ChevronUp,
  Calendar,
  MessageSquare
} from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  email: string;
  last_consultation: string;
  health_rating: number;
  unread_messages: number;
  upcoming_appointments: number;
}

export function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof Patient>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch consultations to get patient IDs
      const { data: consultations } = await supabase
        .from('consultations')
        .select('patient_id')
        .eq('consultant_id', user.id);

      if (!consultations) return;

      const patientIds = [...new Set(consultations.map(c => c.patient_id))];

      // Fetch patient profiles
      const { data: patientProfiles } = await supabase
        .from('user_profiles')
        .select('id, name, email')
        .in('id', patientIds);

      if (!patientProfiles) return;

      // Fetch additional data for each patient
      const patientsWithData = await Promise.all(
        patientProfiles.map(async (profile) => {
          // Get last consultation date
          const { data: lastConsultation } = await supabase
            .from('consultations')
            .select('created_at')
            .eq('patient_id', profile.id)
            .eq('consultant_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get health rating from latest health review
          const { data: healthReview } = await supabase
            .from('health_reviews')
            .select('overall_rating')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get unread messages count
          const { count: unreadMessages } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', profile.id)
            .eq('consultant_id', user.id)
            .eq('is_read', false);

          // Get upcoming appointments count
          const { count: upcomingAppointments } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', profile.id)
            .eq('consultant_id', user.id)
            .gte('scheduled_date', new Date().toISOString());

          return {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            last_consultation: lastConsultation?.created_at || 'No consultations',
            health_rating: healthReview?.overall_rating || 0,
            unread_messages: unreadMessages || 0,
            upcoming_appointments: upcomingAppointments || 0
          };
        })
      );

      setPatients(patientsWithData);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: keyof Patient) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return sortDirection === 'asc'
      ? Number(aValue) - Number(bValue)
      : Number(bValue) - Number(aValue);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-t-2 border-emerald-500 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Users className="h-8 w-8 text-emerald-600" />
        <h1 className="text-3xl font-bold text-gray-800">Patients</h1>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
          placeholder="Search patients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Patients Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Name
                  {sortField === 'name' && (
                    sortDirection === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('last_consultation')}
              >
                <div className="flex items-center">
                  Last Consultation
                  {sortField === 'last_consultation' && (
                    sortDirection === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('health_rating')}
              >
                <div className="flex items-center">
                  Health Rating
                  {sortField === 'health_rating' && (
                    sortDirection === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                  )}
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedPatients.map((patient) => (
              <tr key={patient.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                      <div className="text-sm text-gray-500">{patient.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(patient.last_consultation).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 mr-2"></div>
                    <span className="text-sm text-gray-900">{patient.health_rating}/5</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-3">
                    <button
                      className="text-emerald-600 hover:text-emerald-900"
                      title="View Appointments"
                    >
                      <Calendar className="h-5 w-5" />
                    </button>
                    <button
                      className="text-emerald-600 hover:text-emerald-900"
                      title="Send Message"
                    >
                      <MessageSquare className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 