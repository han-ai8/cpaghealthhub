// PrintableFormalLetter.jsx - FIXED: Each session on separate page
// Copy this to: src/components/PrintableFormalLetter.jsx

import React from 'react';

const PrintableFormalLetter = ({ history }) => {
  const parseDate = (dateString) => {
    if (!dateString) return new Date();
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  let totalPrintPages = history.sessions.length;
  if (history.programInfo.programCompleted) {
    totalPrintPages += 1;
  }

  return (
    <div className="print-container" style={{ fontFamily: 'Times New Roman, serif', fontSize: '12pt', lineHeight: '1.6' }}>
      <style>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          
          /* ✅ CRITICAL: Remove ALL scrollbars */
          *::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          
          * {
            overflow: visible !important;
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          
          .print\\:hidden { 
            display: none !important; 
          }
          
          /* ✅ CRITICAL: Proper page setup */
          @page { 
            size: A4 portrait; 
            margin: 0.75in;
          }
          
          /* ✅ CRITICAL: Each print-page gets its own page */
          .print-page {
            page-break-after: always !important;
            page-break-inside: avoid !important;
            break-after: page !important;
            break-inside: avoid !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            position: relative !important;
          }
          
          /* ✅ Remove page break after last page */
          .print-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          
          /* ✅ Page footer at bottom */
          .page-footer {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 1px solid #d1d5db;
            font-size: 11px;
            color: #6b7280;
            text-align: center;
          }
        }
        
        /* Screen styles */
        @media screen {
          .print-page {
            margin-bottom: 40px;
            padding: 40px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: white;
          }
        }
      `}</style>

      {/* ============== SESSION PAGES ============== */}
      {history.sessions.map((session, index) => (
        <div key={index} className="print-page">
          <div className="mb-8">
            <p className="text-right mb-4">
              {parseDate(history.generatedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
            <p className="font-bold text-center text-xl mb-6">
              SESSION SUMMARY REPORT - SESSION #{session.sessionNumber}
            </p>
          </div>

          <div className="mb-6 border-b-2 border-black pb-4">
            <p className="mb-1"><strong>Client Name:</strong> {history.patient.name}</p>
            <p className="mb-1"><strong>Age:</strong> {history.patient.age || 'N/A'}</p>
            <p className="mb-1"><strong>Gender:</strong> {history.patient.gender || 'N/A'}</p>
            <p className="mb-1"><strong>Location:</strong> {history.patient.location || 'N/A'}</p>
            <p className="mb-1"><strong>Session Number:</strong> #{session.sessionNumber}</p>
            <p className="mb-1">
              <strong>Session Date:</strong>{' '}
              {parseDate(session.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
              {' at '}
              {session.time}
            </p>
            <p className="mb-1"><strong>Case Manager:</strong> {history.caseManager.name}, {history.caseManager.email}</p>
            <p className="mb-1"><strong>Session Type:</strong> In-person</p>
            <p className="mb-1"><strong>Progress Level:</strong> {session.progress.charAt(0).toUpperCase() + session.progress.slice(1)}</p>
          </div>

          <div className="mb-6">
            <p className="font-bold mb-3">SESSION SUMMARY NOTE REPORT:</p>

            <div className="text-justify space-y-3">
              {session.sessionSummary && (
                <p className="indent-8">
                  <strong>Summary:</strong> {session.sessionSummary}
                </p>
              )}

              {session.notes && (
                <p className="indent-8 whitespace-pre-wrap">
                  <strong>Detailed Observations:</strong> {session.notes}
                </p>
              )}

              {!session.sessionSummary && !session.notes && (
                <p className="indent-8">No detailed notes were recorded for this session.</p>
              )}
            </div>
          </div>

          <div className="mb-6 text-sm">
            <p><strong>Service Provided:</strong> {session.service}</p>
            {session.completedAt && (
              <p>
                <strong>Session Completed:</strong>{' '}
                {parseDate(session.completedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })} at{' '}
                {parseDate(session.completedAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>

          <div className="mt-12 pt-6 border-t border-gray-400">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="mb-8">_________________________</p>
                <p className="text-sm"><strong>Case Manager Signature</strong></p>
                <p className="text-sm">{history.caseManager.name}</p>
              </div>
              <div>
                <p className="mb-8">_________________________</p>
                <p className="text-sm"><strong>Date</strong></p>
              </div>
            </div>
          </div>

          <div className="page-footer">
            <p>CONFIDENTIAL DOCUMENT - Page {index + 1} of {totalPrintPages}</p>
          </div>
        </div>
      ))}

      {/* ============== FINAL COMPLETION PAGE ============== */}
      {history.programInfo.programCompleted && (
        <div className="print-page">
          <div className="text-center mb-8">
            <p className="font-bold text-2xl mb-4">PROGRAM COMPLETION CERTIFICATE</p>
            <p className="text-xl">This is to certify that</p>
            <p className="font-bold text-2xl my-4">{history.patient.name}</p>
            <p className="text-xl">has successfully completed the counseling program</p>
          </div>

          <div className="mb-6">
            <p className="mb-2"><strong>Patient Details:</strong></p>
            <p className="ml-4 mb-1">Age: {history.patient.age || 'N/A'}</p>
            <p className="ml-4 mb-1">Gender: {history.patient.gender || 'N/A'}</p>
            <p className="ml-4 mb-4">Location: {history.patient.location || 'N/A'}</p>

            <p className="mb-2"><strong>Total Sessions Completed:</strong> {history.programInfo.totalSessions}</p>
            <p className="mb-2"><strong>Program Duration:</strong></p>
            <p className="ml-4">
              From: {parseDate(history.programInfo.firstSessionDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
            <p className="ml-4">
              To: {parseDate(history.programInfo.lastSessionDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
            <p className="mb-2 mt-4"><strong>Average Progress:</strong> {history.statistics.averageProgress}</p>
          </div>

          {history.programInfo.completionNotes && (
            <div className="mb-8">
              <p className="font-bold mb-2">FINAL ASSESSMENT:</p>
              <p className="text-justify indent-8 whitespace-pre-wrap">{history.programInfo.completionNotes}</p>
            </div>
          )}

          <div className="mt-12 grid grid-cols-2 gap-8">
            <div>
              <p className="mb-8">_________________________</p>
              <p><strong>Case Manager</strong></p>
              <p>{history.caseManager.name}</p>
            </div>
            <div>
              <p className="mb-8">_________________________</p>
              <p><strong>Date</strong></p>
              <p>
                {parseDate(history.programInfo.completedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div className="page-footer">
            <p>CONFIDENTIAL DOCUMENT - Page {totalPrintPages} of {totalPrintPages}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintableFormalLetter;