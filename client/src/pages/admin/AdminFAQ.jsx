// src/pages/admin/AdminFAQ.jsx
import { useState } from 'react';
import { HiOutlineQuestionMarkCircle, HiChevronDown } from 'react-icons/hi';

const AdminFAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqCategories = [
    {
      category: "General Administration",
      icon: "🏢",
      questions: [
        {
          question: "What is this Anonymous Social Network platform?",
          answer: "This is a healthcare-focused anonymous social network designed to provide a safe space for HIV/AIDS support, psychosocial services, and community engagement. The platform allows users to interact anonymously while receiving professional support from case managers and accessing vital healthcare resources."
        },
        {
          question: "What are the different admin roles?",
          answer: "The platform has three main administrative roles: 1) Admin - Full system access including user management, staff management, analytics, and all settings. 2) Content Moderator - Manages community forum posts and ensures content guidelines are followed. 3) Case Manager - Handles user appointments, provides psychosocial support, and manages direct messaging with users."
        },
        {
          question: "How do I navigate the admin dashboard?",
          answer: "Use the sidebar menu to access different sections. On mobile devices, tap the hamburger menu (≡) in the top-left corner. Each role has access to specific menu items relevant to their responsibilities. Your current role is displayed at the bottom of the sidebar."
        }
      ]
    },
    {
      category: "User Management",
      icon: "👥",
      questions: [
        {
          question: "How do I view and manage users?",
          answer: "Navigate to 'User Management' in the sidebar. Here you can view all registered users, search by username or email, and see detailed user information including registration date, status, and activity. You can activate/deactivate accounts and view user statistics."
        },
        {
          question: "Can I see user's real identities?",
          answer: "For privacy protection, the platform maintains user anonymity. However, admins can access registration emails and usernames for account management purposes. Personal health information is kept confidential and only accessible to assigned case managers for legitimate care purposes."
        },
        {
          question: "How do I handle reported users?",
          answer: "Reported users appear in the Community Forum moderation section. Review the report, examine the flagged content, and take appropriate action such as warning, temporary suspension, or account deactivation based on the violation severity and community guidelines."
        }
      ]
    },
    {
      category: "Staff Management",
      icon: "👨‍💼",
      questions: [
        {
          question: "How do I add new staff members?",
          answer: "Go to 'Staff Management' and click 'Add New Staff'. Enter their details including name, email, and assign a role (Content Moderator or Case Manager). New staff will receive login credentials via email and must change their password on first login."
        },
        {
          question: "Can I change a staff member's role?",
          answer: "Yes, in Staff Management, locate the staff member and click 'Edit'. You can change their role, update contact information, or deactivate their account. Note that role changes take effect immediately and will change their dashboard access."
        },
        {
          question: "How do I monitor staff activity?",
          answer: "Staff activity logs are available in the Dashboard section. You can see login times, actions performed, and caseload for case managers. This helps ensure accountability and proper workload distribution."
        }
      ]
    },
    {
      category: "Community Moderation",
      icon: "💬",
      questions: [
        {
          question: "What is the Community Forum?",
          answer: "The Community Forum is where users can post anonymously, share experiences, ask questions, and support each other. It's a vital part of the platform that requires active moderation to maintain a safe and supportive environment."
        },
        {
          question: "How do I moderate posts?",
          answer: "In the 'Community Forum' section, you can review all posts, filter by reported content, and take actions such as removing posts, warning users, or banning accounts. Always document your moderation decisions and follow the community guidelines."
        },
        {
          question: "What content should be removed?",
          answer: "Remove content that: violates privacy, contains hate speech, promotes self-harm, shares false medical information, contains spam or advertising, harasses other users, or violates any platform guidelines. When in doubt, consult with senior staff."
        }
      ]
    },
    {
      category: "Appointments & Scheduling",
      icon: "📅",
      questions: [
        {
          question: "How does the appointment system work?",
          answer: "Users can book appointments for psychosocial support sessions with case managers through the Schedule page. Admins can view all appointments, manage clinic schedules, and assign case managers to specific time slots."
        },
        {
          question: "Can I modify or cancel appointments?",
          answer: "Yes, in the 'Appointments' section, you can view, modify, or cancel appointments. Note that users must be notified of any changes. Cancellations within 24 hours of the scheduled time should be avoided unless absolutely necessary."
        },
        {
          question: "How do I manage clinic schedules?",
          answer: "Use the 'Clinic Schedule' section to set available appointment times, block off holidays or unavailable periods, and assign case managers to specific time slots. The system automatically prevents double-booking."
        }
      ]
    },
    {
      category: "Case Manager Functions",
      icon: "📋",
      questions: [
        {
          question: "What is My Planner?",
          answer: "My Planner is the case manager's dashboard showing upcoming appointments, pending tasks, and client follow-ups. It helps case managers organize their caseload and ensure timely follow-up with clients."
        },
        {
          question: "How does the messaging system work?",
          answer: "Case managers can communicate directly with their assigned clients through a secure messaging system. Messages are private, encrypted, and only accessible to the assigned case manager and client. The system supports real-time chat with notification alerts."
        },
        {
          question: "How do I document sessions?",
          answer: "After each appointment, use the session notes feature to document the meeting. Include key points discussed, action items, and follow-up plans. All notes are confidential and stored securely for continuity of care."
        }
      ]
    },
    {
      category: "Analytics & Reporting",
      icon: "📊",
      questions: [
        {
          question: "What information is in HIV Analytics?",
          answer: "HIV Analytics provides demographic data, appointment statistics, user engagement metrics, and community activity trends. This data helps in program evaluation, resource allocation, and identifying areas needing additional support."
        },
        {
          question: "How often is data updated?",
          answer: "Dashboard data is updated in real-time. Analytics reports are updated daily at midnight. For the most current statistics, refresh your page or check the 'Last Updated' timestamp on each chart."
        },
        {
          question: "Can I export reports?",
          answer: "Yes, most analytics sections have an 'Export' button that allows you to download data as CSV or PDF. Exported data is anonymized to protect user privacy and should be stored securely according to data protection policies."
        }
      ]
    },
    {
      category: "Clinic Finder",
      icon: "📍",
      questions: [
        {
          question: "How do I add new clinics?",
          answer: "Go to 'Clinic Finder' and click 'Add Clinic'. Enter the clinic name, address, contact information, services offered, and operating hours. The system will geocode the address for map display. Verify all information before publishing."
        },
        {
          question: "How can users find clinics?",
          answer: "Users can search clinics by location, services, or browse the interactive map. The system shows distance from their location (if they grant permission) and provides directions via Google Maps integration."
        },
        {
          question: "Can I edit clinic information?",
          answer: "Yes, click on any clinic in the Clinic Finder admin section to edit details. Updates are reflected immediately for users. It's important to keep information current, especially operating hours and available services."
        }
      ]
    },
    {
      category: "Articles & Content",
      icon: "📰",
      questions: [
        {
          question: "How do I create or edit articles?",
          answer: "Navigate to 'Articles' and click 'Create New Article'. Use the rich text editor to format content, add images, and include relevant tags. Articles can be saved as drafts or published immediately. All articles should be fact-checked before publishing."
        },
        {
          question: "What type of content should be published?",
          answer: "Publish educational content about HIV/AIDS prevention, treatment updates, mental health support, stigma reduction, and healthy living tips. Ensure all medical information is accurate and from credible sources. Avoid fear-mongering or stigmatizing language."
        },
        {
          question: "Can I schedule article publication?",
          answer: "Yes, when creating or editing an article, you can set a future publication date and time. This is useful for planning content campaigns or timing announcements appropriately."
        }
      ]
    },
    {
      category: "Security & Privacy",
      icon: "🔒",
      questions: [
        {
          question: "How is user data protected?",
          answer: "The platform uses encryption for data transmission (HTTPS), secure password hashing, role-based access control, and regular security audits. User anonymity is maintained through pseudonymous usernames, and personal health information is strictly protected."
        },
        {
          question: "What should I do if I suspect a security breach?",
          answer: "Immediately contact the system administrator, document what you observed, and do not attempt to investigate on your own. Change your password if you suspect your account may be compromised. Security incidents are treated with highest priority."
        },
        {
          question: "How often should I change my password?",
          answer: "Admin passwords should be changed every 90 days. Use strong passwords with at least 12 characters, including uppercase, lowercase, numbers, and special characters. Never share your admin credentials with anyone."
        }
      ]
    },
    {
      category: "Technical Support",
      icon: "🛠️",
      questions: [
        {
          question: "What browsers are supported?",
          answer: "The platform is optimized for Chrome, Firefox, Safari, and Edge (latest versions). For best experience, keep your browser updated and enable JavaScript. Mobile browsers are also supported for on-the-go access."
        },
        {
          question: "What do I do if I encounter an error?",
          answer: "First, try refreshing the page or clearing your browser cache. If the error persists, take a screenshot of the error message and contact technical support with details about what you were doing when the error occurred."
        },
        {
          question: "Can I access the admin panel on mobile?",
          answer: "Yes, the admin interface is fully responsive. On mobile devices, use the hamburger menu to access the sidebar. Some features like detailed analytics are better viewed on desktop, but all core functions are mobile-accessible."
        }
      ]
    },
    {
      category: "Settings & Configuration",
      icon: "⚙️",
      questions: [
        {
          question: "What settings can I configure?",
          answer: "Admins can configure system-wide settings including notification preferences, appointment duration defaults, community guidelines, automated responses, and system maintenance schedules. Changes to critical settings require confirmation."
        },
        {
          question: "How do I update notification settings?",
          answer: "Go to Settings > Notifications. You can configure email notifications for new appointments, user reports, system alerts, and more. Choose notification frequency and set quiet hours if needed."
        },
        {
          question: "Can I customize the platform appearance?",
          answer: "Currently, theme customization is limited to system administrators. You can request changes through the support ticket system. User-facing interface themes are tested for accessibility before deployment."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-primary p-4 rounded-full shadow-lg">
              <HiOutlineQuestionMarkCircle className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">
            Admin Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about managing your anonymous social network platform
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search for questions..."
            className="input input-bordered w-full max-w-2xl mx-auto block shadow-md"
          />
        </div>

        {/* FAQ Categories */}
        <div className="space-y-6">
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-white rounded-lg shadow-lg p-6">
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-primary">
                <span className="text-3xl">{category.icon}</span>
                <h2 className="text-2xl font-bold text-gray-800">{category.category}</h2>
              </div>

              {/* Questions */}
              <div className="space-y-3">
                {category.questions.map((faq, faqIndex) => {
                  const globalIndex = `${categoryIndex}-${faqIndex}`;
                  const isOpen = openIndex === globalIndex;

                  return (
                    <div
                      key={faqIndex}
                      className="collapse collapse-plus bg-base-200 rounded-lg hover:bg-base-300 transition-colors"
                    >
                      <input
                        type="radio"
                        name={`faq-${categoryIndex}`}
                        checked={isOpen}
                        onChange={() => toggleFAQ(globalIndex)}
                      />
                      <div className="collapse-title text-lg font-semibold text-gray-700 pr-12">
                        {faq.question}
                      </div>
                      <div className="collapse-content">
                        <p className="text-gray-600 leading-relaxed pt-2">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Support Section
        <div className="mt-12 bg-gradient-to-r from-primary to-primary-focus text-white rounded-lg shadow-xl p-8 text-center">
          <h3 className="text-2xl font-bold mb-3">Still Have Questions?</h3>
          <p className="text-lg mb-6 opacity-90">
            Our support team is here to help you with any concerns or issues
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn btn-outline btn-white bg-white text-primary hover:bg-gray-100 border-2">
              📧 Contact Support
            </button>
            <button className="btn btn-outline btn-white bg-white text-primary hover:bg-gray-100 border-2">
              📖 View Documentation
            </button>
          </div>
        </div> */}

        {/* Footer Note */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Last updated: November 2025 | Platform Version 2.0</p>
        </div>
      </div>
    </div>
  );
};

export default AdminFAQ;