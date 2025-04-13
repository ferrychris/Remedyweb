import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/auth';
import { Clock, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return `${hour}:00`;
});

export function Availability() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<TimeSlot[]>([]);

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('consultant_availability')
        .select('*')
        .eq('consultant_id', user?.id);

      if (error) throw error;

      if (data && data.length > 0) {
        setSchedule(data);
      } else {
        // Initialize empty schedule
        const initialSchedule = DAYS.map(day => ({
          day,
          startTime: '09:00',
          endTime: '17:00',
          isAvailable: true
        }));
        setSchedule(initialSchedule);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast.error('Failed to load availability schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const newSchedule = [...schedule];
    newSchedule[index] = {
      ...newSchedule[index],
      [field]: value
    };
    setSchedule(newSchedule);
  };

  const toggleAvailability = (index: number) => {
    const newSchedule = [...schedule];
    newSchedule[index] = {
      ...newSchedule[index],
      isAvailable: !newSchedule[index].isAvailable
    };
    setSchedule(newSchedule);
  };

  const saveAvailability = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('consultant_availability')
        .upsert(
          schedule.map(slot => ({
            ...slot,
            consultant_id: user?.id
          }))
        );

      if (error) throw error;
      toast.success('Availability schedule saved successfully');
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error('Failed to save availability schedule');
    } finally {
      setSaving(false);
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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Availability Schedule</h1>
          <p className="text-gray-500">Set your weekly working hours</p>
        </div>
        <button
          onClick={saveAvailability}
          disabled={saving}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Schedule
            </>
          )}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 p-6">
          {schedule.map((slot, index) => (
            <div key={slot.day} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">{slot.day}</h3>
                <button
                  onClick={() => toggleAvailability(index)}
                  className={`p-1 rounded-full ${
                    slot.isAvailable ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {slot.isAvailable ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              {slot.isAvailable && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <select
                      value={slot.startTime}
                      onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                    >
                      {TIME_SLOTS.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <select
                      value={slot.endTime}
                      onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                    >
                      {TIME_SLOTS.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 