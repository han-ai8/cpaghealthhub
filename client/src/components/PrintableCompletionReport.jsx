import React from 'react';

const PrintableCompletionReport = ({ report, patient, appointment }) => {
  if (!report) return null;

  return (
    <div className="bg-white">
      <style>{`
        @media print {
          /* General Print Adjustments */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            box-sizing: border-box !important; /* Ensure consistent box model */
          }
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important; /* Hide scrollbars on body/html during print */
            width: 100% !important;
            height: 100% !important;
          }
          
          /* CRITICAL: Remove ALL scrollbars everywhere */
          *::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          * {
            overflow: hidden !important; /* Ensure no internal scrolling */
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          
          .print\\:hidden { 
            display: none !important; 
          }
          
          /* CRITICAL: Proper page setup */
          @page { 
            size: A4 portrait; 
            margin: 0.75in; /* Standard margin */
          }
          
          /* CRITICAL: Each major section gets its own page */
          .page-section {
            page-break-after: always !important; /* Force a page break after each section */
            page-break-inside: avoid !important; /* Prevent section from breaking mid-content */
            break-after: page !important; /* Modern CSS property for page break */
            break-inside: avoid !important; /* Modern CSS property for avoiding breaks */
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important; /* Allow content to dictate height */
            min-height: 95vh; /* Ensure section takes at least most of a page, allows for footer/header */
            padding: 0 !important;
            margin: 0 !important;
            overflow: hidden !important; /* Prevents overflow outside the page-section box */
            position: relative; /* For absolute positioning of footers if needed */
          }
          
          /* Remove page break after the very last section */
          .page-section:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
            min-height: unset; /* Don't force min-height on the last page if content is short */
          }
          
          /* Ensure header and content stay together */
          .session-header {
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-after: avoid !important;
            break-inside: avoid !important;
          }
          
          .session-content-wrapper {
            display: block !important;
            overflow: visible !important; /* Let content flow */
          }
          
          /* Content sections */
          .content-section {
            margin-bottom: 20px !important;
            display: block !important;
            overflow: visible !important;
            page-break-inside: avoid; /* Keep content sections together */
          }
          
          .content-title {
            font-size: 18px !important;
            font-weight: bold !important;
            margin-bottom: 12px !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
          
          .content-box {
            background-color: #f9fafb !important;
            padding: 15px !important;
            margin: 0 0 12px 0 !important;
            border-left: 4px solid #3b82f6 !important;
            text-align: left !important;
            width: 100% !important;
            box-sizing: border-box !important;
            overflow: visible !important;
          }
          
          .content-box p {
            text-align: left !important;
            white-space: pre-wrap !important;
            word-wrap: break-word !important;
            margin: 0 !important;
            padding: 0 !important;
            line-height: 1.6 !important;
            overflow: visible !important;
          }
          
          /* Tables */
          table {
            width: 100% !important;
            border-collapse: collapse;
            margin: 15px 0;
            table-layout: fixed;
            page-break-inside: avoid; /* Keep tables from breaking across pages */
          }
          
          table td {
            padding: 8px 0;
            vertical-align: top;
            text-align: left !important;
            word-wrap: break-word;
          }
          
          table td:first-child {
            width: 35%;
            font-weight: 600;
          }
          
          /* Headers */
          h1, h2, h3, h4, h5, h6 {
            text-align: left !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
          
          /* Dividers */
          .border-line {
            border-bottom: 3px solid #2563eb;
            padding-bottom: 15px;
            margin-bottom: 20px;
            page-break-after: avoid; /* Keep divider with following content */
          }
          
          /* Prevent orphans and widows */
          p {
            orphans: 3;
            widows: 3;
          }
          
          /* Footer positioning for print - ensure it's at the bottom of each content page if desired */
          .page-footer-print {
            position: absolute;
            bottom: 0;
            left: 0.75in;
            right: 0.75in;
            width: calc(100% - 1.5in);
            padding-top: 15px;
            border-top: 1px solid #d1d5db;
            font-size: 11px;
            color: #6b7280;
            text-align: center; /* Center the page numbers */
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
          .page-footer-print {
            display: none; /* Hide print footer on screen */
          }
        }
      `}</style>
      
      {/* ============== COVER PAGE ============== */}
      <div className="page-section">
        <div className="border-line">
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '15px' }}>
            PROGRAM COMPLETION REPORT
          </h1>
          <p style={{ fontSize: '20px', marginBottom: '8px', fontWeight: '600' }}>
            Psychological Support Services
          </p>
          <p style={{ fontSize: '18px', color: '#4b5563', marginBottom: '6px' }}>
            CPAG REGION IV-A
          </p>
          <p style={{ fontSize: '16px', color: '#6b7280' }}>
            Cavite Positive Action Group
          </p>
        </div>

        {/* Patient Information */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '15px' }}>
            Patient Information
          </h2>
          <table>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td>Client Name:</td>
                <td style={{ fontSize: '16px', fontWeight: 'bold' }}>{report.patient.name}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td>Age:</td>
                <td style={{ fontSize: '16px' }}>{report.patient.age || 'N/A'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td>Gender:</td>
                <td style={{ fontSize: '16px' }}>{report.patient.gender || 'N/A'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td>Location:</td>
                <td style={{ fontSize: '16px' }}>{report.patient.location || 'N/A'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Program Summary */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '15px' }}>
            Program Summary
          </h2>
          <table>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td>Service Provided:</td>
                <td style={{ fontSize: '14px' }}>{report.programInfo.service || 'Psychosocial support and assistance'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td>Total Sessions:</td>
                <td style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>
                  {report.programInfo.totalSessions}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td>Completed Sessions:</td>
                <td style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>
                  {report.programInfo.completedSessions}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td>Average Progress:</td>
                <td style={{ fontSize: '24px', fontWeight: 'bold', color: '#7c3aed' }}>
                  {report.statistics.averageProgress}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td>Program Duration:</td>
                <td style={{ fontSize: '14px' }}>
                  {new Date(report.programInfo.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - 
                  {new Date(report.programInfo.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Progress Distribution */}
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '15px' }}>
            Progress Distribution
          </h2>
          <table>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ color: '#16a34a' }}>Excellent:</td>
                <td style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {report.statistics.progressDistribution.excellent} session(s)
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ color: '#2563eb' }}>Good:</td>
                <td style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {report.statistics.progressDistribution.good} session(s)
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ color: '#ca8a04' }}>Fair:</td>
                <td style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {report.statistics.progressDistribution.fair} session(s)
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ color: '#dc2626' }}>Poor:</td>
                <td style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {report.statistics.progressDistribution.poor} session(s)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="page-footer-print">
          <p>Page 1 of {report.sessions.length + 2}</p>
        </div>
      </div>

      {/* ============== SESSION PAGES - ONE SESSION PER PAGE ============== */}
      {report.sessions.map((session, idx) => (
        <div key={idx} className="page-section">
          {/* Session Header */}
          <div className="session-header" style={{ marginBottom: '25px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '12px' }}>
              Session #{session.sessionNumber}
            </h1>
            <div style={{ borderBottom: '2px solid #d1d5db', paddingBottom: '15px', marginBottom: '20px' }}>
              <table>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: '600' }}>Date:</td>
                    <td style={{ fontSize: '15px' }}>
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
                    <td style={{ fontSize: '15px' }}>{session.time}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '600' }}>Session Type:</td>
                    <td style={{ fontSize: '15px' }}>In-person</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '600' }}>Progress Level:</td>
                    <td style={{ fontSize: '18px', fontWeight: 'bold', color: 
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
                      <td style={{ fontSize: '14px' }}>
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

          {/* Session Content */}
          <div className="session-content-wrapper">
            {session.notes.map((note, noteIdx) => (
              <div key={noteIdx}>
                {note.sessionSummary && (
                  <div className="content-section">
                    <h2 className="content-title">
                      Session Summary
                    </h2>
                    <div className="content-box">
                      <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
                        {note.sessionSummary}
                      </p>
                    </div>
                  </div>
                )}
                
                {note.notes && (
                  <div className="content-section">
                    <h2 className="content-title">
                      Detailed Observations
                    </h2>
                    <div className="content-box">
                      <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
                        {note.notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Page Footer */}
          <div className="page-footer-print">
            <p>Session {idx + 1} of {report.sessions.length} | Page {idx + 2} of {report.sessions.length + 2}</p>
          </div>
        </div>
      ))}

      {/* ============== FINAL PAGE ============== */}
      <div className="page-section">
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '25px' }}>
          Report Information
        </h1>
        
        <table style={{ marginBottom: '35px' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td>Case Manager:</td>
              <td style={{ fontSize: '16px', fontWeight: 'bold' }}>
                {report.generatedBy.name || report.generatedBy.username}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td>Email:</td>
              <td style={{ fontSize: '14px' }}>{report.generatedBy.email}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td>Report Generated:</td>
              <td style={{ fontSize: '14px' }}>
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
              <td style={{ fontSize: '16px', fontWeight: 'bold' }}>
                #{appointment?.sessionTracking?.sessionNumber || 'N/A'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Case Manager Signature Section */}
        <div style={{ marginTop: '50px', marginBottom: '35px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '18px' }}>
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
                <td style={{ paddingTop: '8px', fontSize: '12px' }}>
                  Signature over Printed Name
                </td>
                <td></td>
                <td style={{ paddingTop: '8px', fontSize: '12px' }}>
                  Date
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Confidentiality Notice */}
        <div style={{ 
          marginTop: '35px', 
          padding: '20px', 
          backgroundColor: '#f3f4f6', 
          border: '2px solid #d1d5db',
          borderRadius: '6px'
        }}>
          <p style={{ 
            fontSize: '12px', 
            lineHeight: '1.6', 
            color: '#374151',
            margin: 0,
            fontWeight: '600'
          }}>
            <strong style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
              CONFIDENTIAL DOCUMENT
            </strong>
            This document contains confidential patient information protected under medical privacy regulations. 
            Unauthorized disclosure, copying, distribution, or use of this information is strictly prohibited. 
            This report is intended solely for professional use by authorized healthcare personnel at CPAG Region IV-A.
            <br/><br/>
            Page {report.sessions.length + 2} of {report.sessions.length + 2}
          </p>
        </div>
        <div className="page-footer-print">
          <p>Page {report.sessions.length + 2} of {report.sessions.length + 2}</p>
        </div>
      </div>
    </div>
  );
};

export default PrintableCompletionReport;