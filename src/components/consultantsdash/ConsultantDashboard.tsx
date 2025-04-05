import AvailabilityManager from './AvailabilityManager';
import PricingManager from './PricingManager';

function ConsultantDashboard() {
  // TODO: Fetch consultant data (name, etc.)
  const consultantName = "Dr. Example"; // Placeholder

  // Example overview data (can be fetched from API)
  const overviewData = {
    totalAppointments: 24,
    nextAppointment: 'April 10, 2025 - 3:00 PM',
    profileCompletion: '85%',
  };

  return (
    <div className="font-sans p-5 bg-gray-100 rounded-lg shadow-lg max-w-6xl mx-auto my-5">
      <h1 className="text-center text-2xl font-semibold text-gray-800 mb-8">{consultantName}'s Dashboard</h1>
      
      {/* Overview Section */}
      <div className="bg-white p-5 rounded-md shadow-md mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div>
          <h2 className="text-lg font-medium text-gray-700">Total Appointments</h2>
          <p className="text-xl font-bold text-indigo-600">{overviewData.totalAppointments}</p>
        </div>
        <div>
          <h2 className="text-lg font-medium text-gray-700">Next Appointment</h2>
          <p className="text-base text-gray-600">{overviewData.nextAppointment}</p>
        </div>
        <div>
          <h2 className="text-lg font-medium text-gray-700">Profile Completion</h2>
          <p className="text-base text-green-600">{overviewData.profileCompletion}</p>
        </div>
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <AvailabilityManager />
        <PricingManager />
        {/* Add more sections as needed, e.g., Appointments, Profile Settings */}
      </div>
    </div>
  );
}

export default ConsultantDashboard;
