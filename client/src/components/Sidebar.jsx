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

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-[#4C8DD8]/50 z-40 backdrop-blur-sm"
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
          <nav className="flex items-center flex-col overflow-y-auto py-4 flex-1">
            <ul className="menu menu-lg px-2 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={() => {
                        if (window.innerWidth < 1024) {
                          toggleSidebar();
                        }
                      }}
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
            <div className="flex flex-col items-center space-x-3">
              <div className="flex-1">
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
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
                <p className="text-sm text-gray-500 mb-4">Last Updated: October 21, 2025</p>
                
                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-4 mb-2">1. Information We Collect</h3>
                <p className="mb-4">
                  We collect information you provide directly to us, including your name, email address, 
                  contact information, and health-related data you choose to share through our platform.
                </p>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-4 mb-2">2. How We Use Your Information</h3>
                <p className="mb-4">
                  We use the information we collect to provide, maintain, and improve our services, 
                  including scheduling appointments, connecting you with healthcare providers, and 
                  personalizing your experience.
                </p>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-4 mb-2">3. Data Security</h3>
                <p className="mb-4">
                  We implement appropriate technical and organizational measures to protect your personal 
                  information against unauthorized access, alteration, disclosure, or destruction.
                </p>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-4 mb-2">4. Information Sharing</h3>
                <p className="mb-4">
                  We do not sell your personal information. We may share your information with healthcare 
                  providers you choose to connect with, and with service providers who assist us in 
                  operating our platform.
                </p>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-4 mb-2">5. Your Rights</h3>
                <p className="mb-4">
                  You have the right to access, correct, or delete your personal information. You may 
                  also object to or restrict certain processing of your data.
                </p>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-4 mb-2">6. Contact Us</h3>
                <p className="mb-4">
                  If you have any questions about this Privacy Policy, please contact us at 
                  privacy@example.com.
                </p>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
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
                <p className="text-sm text-gray-500 mb-4">Last Updated: October 21, 2025</p>
                
                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-4 mb-2">1. Acceptance of Terms</h3>
                <p className="mb-4">
                  By accessing and using this platform, you accept and agree to be bound by the terms 
                  and provision of this agreement.
                </p>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-4 mb-2">2. Use of Service</h3>
                <p className="mb-4">
                  You agree to use our service only for lawful purposes and in accordance with these Terms. 
                  You are responsible for maintaining the confidentiality of your account information.
                </p>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-4 mb-2">3. Medical Disclaimer</h3>
                <p className="mb-4">
                  This platform provides information and connects users with healthcare providers but 
                  does not provide medical advice. Always seek the advice of your physician or other 
                  qualified health provider with any questions you may have.
                </p>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-4 mb-2">4. User Responsibilities</h3>
                <p className="mb-4">
                  You are responsible for all content you post and activity that occurs under your account. 
                  You must not post content that is offensive, illegal, or infringes on others' rights.
                </p>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-4 mb-2">5. Intellectual Property</h3>
                <p className="mb-4">
                  All content, features, and functionality of this platform are owned by us and are 
                  protected by international copyright, trademark, and other intellectual property laws.
                </p>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-4 mb-2">6. Limitation of Liability</h3>
                <p className="mb-4">
                  We shall not be liable for any indirect, incidental, special, consequential, or 
                  punitive damages resulting from your use of or inability to use the service.
                </p>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-4 mb-2">7. Changes to Terms</h3>
                <p className="mb-4">
                  We reserve the right to modify these terms at any time. We will notify users of any 
                  material changes via email or through the platform.
                </p>

                <h3 className="text-lg font-semibold text-[#4C8DD8] mt-4 mb-2">8. Contact Information</h3>
                <p className="mb-4">
                  For questions about these Terms of Use, please contact us at support@example.com.
                </p>
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