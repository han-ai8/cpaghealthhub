// ✅ COMPLETE FIXED PrintableCompletionReport Component
// Replace this entire component in your CaseManagerPlanner.jsx

const PrintableCompletionReport = ({ report, patient, appointment }) => {
  if (!report) return null;

  return (
    <div className="bg-white">
      <style>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          body { 
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .print\\:hidden { 
            display: none !important; 
          }
          
          /* Remove scrollbars */
          ::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          
          * {
            overflow: visible !important;
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          
          /* ✅ FIX: Proper page setup with NO left margin issues */
          @page { 
            size: A4 portrait; 
            margin: 0.5in;
          }
          
          /* ✅ FIX: Each section on its own page with proper alignment */
          .page-section {
            page-break-after: always;
            page-break-inside: avoid;
            min-height: 100vh;
            padding: 0;
            margin: 0;
            width: 100%;
          }
          
          /* ✅ FIX: Force everything to the left */
          * {
            text-align: left !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
          
          .text-center {
            text-align: left !important;
          }
          
          /* ✅ FIX: Table styling with full width */
          table {
            width: 100% !important;
            border-collapse: collapse;
            margin: 20px 0;
            table-layout: fixed;
          }
          
          table td {
            padding: 10px 0;
            vertical-align: top;
            text-align: left !important;
            word-wrap: break-word;
          }
          
          table td:first-child {
            width: 35%;
            font-weight: 600;
          }
          
          /* ✅ FIX: Headers properly aligned */
          h1, h2, h3, h4, h5, h6 {
            text-align: left !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            page-break-after: avoid;
          }
          
          /* ✅ FIX: Content boxes with proper width */
          .content-box {
            background-color: #f9fafb !important;
            padding: 20px !important;
            margin: 15px 0 !important;
            border-left: 4px solid #3b82f6 !important;
            text-align: left !important;
            width: 100% !important;
            box-sizing: border-box;
          }
          
          .content-box p {
            text-align: left !important;
            white-space: pre-wrap !important;
            word-wrap: break-word !important;
            margin: 0;
            line-height: 1.8;
          }
          
          /* ✅ FIX: Dividers and borders */
          .border-line {
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
        }
        
        /* Screen styles */
        @media screen {
          .page-section {
            margin-bottom: 40px;
            padding: 40px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
          }
        }
      `}</style>
      
      {/* ============== COVER PAGE ============== */}
      <div className="page-section">
        <div className="border-line">
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '20px' }}>
            PROGRAM COMPLETION REPORT
          </h1>
          <p style={{ fontSize: '22px', marginBottom: '10px', fontWeight: '600' }}>
            Psychological Support Services
          </p>
          <p style={{ fontSize: '20px', color: '#4b5563', marginBottom: '8px' }}>
            CPAG REGION IV-A
          </p>
          <p style={{ fontSize: '18px', color: '#6b7280' }}>
            Cavite Positive Action Group
          </p>
        </div>

        {/* ✅ Patient Information with full details */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 'bold', marginBottom: '20px' }}>
            Patient Information
          </h2>
          <table>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td>Client Name:</td>
                <td style={{ fontSize: '18px', fontWeight: 'bold' }}>{report.patient.name}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td>Age:</td>
                <td style={{ fontSize: '18px' }}>{report.patient.age || 'N/A'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td>Gender:</td>
                <td style={{ fontSize: '18px' }}>{report.patient.gender || 'N/A'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td>Location:</td>
                <td style={{ fontSize: '18px' }}>{report.patient.location || 'N/A'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ✅ Program Summary with enhanced stats */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 'bold', marginBottom: '20px' }}>
            Program Summary
          </h2>
          <table>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td>Service Provided:</td>
                <td style={{ fontSize: '16px' }}>{report.programInfo.service || 'Psychosocial support and assistance'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td>Total Sessions:</td>
                <td style={{ fontSize: '32px', fontWeight: 'bold', color: '#2563eb' }}>
                  {report.programInfo.totalSessions}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td>Completed Sessions:</td>
                <td style={{ fontSize: '32px', fontWeight: 'bold', color: '#16a34a' }}>
                  {report.programInfo.completedSessions}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td>Average Progress:</td>
                <td style={{ fontSize: '32px', fontWeight: 'bold', color: '#7c3aed' }}>
                  {report.statistics.averageProgress}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td>Program Duration:</td>
                <td style={{ fontSize: '16px' }}>
                  {new Date(report.programInfo.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - 
                  {new Date(report.programInfo.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ✅ Progress Distribution */}
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: 'bold', marginBottom: '20px' }}>
            Progress Distribution
          </h2>
          <table>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ color: '#16a34a' }}>Excellent:</td>
                <td style={{ fontSize: '20px', fontWeight: 'bold' }}>
                  {report.statistics.progressDistribution.excellent} session(s)
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ color: '#2563eb' }}>Good:</td>
                <td style={{ fontSize: '20px', fontWeight: 'bold' }}>
                  {report.statistics.progressDistribution.good} session(s)
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ color: '#ca8a04' }}>Fair:</td>
                <td style={{ fontSize: '20px', fontWeight: 'bold' }}>
                  {report.statistics.progressDistribution.fair} session(s)
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ color: '#dc2626' }}>Poor:</td>
                <td style={{ fontSize: '20px', fontWeight: 'bold' }}>
                  {report.statistics.progressDistribution.poor} session(s)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ============== SESSION PAGES (Each session on its own page) ============== */}
      {report.sessions.map((session, idx) => (
        <div key={idx} className="page-section">
          <div style={{ marginBottom: '30px' }}>
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '15px' }}>
              Session #{session.sessionNumber}
            </h1>
            <div style={{ borderBottom: '2px solid #d1d5db', paddingBottom: '20px', marginBottom: '30px' }}>
              <table>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: '600' }}>Date:</td>
                    <td style={{ fontSize: '18px' }}>
                      {new Date(session.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '600' }}>Time:</td>
                    <td style={{ fontSize: '18px' }}>{session.time}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '600' }}>Session Type:</td>
                    <td style={{ fontSize: '18px' }}>In-person</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '600' }}>Progress Level:</td>
                    <td style={{ fontSize: '20px', fontWeight: 'bold', color: 
                      session.notes[0]?.progress === 'excellent' ? '#16a34a' :
                      session.notes[0]?.progress === 'good' ? '#2563eb' :
                      session.notes[0]?.progress === 'fair' ? '#ca8a04' : '#dc2626'
                    }}>
                      {session.notes[0]?.progress?.toUpperCase() || 'N/A'}
                    </td>
                  </tr>
                  {session.notes[0]?.completedAt && (
                    <tr>
                      <td style={{ fontWeight: '600' }}>Completed At:</td>
                      <td style={{ fontSize: '16px' }}>
                        {new Date(session.notes[0].completedAt).toLocaleString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ✅ Session Content with proper formatting */}
          {session.notes.map((note, noteIdx) => (
            <div key={noteIdx} style={{ marginBottom: '35px' }}>
              {note.sessionSummary && (
                <div style={{ marginBottom: '30px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '15px' }}>
                    Session Summary
                  </h2>
                  <div className="content-box">
                    <p style={{ fontSize: '16px', lineHeight: '1.8' }}>
                      {note.sessionSummary}
                    </p>
                  </div>
                </div>
              )}
              
              {note.notes && (
                <div style={{ marginBottom: '30px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '15px' }}>
                    Detailed Observations
                  </h2>
                  <div className="content-box">
                    <p style={{ fontSize: '16px', lineHeight: '1.8' }}>
                      {note.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* ✅ Page Footer */}
          <div style={{ 
            marginTop: '50px', 
            paddingTop: '20px', 
            borderTop: '1px solid #d1d5db'
          }}>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
              Session {idx + 1} of {report.sessions.length} | Page {idx + 2} of {report.sessions.length + 2}
            </p>
          </div>
        </div>
      ))}

      {/* ============== FINAL PAGE ============== */}
      <div className="page-section">
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '30px' }}>
          Report Information
        </h1>
        
        <table style={{ marginBottom: '40px' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td>Case Manager:</td>
              <td style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {report.generatedBy.name || report.generatedBy.username}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td>Email:</td>
              <td style={{ fontSize: '16px' }}>{report.generatedBy.email}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td>Report Generated:</td>
              <td style={{ fontSize: '16px' }}>
                {new Date(report.generatedAt).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td>Session Number:</td>
              <td style={{ fontSize: '18px', fontWeight: 'bold' }}>#{appointment?.sessionTracking?.sessionNumber || 'N/A'}</td>
            </tr>
          </tbody>
        </table>

        {/* ✅ Case Manager Signature Section */}
        <div style={{ marginTop: '60px', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '20px' }}>
            Case Manager Signature
          </h2>
          <table>
            <tbody>
              <tr>
                <td style={{ borderBottom: '2px solid #000', width: '60%', paddingBottom: '5px' }}>
                  &nbsp;
                </td>
                <td style={{ width: '10%' }}></td>
                <td style={{ borderBottom: '2px solid #000', width: '30%', paddingBottom: '5px' }}>
                  &nbsp;
                </td>
              </tr>
              <tr>
                <td style={{ paddingTop: '8px', fontSize: '14px' }}>
                  Signature over Printed Name
                </td>
                <td></td>
                <td style={{ paddingTop: '8px', fontSize: '14px' }}>
                  Date
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ✅ Confidentiality Notice */}
        <div style={{ 
          marginTop: '40px', 
          padding: '25px', 
          backgroundColor: '#f3f4f6', 
          border: '2px solid #d1d5db',
          borderRadius: '8px'
        }}>
          <p style={{ 
            fontSize: '14px', 
            lineHeight: '1.8', 
            color: '#374151',
            margin: 0,
            fontWeight: '600'
          }}>
            <strong style={{ display: 'block', marginBottom: '10px', fontSize: '16px' }}>CONFIDENTIAL DOCUMENT</strong>
            This document contains confidential patient information protected under medical privacy regulations. 
            Unauthorized disclosure, copying, distribution, or use of this information is strictly prohibited. 
            This report is intended solely for professional use by authorized healthcare personnel at CPAG Region IV-A.
            <br/><br/>
            Page 1 of 4
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrintableCompletionReport;