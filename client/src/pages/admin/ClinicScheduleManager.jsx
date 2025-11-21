// src/pages/admin/ClinicScheduleManager.jsx
import { useState, useEffect } from 'react';
import { Calendar, Plus, X, Edit, Trash2, Power, AlertCircle } from 'lucide-react';
import api from '../../utils/api';

const ClinicScheduleManager = () => {
  const [schedules, setSchedules] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    type: 'closure',
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    fetchSchedules();
  }, []);

 const fetchSchedules = async () => {
  try {
    const response = await api.get('/clinic-schedule');
    setSchedules(response);
  } catch (err) {
    setError('Failed to fetch schedules');
  }
};

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    if (editingSchedule) {
      await api.put(`/clinic-schedule/${editingSchedule._id}`, formData);
    } else {
      await api.post('/clinic-schedule', formData);
    }

    await fetchSchedules();
    handleCloseModal();
  } catch (err) {
    setError(err.message || 'Failed to save schedule');
  } finally {
    setLoading(false);
  }
};

 const handleDelete = async (id) => {
  if (!confirm('Are you sure you want to delete this schedule?')) return;

  try {
    await api.delete(`/clinic-schedule/${id}`);
    await fetchSchedules();
  } catch (err) {
    setError('Failed to delete schedule');
  }
};

const handleToggle = async (id) => {
  try {
    await api.put(`/clinic-schedule/${id}/toggle`, {});
    await fetchSchedules();
  } catch (err) {
    setError('Failed to toggle schedule status');
  }
};



  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      type: schedule.type,
      title: schedule.title,
      description: schedule.description || '',
      startDate: new Date(schedule.startDate).toISOString().split('T')[0],
      endDate: new Date(schedule.endDate).toISOString().split('T')[0],
      reason: schedule.reason || ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSchedule(null);
    setFormData({
      type: 'closure',
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      reason: ''
    });
    setError('');
  };

  const getTypeBadge = (type) => {
    const badges = {
      closure: 'bg-red-100 text-red-700',
      holiday: 'bg-orange-100 text-orange-700',
      special_opening: 'bg-green-100 text-green-700'
    };
    return badges[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2 md:gap-3">
            <Calendar className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
            Clinic Schedule Manager
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-2">Manage clinic closures, holidays, and special openings</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm md:text-base"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden sm:inline">Add Schedule</span>
          <span className="sm:hidden">Add</span>
        </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        {schedules.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Schedules Yet</h3>
            <p className="text-gray-500">Add clinic closures, holidays, or special openings</p>
          </div>
        ) : (
          <div className="divide-y">
            {schedules.map((schedule) => (
              <div key={schedule._id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">{schedule.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeBadge(schedule.type)}`}>
                        {schedule.type.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        schedule.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {schedule.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                    
                    {schedule.description && (
                      <p className="text-sm text-gray-600 mb-2">{schedule.description}</p>
                    )}
                    
                    <div className="text-sm text-gray-700 space-y-1">
                      <p>
                        <span className="font-medium">Period:</span>{' '}
                        {new Date(schedule.startDate).toLocaleDateString()} - {new Date(schedule.endDate).toLocaleDateString()}
                      </p>
                      {schedule.reason && (
                        <p>
                          <span className="font-medium">Reason:</span> {schedule.reason}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Created by: {schedule.createdBy?.name || 'Unknown'} on {new Date(schedule.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleToggle(schedule._id)}
                      className="p-1.5 md:p-2 hover:bg-gray-200 rounded-lg transition"
                      title={schedule.isActive ? 'Deactivate' : 'Activate'}
                    >
                      <Power className={`w-4 h-4 md:w-5 md:h-5 ${schedule.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                    </button>
                    <button
                      onClick={() => handleEdit(schedule)}
                      className="p-1.5 md:p-2 hover:bg-blue-100 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(schedule._id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-800">
                  {editingSchedule ? 'Edit Schedule' : 'Add Schedule'}
                </h3>
                <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="closure">Closure</option>
                  <option value="holiday">Holiday</option>
                  <option value="special_opening">Special Opening</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Christmas Day, Saturday Opening"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Additional details..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason (Optional)</label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., National Holiday, Maintenance"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:bg-gray-400"
                >
                  {loading ? 'Saving...' : editingSchedule ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicScheduleManager;