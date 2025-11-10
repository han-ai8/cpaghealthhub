import React from 'react';
import { X, Calendar, Clock, FileText, TrendingUp, Award, Activity, User as UserIcon, Printer, CheckCircle } from 'lucide-react';
import PrintableFormalLetter from './PrintableFormalLetter';
const UnifiedSessionHistoryModal = ({ patientId, caseManagerId, onClose }) => {
  const [history, setHistory] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  const parseDate = (dateString) => {
    if (!dateString) return new Date();
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  React.useEffect(() => {
    fetchUnifiedHistory();
  }, [patientId]);

  const fetchUnifiedHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/sessions/patients/${patientId}/unified-history`,
        {
          headers: getAuthHeaders()
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setHistory(data.history);
        }
      }
    } catch (error) {
      console.error('Error fetching unified history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const progressColors = {
    excellent: { bg: 'bg-green-500', text: 'text-green-700', light: 'bg-green-50' },
    good: { bg: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-50' },
    fair: { bg: 'bg-yellow-500', text: 'text-yellow-700', light: 'bg-yellow-50' },
    poor: { bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-50' }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading session history...</p>
        </div>
      </div>
    );
  }

  if (!history) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md">
          <h3 className="text-xl font-bold text-gray-800 mb-4">No Session History</h3>
          <p className="text-gray-600 mb-6">No session history found for this patient.</p>
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          body { 
            print-color-adjust: exact !important; 
            -webkit-print-color-adjust: exact !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Hide all non-printable elements */
          .print\\:hidden,
          nav,
          header,
          aside,
          .sidebar,
          button:not(.print-keep),
          .no-print {
            display: none !important;
          }
          
          /* Show only print content */
          .print\\:block {
            display: block !important;
          }
          
          .page-break { 
            page-break-after: always !important;
            break-after: page !important;
          }
          
          @page { 
            size: A4 portrait;
            margin: 15mm;
          }
          
          /* Remove all backgrounds for print */
          * {
            background: white !important;
            color: black !important;
          }
        }
      `}</style>

      {/* Screen Version */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 print:hidden">
        <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex justify-between items-center rounded-t-2xl z-50">
            <div className="flex-1">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <FileText className="w-8 h-8" />
                Complete Session History
              </h2>
              <p className="text-blue-100 mt-2">
                Patient: {history.patient.name} • Total Sessions: {history.programInfo.totalSessions}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition font-semibold"
              >
                <Printer className="w-5 h-5" />
                Print Report
              </button>
              <button
                onClick={onClose}
                className="text-white hover:bg-blue-700 p-2 rounded-lg transition"
              >
                <X className="w-8 h-8" />
              </button>
            </div>
          </div>

          {/* Patient Information */}
          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <UserIcon className="w-6 h-6 text-blue-600" />
              Patient Information
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600">Full Name</p>
                <p className="font-semibold text-gray-900">{history.patient.name}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600">Age</p>
                <p className="font-semibold text-gray-900">{history.patient.age || 'N/A'}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600">Gender</p>
                <p className="font-semibold text-gray-900">{history.patient.gender || 'N/A'}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-semibold text-gray-900">{history.patient.location || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Program Overview */}
          <div className="p-6 bg-white">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Activity className="w-6 h-6 text-purple-600" />
              Program Overview
            </h3>
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 font-semibold mb-1">Total Sessions</p>
                <p className="text-4xl font-bold text-blue-600">{history.programInfo.totalSessions}</p>
              </div>
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 font-semibold mb-1">Average Progress</p>
                <p className="text-2xl font-bold text-purple-600">{history.statistics.averageProgress}</p>
              </div>
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 font-semibold mb-1">Status</p>
                <p className="text-lg font-bold text-green-600">
                  {history.programInfo.programCompleted ? 'Completed' : 'Ongoing'}
                </p>
              </div>
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 font-semibold mb-1">Case Manager</p>
                <p className="text-sm font-bold text-yellow-700">{history.caseManager.name}</p>
              </div>
            </div>

            {/* Progress Distribution */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Progress Distribution:</p>
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-green-100 rounded p-3 text-center">
                  <p className="text-xs text-gray-600">Excellent</p>
                  <p className="text-2xl font-bold text-green-700">{history.statistics.progressDistribution.excellent}</p>
                </div>
                <div className="bg-blue-100 rounded p-3 text-center">
                  <p className="text-xs text-gray-600">Good</p>
                  <p className="text-2xl font-bold text-blue-700">{history.statistics.progressDistribution.good}</p>
                </div>
                <div className="bg-yellow-100 rounded p-3 text-center">
                  <p className="text-xs text-gray-600">Fair</p>
                  <p className="text-2xl font-bold text-yellow-700">{history.statistics.progressDistribution.fair}</p>
                </div>
                <div className="bg-red-100 rounded p-3 text-center">
                  <p className="text-xs text-gray-600">Poor</p>
                  <p className="text-2xl font-bold text-red-700">{history.statistics.progressDistribution.poor}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Session Timeline */}
          <div className="p-6 relative">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Award className="w-6 h-6 text-indigo-600" />
              Session Timeline & Progress
            </h3>

            <div className="relative">
              {/* Vertical Timeline Line */}
              <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500 z-0"></div>

              {/* Timeline Items */}
              <div className="space-y-6 relative z-10">
                {history.sessions.map((session, index) => (
                  <div key={index} className="relative pl-20">
                    {/* Timeline Node */}
                    <div className="absolute left-0 flex items-center z-10">
                      <div className={`w-16 h-16 rounded-full ${progressColors[session.progress].bg} flex items-center justify-center shadow-lg border-4 border-white`}>
                        <span className="text-white font-bold text-lg">
                          {session.sessionNumber}
                        </span>
                      </div>
                    </div>

                    {/* Session Card */}
                    <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 hover:shadow-xl transition relative z-20">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-gray-800 mb-2">
                            Session #{session.sessionNumber}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {parseDate(session.date).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {session.time}
                            </span>
                            <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                              {session.service}
                            </span>
                          </div>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                          session.progress === 'excellent' ? 'bg-green-100 text-green-700' :
                          session.progress === 'good' ? 'bg-blue-100 text-blue-700' :
                          session.progress === 'fair' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          <TrendingUp className="w-4 h-4 inline mr-1" />
                          {session.progress.toUpperCase()}
                        </span>
                      </div>

                      {/* Session Summary */}
                      {session.sessionSummary && (
                        <div className="mb-4 bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                          <p className="text-sm font-semibold text-blue-800 mb-2">Session Summary</p>
                          <p className="text-gray-700 italic">"{session.sessionSummary}"</p>
                        </div>
                      )}

                      {/* Detailed Notes */}
                      {session.notes && (
                        <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-300">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Detailed Notes</p>
                          <p className="text-gray-700 whitespace-pre-wrap">{session.notes}</p>
                        </div>
                      )}

                      {/* Completion Info */}
                      {session.completedAt && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            Completed on {parseDate(session.completedAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Program Completion Badge */}
              {history.programInfo.programCompleted && (
                <div className="relative pl-20 mt-8 z-20">
                  <div className="absolute left-0 flex items-center z-10">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg border-4 border-white">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-300 p-6 shadow-lg">
                    <h4 className="text-2xl font-bold text-green-800 mb-2 flex items-center gap-2">
                      <Award className="w-6 h-6" />
                      Program Completed Successfully!
                    </h4>
                    <p className="text-gray-700 mb-2">
                      Completion Date: {parseDate(history.programInfo.completedAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                    {history.programInfo.completionNotes && (
                      <div className="mt-3 bg-white rounded-lg p-4 border border-green-200">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Final Notes:</p>
                        <p className="text-gray-700">{history.programInfo.completionNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 border-t-2 border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Print Version - COMPACT FORMAL LETTER FORMAT */}
      <div className="hidden print:block">
        <PrintableFormalLetter history={history} />
      </div>
    </>
  );
};

export default UnifiedSessionHistoryModal;