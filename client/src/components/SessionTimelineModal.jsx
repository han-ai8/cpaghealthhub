import React from 'react';
import { X, Calendar, Clock, FileText, TrendingUp, CheckCircle, Printer } from 'lucide-react';

const SessionTimelineModal = ({ appointment, onClose }) => {
  if (!appointment) return null;

  const sessions = appointment.sessionTracking?.sessionNotes || [];
  const totalSessions = sessions.length;

  const parseDate = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const handlePrint = () => {
    window.print();
  };

  const progressColors = {
    excellent: 'bg-green-500',
    good: 'bg-blue-500',
    fair: 'bg-yellow-500',
    poor: 'bg-red-500'
  };

  const progressLabels = {
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor'
  };

  return (
    <>
      {/* Screen version */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 print:hidden">
        <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b-2 border-gray-200 p-6 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                Session Timeline & Progress
              </h2>
              <p className="text-gray-600 mt-1">
                Patient: {appointment.user?.name || appointment.user?.username}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                <Printer className="w-5 h-5" />
                Print Report
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <X className="w-8 h-8" />
              </button>
            </div>
          </div>

          {/* Patient Information */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Patient Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 shadow">
                <p className="text-sm text-gray-600">Full Name</p>
                <p className="font-semibold text-gray-900">
                  {appointment.psychosocialInfo?.fullName || appointment.user?.name || appointment.user?.username}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <p className="text-sm text-gray-600">Service</p>
                <p className="font-semibold text-gray-900">{appointment.service}</p>
              </div>
              {appointment.psychosocialInfo && (
                <>
                  <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-sm text-gray-600">Age</p>
                    <p className="font-semibold text-gray-900">{appointment.psychosocialInfo.age}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-sm text-gray-600">Gender</p>
                    <p className="font-semibold text-gray-900">{appointment.psychosocialInfo.gender}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow col-span-2">
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-semibold text-gray-900">{appointment.psychosocialInfo.location}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Session Progress</h3>
              <div className="bg-blue-100 px-4 py-2 rounded-lg">
                <span className="text-blue-800 font-semibold">
                  Total Sessions: {totalSessions}
                </span>
              </div>
            </div>

            {sessions.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No session notes yet</p>
              </div>
            ) : (
              <div className="relative">
                {/* Vertical Timeline Line */}
                <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500"></div>

                {/* Timeline Items */}
                <div className="space-y-8">
                  {sessions.map((session, index) => (
                    <div key={index} className="relative pl-20">
                      {/* Timeline Node */}
                      <div className="absolute left-0 flex items-center">
                        <div className={`w-16 h-16 rounded-full ${progressColors[session.progress]} flex items-center justify-center shadow-lg border-4 border-white`}>
                          <span className="text-white font-bold text-lg">
                            {session.sessionNumber}
                          </span>
                        </div>
                      </div>

                      {/* Session Card */}
                      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 hover:shadow-xl transition">
                        {/* Session Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-xl font-bold text-gray-800 mb-2">
                              Session #{session.sessionNumber}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
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
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              session.progress === 'excellent' ? 'bg-green-100 text-green-700' :
                              session.progress === 'good' ? 'bg-blue-100 text-blue-700' :
                              session.progress === 'fair' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              <TrendingUp className="w-3 h-3 inline mr-1" />
                              {progressLabels[session.progress]}
                            </span>
                          </div>
                        </div>

                        {/* Session Summary */}
                        {session.sessionSummary && (
                          <div className="mb-4 bg-blue-50 rounded-lg p-4">
                            <p className="text-sm font-semibold text-blue-800 mb-2">Summary</p>
                            <p className="text-gray-700 italic">"{session.sessionSummary}"</p>
                          </div>
                        )}

                        {/* Session Notes */}
                        {session.notes && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm font-semibold text-gray-700 mb-2">Detailed Notes</p>
                            <p className="text-gray-700 whitespace-pre-wrap">{session.notes}</p>
                          </div>
                        )}

                        {/* Completion Info */}
                        {session.completedAt && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-500">
                              Completed on {new Date(session.completedAt).toLocaleString('en-US', {
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
                {appointment.programCompleted && (
                  <div className="relative pl-20 mt-8">
                    <div className="absolute left-0 flex items-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg border-4 border-white">
                        <CheckCircle className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 p-6">
                      <h4 className="text-xl font-bold text-green-800 mb-2">
                        ✅ Program Completed
                      </h4>
                      <p className="text-gray-700">
                        Completed on: {new Date(appointment.completedAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      {appointment.completionNotes && (
                        <div className="mt-3 bg-white rounded-lg p-3">
                          <p className="text-sm font-semibold text-gray-700 mb-1">Final Notes:</p>
                          <p className="text-gray-700">{appointment.completionNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
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

      {/* Print version */}
      <div className="hidden print:block">
        <PrintableSessionTimeline appointment={appointment} sessions={sessions} />
      </div>
    </>
  );
};

// Printable Component
const PrintableSessionTimeline = ({ appointment, sessions }) => {
  const parseDate = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  return (
    <div className="bg-white p-8 max-w-5xl mx-auto">
      <style>{`
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .page-break { page-break-after: always; }
          @page { size: A4; margin: 20mm; }
        }
      `}</style>

      {/* Header */}
      <div className="border-b-4 border-blue-600 pb-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Session Timeline Report
        </h1>
        <p className="text-gray-600 text-lg">Psychological Support Services</p>
        <p className="text-gray-500 mt-2">
          Generated on: {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })}
        </p>
      </div>

      {/* Patient Information */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Patient Information</h2>
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-6 rounded-lg">
          <div>
            <p className="text-sm text-gray-600 font-semibold">Name</p>
            <p className="text-lg text-gray-900">
              {appointment.psychosocialInfo?.fullName || appointment.user?.name || appointment.user?.username}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-semibold">Service</p>
            <p className="text-lg text-gray-900">{appointment.service}</p>
          </div>
          {appointment.psychosocialInfo && (
            <>
              <div>
                <p className="text-sm text-gray-600 font-semibold">Age</p>
                <p className="text-lg text-gray-900">{appointment.psychosocialInfo.age}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold">Gender</p>
                <p className="text-lg text-gray-900">{appointment.psychosocialInfo.gender}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600 font-semibold">Location</p>
                <p className="text-lg text-gray-900">{appointment.psychosocialInfo.location}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Session Summary */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Program Overview</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 font-semibold mb-1">Total Sessions</p>
            <p className="text-4xl font-bold text-blue-600">{sessions.length}</p>
          </div>
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 font-semibold mb-1">Status</p>
            <p className="text-lg font-bold text-green-600">
              {appointment.programCompleted ? 'Completed' : 'Ongoing'}
            </p>
          </div>
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 font-semibold mb-1">Case Manager</p>
            <p className="text-sm font-bold text-purple-600">
              {appointment.assignedCaseManager?.name || 'Assigned'}
            </p>
          </div>
        </div>
      </div>

      <div className="page-break"></div>

      {/* Session Details */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Session History</h2>
        <div className="space-y-6">
          {sessions.map((session, index) => (
            <div key={index} className="border-2 border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Session #{session.sessionNumber}</h3>
                  <p className="text-gray-600 mt-1">
                    {parseDate(session.date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })} at {session.time}
                  </p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                  session.progress === 'excellent' ? 'bg-green-600 text-white' :
                  session.progress === 'good' ? 'bg-blue-600 text-white' :
                  session.progress === 'fair' ? 'bg-yellow-600 text-white' :
                  'bg-red-600 text-white'
                }`}>
                  {session.progress.toUpperCase()}
                </span>
              </div>

              {session.sessionSummary && (
                <div className="mb-3">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Summary:</p>
                  <p className="text-gray-800 bg-gray-50 rounded p-3 italic">"{session.sessionSummary}"</p>
                </div>
              )}

              {session.notes && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Detailed Notes:</p>
                  <p className="text-gray-800 bg-gray-50 rounded p-3 whitespace-pre-wrap">{session.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Program Completion */}
      {appointment.programCompleted && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-green-800 mb-3">✅ Program Completed</h3>
          <p className="text-gray-700 mb-2">
            Completion Date: {new Date(appointment.completedAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
          {appointment.completionNotes && (
            <div className="mt-3">
              <p className="text-sm font-semibold text-gray-700 mb-1">Final Notes:</p>
              <p className="text-gray-700 bg-white rounded p-3">{appointment.completionNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="border-t-2 border-gray-300 pt-6 mt-8">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-gray-600 font-semibold mb-1">Case Manager</p>
            <p className="text-lg text-gray-900">
              {appointment.assignedCaseManager?.name || appointment.assignedCaseManager?.username || 'N/A'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 font-semibold mb-1">Report Generated</p>
            <p className="text-lg text-gray-900">
              {new Date().toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>
        <div className="mt-6 bg-gray-100 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-600">
            This is a confidential medical document. All information is protected under privacy regulations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SessionTimelineModal;