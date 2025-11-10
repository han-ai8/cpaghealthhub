import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  HiHome, 
  HiUser, 
  HiUserGroup, 
  HiCalendar, 
  HiLocationMarker,
  HiX,
} from 'react-icons/hi';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfUse, setShowTermsOfUse] = useState(false);

  const menuItems = [
    { name: 'Home', path: '/user/home', icon: HiHome },
    { name: 'Profile', path: '/user/profile', icon: HiUser },
    { name: 'Community', path: '/user/community', icon: HiUserGroup },
    { name: 'Schedule', path: '/user/schedule', icon: HiCalendar },
    { name: 'Clinic Finder', path: '/user/clinic-finder', icon: HiLocationMarker },
  ];

  // Close modal when clicking outside
  const handleModalOverlayClick = (e, closeFunction) => {
    if (e.target === e.currentTarget) {
      closeFunction(false);
    }
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-[#4C8DD8]/50 z-40 transition-opacity"
          onClick={toggleSidebar}
          aria-hidden="false"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 z-50 h-[calc(100vh-4rem)] w-56 bg-[#FFFFFF] shadow-xl border-r border-[#4C8DD8]/20 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:h-full lg:top-0
        `} 
        role="complementary"
        aria-hidden={!isOpen ? "true" : "false"}
        aria-expanded={isOpen}
      >
        <div className="flex flex-col h-full">
          {/* Navigation Menu */}
          <nav className="mt-6 flex items-center flex-col overflow-y-auto py-4 flex-1">
            <ul className="menu menu-lg px-2 space-y-2 w-full">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={handleModalOverlayClick}
                      className={`
                        flex items-center space-x-3 rounded-lg px-4 py-3 transition-all duration-200 hover:bg-[#4C8DD8]/10 hover:text-[#2E7D32]
                        ${isActive ? 'bg-[#4C8DD8] text-[#FFFFFF] shadow-md' : 'text-[#4C8DD8]'}
                      `}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="font-medium">{item.name}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer Section */}
          <div className="border-t border-[#4C8DD8]/20 p-4 mt-auto bg-[#FFFFFF]/95">
            <div className="flex flex-col items-center">
              <div className="w-full text-center">
                <p className="text-xs text-[#4C8DD8]">
                  <button
                    onClick={() => setShowPrivacyPolicy(true)}
                    className="hover:text-[#2E7D32] transition-colors duration-200 underline"
                  >
                    Privacy Policy
                  </button>
                  {' | '}
                  <button
                    onClick={() => setShowTermsOfUse(true)}
                    className="hover:text-[#2E7D32] transition-colors duration-200 underline"
                  >
                    Terms of Use
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Privacy Policy Modal */}
      {showPrivacyPolicy && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => handleModalOverlayClick(e, setShowPrivacyPolicy)}
        >
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#4C8DD8]/20 bg-[#4C8DD8] rounded-t-lg flex-shrink-0">
              <h2 className="text-2xl font-bold text-white">Privacy Policy</h2>
              <button
                onClick={() => setShowPrivacyPolicy(false)}
                className="text-white hover:text-gray-200 transition-colors"
                aria-label="Close modal"
              >
                <HiX className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="prose prose-sm max-w-none text-gray-700">
                <p className="text-sm text-gray-500 mb-4">Last Updated: November 10, 2025</p>
                
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                  <p className="font-semibold text-blue-900">Your Privacy is Our Priority</p>
                  <p className="text-sm text-blue-800 mt-1">
                    We understand the sensitive nature of HIV-related information and are committed to protecting your anonymity and confidentiality.
                  </p>
                </div>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">1. Information We Collect</h3>
                <p className="mb-2"><strong>Account Information:</strong></p>
                <ul className="list-disc ml-6 mb-4 space-y-1">
                  <li>Anonymous username (pseudonym)</li>
                  <li>Email address (for verification and account recovery only)</li>
                  <li>Encrypted password</li>
                  <li>Optional profile information you choose to share</li>
                </ul>
                
                <p className="mb-2"><strong>Health-Related Information:</strong></p>
                <ul className="list-disc ml-6 mb-4 space-y-1">
                  <li>Information you voluntarily share in community posts</li>
                  <li>Appointment details with healthcare providers in Cavite</li>
                  <li>Articles you read or save (stored anonymously)</li>
                </ul>

                <p className="mb-2"><strong>Technical Information:</strong></p>
                <ul className="list-disc ml-6 mb-4 space-y-1">
                  <li>IP address (encrypted and not linked to your identity)</li>
                  <li>Browser type and device information</li>
                  <li>Usage patterns (for improving platform functionality)</li>
                </ul>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">2. How We Use Your Information</h3>
                <ul className="list-disc ml-6 mb-4 space-y-2">
                  <li><strong>Account Management:</strong> To create and maintain your anonymous account</li>
                  <li><strong>Appointment Scheduling:</strong> To facilitate booking with HIV clinics and healthcare providers in Cavite</li>
                  <li><strong>Community Features:</strong> To enable participation in support forums and discussions</li>
                  <li><strong>Educational Content:</strong> To provide relevant HIV-related articles and resources</li>
                  <li><strong>Clinic Finder:</strong> To help you locate HIV testing and treatment centers in Cavite</li>
                  <li><strong>Platform Improvement:</strong> To analyze usage patterns and enhance user experience</li>
                  <li><strong>Security:</strong> To protect against unauthorized access and ensure platform safety</li>
                </ul>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">3. Anonymity and Confidentiality</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="font-semibold text-green-900 mb-2">Our Commitment to Your Anonymity:</p>
                  <ul className="list-disc ml-6 space-y-1 text-sm text-green-800">
                    <li>We never require or store your real name</li>
                    <li>Your username is completely anonymous and cannot be traced to your identity</li>
                    <li>Health information shared is not linked to your real identity</li>
                    <li>We do not share HIV status or health information with third parties</li>
                    <li>All data is encrypted both in transit and at rest</li>
                    <li>We comply with medical confidentiality standards</li>
                  </ul>
                </div>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">4. Information Sharing and Disclosure</h3>
                <p className="mb-2"><strong>We DO NOT sell or share your personal information.</strong> Limited sharing only occurs in these circumstances:</p>
                <ul className="list-disc ml-6 mb-4 space-y-2">
                  <li><strong>Healthcare Providers:</strong> When you book an appointment, necessary contact information is shared only with your chosen clinic</li>
                  <li><strong>Legal Obligations:</strong> Only if required by law (we will notify you unless legally prohibited)</li>
                  <li><strong>Safety Concerns:</strong> If there's an immediate threat to someone's safety</li>
                  <li><strong>Service Providers:</strong> Trusted partners who help operate our platform (under strict confidentiality agreements)</li>
                </ul>
                
                <p className="font-semibold text-red-600 mb-4">
                  ⚠️ We will NEVER disclose your HIV status, medical information, or identity to employers, insurance companies, or any unauthorized parties.
                </p>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">5. Data Security</h3>
                <p className="mb-2">We implement multiple layers of security:</p>
                <ul className="list-disc ml-6 mb-4 space-y-1">
                  <li>End-to-end encryption for sensitive data</li>
                  <li>Secure SSL/HTTPS connections</li>
                  <li>Regular security audits and penetration testing</li>
                  <li>Access controls and authentication protocols</li>
                  <li>Secure servers with data backup systems</li>
                  <li>Employee confidentiality agreements and limited access</li>
                </ul>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">6. Your Rights and Choices</h3>
                <p className="mb-2">You have complete control over your information:</p>
                <ul className="list-disc ml-6 mb-4 space-y-2">
                  <li><strong>Access:</strong> View all data we have about you</li>
                  <li><strong>Correction:</strong> Update or correct your information anytime</li>
                  <li><strong>Deletion:</strong> Request complete account deletion (we'll erase all your data within 30 days)</li>
                  <li><strong>Data Export:</strong> Download a copy of your data</li>
                  <li><strong>Opt-Out:</strong> Unsubscribe from email notifications</li>
                  <li><strong>Anonymity:</strong> Continue using the platform anonymously</li>
                </ul>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">7. Cookies and Tracking</h3>
                <p className="mb-4">
                  We use minimal cookies only for essential functions (login sessions, security). 
                  We do NOT use advertising cookies or sell your data to advertisers. You can disable cookies in your browser settings, though some features may not work properly.
                </p>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">8. Third-Party Links</h3>
                <p className="mb-4">
                  Our platform may contain links to external websites (clinics, health resources). 
                  We are not responsible for the privacy practices of these sites. Please review their privacy policies before sharing information.
                </p>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">9. Children's Privacy</h3>
                <p className="mb-4">
                  Our platform is intended for users 18 years and older. We do not knowingly collect information from minors. 
                  If we discover a minor has created an account, we will delete it immediately.
                </p>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">10. Data Retention</h3>
                <p className="mb-4">
                  We retain your data only as long as necessary to provide services or as required by law. 
                  When you delete your account, all personal information is permanently erased within 30 days. 
                  Anonymized data may be retained for research and platform improvement.
                </p>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">11. Philippine Data Privacy Act Compliance</h3>
                <p className="mb-4">
                  We comply with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173) and all relevant regulations. 
                  You have rights under Philippine law to access, correct, and delete your personal data.
                </p>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">12. Changes to This Policy</h3>
                <p className="mb-4">
                  We may update this Privacy Policy periodically. Material changes will be communicated via email or platform notification. 
                  Continued use of the platform after changes indicates acceptance.
                </p>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">13. Contact Us</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="mb-2">For privacy concerns, questions, or to exercise your rights:</p>
                  <ul className="space-y-1 text-sm">
                    <li><strong>Email:</strong> cavitepositiveactiongroup@outlook.com</li>
                    <li><strong>Support:</strong> itsmedalgom@gmail.com</li>
                    <li><strong>Location:</strong> Cavite, Philippines</li>
                  </ul>
                  <p className="mt-3 text-sm text-gray-600">
                    We respond to all privacy inquiries within 48 hours.
                  </p>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-6">
                  <p className="font-semibold text-blue-900">Remember:</p>
                  <p className="text-sm text-blue-800 mt-1">
                    Your privacy and anonymity are fundamental to our mission. We will never compromise your confidentiality. 
                    If you have any concerns, please reach out to us immediately.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-4 border-t border-[#4C8DD8]/20 bg-gray-50 rounded-b-lg flex-shrink-0">
              <button
                onClick={() => setShowPrivacyPolicy(false)}
                className="px-6 py-2 bg-[#4C8DD8] text-white rounded-lg hover:bg-[#2E7D32] transition-colors duration-200 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Use Modal */}
      {showTermsOfUse && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => handleModalOverlayClick(e, setShowTermsOfUse)}
        >
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#4C8DD8]/20 bg-[#4C8DD8] rounded-t-lg flex-shrink-0">
              <h2 className="text-2xl font-bold text-white">Terms of Use</h2>
              <button
                onClick={() => setShowTermsOfUse(false)}
                className="text-white hover:text-gray-200 transition-colors"
                aria-label="Close modal"
              >
                <HiX className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="prose prose-sm max-w-none text-gray-700">
                <p className="text-sm text-gray-500 mb-4">Last Updated: November 10, 2025</p>
                
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                  <p className="font-semibold text-blue-900">Welcome to HealthHub</p>
                  <p className="text-sm text-blue-800 mt-1">
                    Please read these Terms of Use carefully before using our anonymous HIV social network and healthcare platform.
                  </p>
                </div>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">1. Acceptance of Terms</h3>
                <p className="mb-4">
                  By creating an account or using HealthHub, you agree to be bound by these Terms of Use and our Privacy Policy. 
                  If you do not agree with any part of these terms, you must not use our platform.
                </p>
                <p className="mb-4">
                  You confirm that you are at least 18 years of age and have the legal capacity to enter into this agreement.
                </p>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">2. Platform Purpose and Services</h3>
                <p className="mb-2">HealthHub provides:</p>
                <ul className="list-disc ml-6 mb-4 space-y-1">
                  <li>An anonymous social network for HIV awareness and support</li>
                  <li>Community forums for sharing experiences and information</li>
                  <li>Appointment scheduling with HIV clinics in Cavite</li>
                  <li>Educational articles about HIV prevention, testing, and treatment</li>
                  <li>A clinic finder to locate HIV services in Cavite</li>
                  <li>Resources for breaking stigma and promoting truth</li>
                </ul>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">3. User Account and Anonymity</h3>
                <p className="mb-2"><strong>Account Creation:</strong></p>
                <ul className="list-disc ml-6 mb-4 space-y-2">
                  <li>You must provide a valid email address for verification and account recovery</li>
                  <li>You must create an anonymous username (pseudonym) - NEVER use your real name</li>
                  <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                  <li>You must notify us immediately of any unauthorized access to your account</li>
                  <li>One person may create only one account</li>
                </ul>

                <p className="mb-2"><strong>Anonymity Protection:</strong></p>
                <ul className="list-disc ml-6 mb-4 space-y-1">
                  <li>Do not share personally identifiable information in public posts</li>
                  <li>Protect your own and others' anonymity at all times</li>
                  <li>Report any attempts to identify or dox other users</li>
                </ul>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">4. Acceptable Use Policy</h3>
                <p className="mb-2"><strong>You AGREE to:</strong></p>
                <ul className="list-disc ml-6 mb-4 space-y-1">
                  <li>Use the platform respectfully and responsibly</li>
                  <li>Provide accurate information when booking appointments</li>
                  <li>Respect other users' privacy and experiences</li>
                  <li>Follow community guidelines in forums and discussions</li>
                  <li>Report violations of these terms</li>
                </ul>

                <p className="mb-2"><strong>You AGREE NOT to:</strong></p>
                <ul className="list-disc ml-6 mb-4 space-y-2">
                  <li><strong>Harassment:</strong> Bully, threaten, or harass other users</li>
                  <li><strong>Discrimination:</strong> Post content that is discriminatory, hateful, or promotes stigma</li>
                  <li><strong>Misinformation:</strong> Share false medical information or dangerous health advice</li>
                  <li><strong>Privacy Violations:</strong> Attempt to identify other users or share their personal information</li>
                  <li><strong>Spam:</strong> Post spam, advertisements, or promotional content</li>
                  <li><strong>Illegal Content:</strong> Share illegal content or engage in illegal activities</li>
                  <li><strong>Sexual Content:</strong> Post sexually explicit material or solicit sexual services</li>
                  <li><strong>Impersonation:</strong> Pretend to be someone else or impersonate healthcare providers</li>
                  <li><strong>System Abuse:</strong> Hack, scrape, or interfere with platform functionality</li>
                </ul>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">5. Medical Disclaimer</h3>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
                  <p className="font-semibold text-yellow-900 mb-2">⚠️ IMPORTANT MEDICAL DISCLAIMER</p>
                  <ul className="list-disc ml-6 space-y-1 text-sm text-yellow-800">
                    <li>HealthHub is NOT a medical service provider</li>
                    <li>We do NOT provide medical advice, diagnosis, or treatment</li>
                    <li>Information on this platform is for educational purposes only</li>
                    <li>Always consult qualified healthcare professionals for medical advice</li>
                    <li>In case of emergency, call emergency services immediately</li>
                    <li>Do not delay seeking medical help because of something you read here</li>
                  </ul>
                </div>
                <p className="mb-4">
                  The platform connects you with healthcare providers, but we are not responsible for the quality, 
                  accuracy, or outcomes of medical services you receive from third-party providers.
                </p>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">6. Appointment Scheduling</h3>
                <ul className="list-disc ml-6 mb-4 space-y-2">
                  <li>Appointments are subject to clinic availability and confirmation</li>
                  <li>You must arrive on time and bring valid identification if required</li>
                  <li>Cancel appointments at least 24 hours in advance when possible</li>
                  <li>We are not responsible for missed appointments or clinic services</li>
                  <li>Appointment information is shared only with your chosen healthcare provider</li>
                </ul>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">7. Community Guidelines</h3>
                <p className="mb-2"><strong>Our community is built on:</strong></p>
                <ul className="list-disc ml-6 mb-4 space-y-1">
                  <li>Respect and compassion for all members</li>
                  <li>Evidence-based information sharing</li>
                  <li>Breaking stigma through education and support</li>
                  <li>Confidentiality and privacy protection</li>
                  <li>Constructive and supportive dialogue</li>
                </ul>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">8. Content and Intellectual Property</h3>
                <p className="mb-2"><strong>Your Content:</strong></p>
                <ul className="list-disc ml-6 mb-4 space-y-1">
                  <li>You retain ownership of content you post</li>
                  <li>You grant us a license to display and distribute your content on the platform</li>
                  <li>You are responsible for ensuring your content doesn't violate others' rights</li>
                  <li>We may remove content that violates these terms</li>
                </ul>

                <p className="mb-2"><strong>Platform Content:</strong></p>
                <ul className="list-disc ml-6 mb-4 space-y-1">
                  <li>All platform design, features, and original content are protected by copyright</li>
                  <li>You may not copy, reproduce, or redistribute platform content without permission</li>
                  <li>Educational articles may be shared with proper attribution</li>
                </ul>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">9. Content Moderation</h3>
                <p className="mb-4">
                  We reserve the right to monitor, review, and remove content that violates these Terms. 
                  This includes posts, comments, messages, and profile information. We use both automated systems 
                  and human moderators to ensure community safety.
                </p>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">10. Account Termination</h3>
                <p className="mb-2">We may suspend or terminate your account if you:</p>
                <ul className="list-disc ml-6 mb-4 space-y-1">
                  <li>Violate these Terms of Use or our Privacy Policy</li>
                  <li>Engage in harmful behavior toward other users</li>
                  <li>Post illegal or dangerous content</li>
                  <li>Attempt to compromise platform security</li>
                  <li>Create multiple accounts after being banned</li>
                </ul>
                <p className="mb-4">
                  You may delete your account at any time through your account settings. 
                  Upon deletion, your data will be permanently erased within 30 days.
                </p>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">11. Limitation of Liability</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <p className="mb-2">TO THE FULLEST EXTENT PERMITTED BY LAW:</p>
                  <ul className="list-disc ml-6 space-y-1 text-sm">
                    <li>We are not liable for any medical outcomes or healthcare provider actions</li>
                    <li>We are not responsible for user-generated content or interactions</li>
                    <li>We are not liable for technical issues, data loss, or service interruptions</li>
                    <li>We are not responsible for third-party websites or services</li>
                    <li>Our total liability shall not exceed the amount you paid to use the platform (if applicable)</li>
                  </ul>
                </div>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">12. Indemnification</h3>
                <p className="mb-4">
                  You agree to indemnify and hold harmless HealthHub, its operators, and partners from any claims, 
                  damages, or expenses arising from your use of the platform, violation of these Terms, 
                  or infringement of any third-party rights.
                </p>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">13. Disclaimer of Warranties</h3>
                <p className="mb-4">
                  The platform is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, 
                  either express or implied. We do not guarantee uninterrupted service, accuracy of information, 
                  or fitness for any particular purpose.
                </p>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">14. Governing Law</h3>
                <p className="mb-4">
                  These Terms are governed by the laws of the Republic of the Philippines. 
                  Any disputes shall be resolved in the courts of Cavite, Philippines.
                </p>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">15. Changes to Terms</h3>
                <p className="mb-4">
                  We may update these Terms at any time. Material changes will be communicated via email 
                  or platform notification at least 30 days before taking effect. Continued use after changes 
                  indicates acceptance of the new Terms.
                </p>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">16. Severability</h3>
                <p className="mb-4">
                  If any provision of these Terms is found to be unenforceable, the remaining provisions 
                  will remain in full force and effect.
                </p>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">17. Entire Agreement</h3>
                <p className="mb-4">
                  These Terms of Use, together with our Privacy Policy, constitute the entire agreement 
                  between you and HealthHub regarding your use of the platform.
                </p>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-6 mb-3">18. Contact and Support</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="mb-2">For questions, concerns, or support:</p>
                  <ul className="space-y-1 text-sm">
                    <li><strong>General Support:</strong> cavitepositiveactiongroup@outlook.com</li>
                    <li><strong>Report Abuse:</strong> cavitepositiveactiongroup@outlook.com</li>
                    <li><strong>Technical Issues:</strong> itsmedalgom@gmail.com</li>
                    <li><strong>Location:</strong> Cavite, Philippines</li>
                  </ul>
                  <p className="mt-3 text-sm text-gray-600">
                    We respond to all inquiries within 48 hours.
                  </p>
                </div>

                <div className="bg-green-50 border-l-4 border-green-500 p-4 mt-6">
                  <p className="font-semibold text-green-900">Our Mission</p>
                  <p className="text-sm text-green-800 mt-1">
                    HealthHub is dedicated to breaking stigma and spreading truth about HIV. 
                    By using this platform, you become part of a community committed to education, 
                    support, and ending discrimination. Thank you for being here.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-blue-800">
                    <strong>By using HealthHub, you acknowledge that you have read, understood, and agree 
                    to be bound by these Terms of Use.</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-4 border-t border-[#4C8DD8]/20 bg-gray-50 rounded-b-lg flex-shrink-0">
              <button
                onClick={() => setShowTermsOfUse(false)}
                className="px-6 py-2 bg-[#4C8DD8] text-white rounded-lg hover:bg-[#2E7D32] transition-colors duration-200 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;