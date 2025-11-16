// src/pages/case-manager/CaseManagerFAQ.jsx
import { useState, useMemo } from 'react';
import { HiOutlineQuestionMarkCircle, HiX } from 'react-icons/hi';

const CaseManagerFAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setOpenIndex(null);
  };

  const faqCategories = [
    {
      category: "Getting Started",
      icon: "🚀",
      questions: [
        {
          question: "What is my role as a Case Manager?",
          answer: "As a Case Manager, you provide psychosocial support to users of the platform. Your responsibilities include conducting one-on-one sessions, managing appointments, communicating with clients through secure messaging, and maintaining session documentation. You are a vital part of the care team supporting individuals affected by HIV/AIDS."
        },
        {
          question: "How do I navigate my dashboard?",
          answer: "Your dashboard consists of 'My Planner' (your main workspace), 'Messages' (client communication), and 'FAQ' (this page). On mobile devices, tap the hamburger menu (≡) in the top-left corner to access these sections. Your role is displayed at the bottom of the sidebar."
        },
        {
          question: "What information can I access about my clients?",
          answer: "You can access appointment history, session notes, and communication records for clients assigned to you. All information is confidential and should only be accessed for legitimate care purposes. Client anonymity is maintained through pseudonymous usernames."
        }
      ]
    },
    {
      category: "My Planner",
      icon: "📋",
      questions: [
        {
          question: "What is My Planner?",
          answer: "My Planner is your central dashboard showing upcoming appointments, pending tasks, client follow-ups, and session schedules. It helps you organize your caseload efficiently and ensures you don't miss any important appointments or follow-up tasks."
        },
        {
          question: "How do I view my upcoming appointments?",
          answer: "Your upcoming appointments are displayed on the main Planner page, organized chronologically. You can view details including appointment time, client username, session type, and any special notes. Click on an appointment to see full details or access past session notes."
        },
        {
          question: "Can I reschedule appointments?",
          answer: "You cannot directly reschedule appointments from your dashboard. If you need to reschedule, you must contact the admin team or the client directly through the messaging system. Always try to provide at least 24 hours notice for any schedule changes."
        },
        {
          question: "How do I track client progress?",
          answer: "Use the session notes feature after each appointment to document progress, challenges, and goals achieved. You can review past notes to track long-term progress and identify patterns or areas needing additional support."
        }
      ]
    },
    {
      category: "Appointments & Sessions",
      icon: "📅",
      questions: [
        {
          question: "How long are typical sessions?",
          answer: "Standard psychosocial support sessions are typically 45-60 minutes. The duration may vary based on the client's needs and the type of session. Check your appointment details for specific session lengths."
        },
        {
          question: "What should I do before a session?",
          answer: "Before each session: review the client's previous session notes, check for any messages from the client, prepare any materials or resources you might need, and ensure you're in a private, quiet space for the session."
        },
        {
          question: "How do I document sessions?",
          answer: "After each appointment, click on the appointment in your Planner and use the session notes feature. Document key discussion points, client concerns, interventions used, goals set, and follow-up plans. Keep notes professional, objective, and focused on care. All notes are confidential and encrypted."
        },
        {
          question: "What if a client doesn't show up?",
          answer: "If a client misses an appointment without notice, mark it as 'no-show' in the system and send them a follow-up message to check in and reschedule. Document the no-show in your session notes. If a client misses multiple appointments, discuss with your supervisor."
        },
        {
          question: "Can I conduct virtual sessions?",
          answer: "No, the platform do not support virtual sessions. Hence, it is best to refer of the clinic schedule and location information. Ensuring all appointments are genuine and secured."
        }
      ]
    },
    {
      category: "Messaging System",
      icon: "💬",
      questions: [
        {
          question: "How does the messaging system work?",
          answer: "The messaging system allows secure, real-time communication with your assigned clients. Messages are private, encrypted, and only accessible to you and the specific client. You can access messages by clicking the floating message button or navigating to the Messages section."
        },
        {
          question: "How quickly should I respond to messages?",
          answer: "Aim to respond to non-urgent messages within 24 hours during business days. For urgent situations, respond as quickly as possible and escalate to appropriate resources if needed. Set clear boundaries about response times with your clients."
        },
        {
          question: "What should I do if a client sends a crisis message?",
          answer: "If a client expresses suicidal thoughts, self-harm intentions, or is in immediate danger: 1) Respond immediately, 2) Assess the level of risk, 3) Provide crisis resources (hotlines, emergency services), 4) Notify your supervisor or admin immediately, 5) Document the interaction thoroughly. Never leave someone in crisis without support."
        },
        {
          question: "Can I message clients outside of sessions?",
          answer: "Yes, you can message clients for appointment reminders, follow-ups, resource sharing, or to check in. However, maintain professional boundaries and keep communication focused on care and support. Avoid messaging outside of appropriate hours unless it's an emergency."
        },
        {
          question: "Are messages monitored?",
          answer: "Messages are private between you and your clients. However, for quality assurance and safety, administrators may audit communications if there are concerns. Always maintain professional standards in all communications."
        }
      ]
    },
    {
      category: "Client Support",
      icon: "🤝",
      questions: [
        {
          question: "What types of support can I provide?",
          answer: "As a Case Manager, you provide emotional support, coping strategies, mental health resources, adherence counseling, stigma reduction support, and connections to community resources. You are not expected to provide medical advice - always refer medical questions to healthcare providers."
        },
        {
          question: "How do I handle difficult conversations?",
          answer: "Use active listening, empathy, and non-judgmental language. Create a safe space for clients to share. If a topic is beyond your scope, acknowledge it and offer to connect them with appropriate resources. Always prioritize the client's safety and wellbeing."
        },
        {
          question: "What if a client shares information about abuse or harm?",
          answer: "If a client discloses abuse or is being harmed: 1) Ensure their immediate safety, 2) Listen without judgment, 3) Do not promise complete confidentiality if reporting is required, 4) Follow mandatory reporting guidelines, 5) Notify your supervisor immediately, 6) Document everything carefully."
        },
        {
          question: "How do I maintain professional boundaries?",
          answer: "Maintain clear boundaries by: keeping relationships professional, avoiding dual relationships, setting limits on communication times, not sharing personal contact information, declining gifts, and referring clients to other resources when appropriate. Always prioritize the client's therapeutic needs."
        }
      ]
    },
    {
      category: "Confidentiality & Privacy",
      icon: "🔒",
      questions: [
        {
          question: "How is client information protected?",
          answer: "All client data is encrypted, stored securely, and only accessible to authorized personnel (you and administrators). The platform maintains user anonymity through pseudonymous usernames. Never discuss client information outside of secure channels or with unauthorized individuals."
        },
        {
          question: "Can I share client information with other staff?",
          answer: "Only share client information with other staff members if it's necessary for the client's care and with proper authorization. Use secure, official channels for any necessary communication. Never discuss clients in public spaces or on personal devices."
        },
        {
          question: "What if someone asks me about a client?",
          answer: "Do not confirm or deny whether someone is your client unless you have their explicit consent or it's required by law. If someone (including family members) asks about a client, refer them to appropriate channels and maintain client confidentiality."
        }
      ]
    },
    {
      category: "Self-Care & Support",
      icon: "💆",
      questions: [
        {
          question: "How do I prevent burnout?",
          answer: "Practice self-care by: setting boundaries, taking regular breaks, seeking supervision when needed, engaging in peer support, maintaining work-life balance, and recognizing signs of compassion fatigue. It's okay to ask for help - you can't pour from an empty cup."
        },
        {
          question: "What support is available for me?",
          answer: "You have access to regular supervision, peer consultation, and can reach out to administrators for support. If you're experiencing secondary trauma or burnout, don't hesitate to seek professional support yourself."
        },
        {
          question: "How do I handle emotionally difficult cases?",
          answer: "After difficult sessions: debrief with a supervisor or peer, practice grounding techniques, document thoroughly for processing, engage in self-care activities, and recognize that feeling affected is normal. Seek additional support if cases are consistently overwhelming."
        }
      ]
    },
    {
      category: "Technical Support",
      icon: "🛠️",
      questions: [
        {
          question: "What browsers work best with the platform?",
          answer: "The platform works best on Chrome, Firefox, Safari, and Edge (latest versions). Keep your browser updated and enable JavaScript. The interface is fully mobile-responsive for on-the-go access."
        },
        {
          question: "What if I encounter a technical error?",
          answer: "First, try refreshing the page or clearing your browser cache. If the error persists, take a screenshot and contact technical support immediately, especially if it affects client care. Always note what you were doing when the error occurred."
        },
        {
          question: "Can I access my planner on mobile?",
          answer: "Yes! The Case Manager interface is fully mobile-responsive. Use the hamburger menu to access your Planner and Messages on mobile devices. However, detailed documentation is easier on a desktop or tablet."
        },
        {
          question: "How do I update my notification settings?",
          answer: "Contact the administrator to adjust your notification preferences. You can receive notifications for new appointments, client messages, and schedule changes. Choose settings that help you stay responsive without overwhelming you."
        }
      ]
    },
    {
      category: "Best Practices",
      icon: "⭐",
      questions: [
        {
          question: "What makes a good session note?",
          answer: "Good session notes are: concise but complete, objective and factual, focused on care-relevant information, respectful in language, properly dated and timestamped. Include: what was discussed, client's current state, interventions used, goals set, and follow-up plans. Avoid assumptions or judgmental language."
        },
        {
          question: "How should I handle cultural sensitivity?",
          answer: "Approach each client with cultural humility. Be aware of how culture affects health beliefs and practices. Ask questions respectfully when you don't understand, avoid stereotypes, and adapt your approach to honor cultural values while maintaining professional standards."
        },
        {
          question: "What resources can I share with clients?",
          answer: "You can share: HIV/AIDS educational materials from the Articles section, clinic locations from the Clinic Finder, crisis hotline numbers, community support groups, and relevant local resources. Always ensure resources are reputable, current, and appropriate for the client's needs."
        }
      ]
    }
  ];

  // Filter FAQ based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return faqCategories;
    }

    const query = searchQuery.toLowerCase();
    
    return faqCategories
      .map(category => ({
        ...category,
        questions: category.questions.filter(faq =>
          faq.question.toLowerCase().includes(query) ||
          faq.answer.toLowerCase().includes(query)
        )
      }))
      .filter(category => category.questions.length > 0);
  }, [searchQuery]);

  // Auto-expand first result when searching
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim() && filteredCategories.length > 0 && filteredCategories[0].questions.length > 0) {
      setOpenIndex('0-0');
    } else if (!query.trim()) {
      setOpenIndex(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-purple-600 p-4 rounded-full shadow-lg">
              <HiOutlineQuestionMarkCircle className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">
            Case Manager FAQ
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your guide to providing excellent psychosocial support and managing your caseload
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search for questions..."
              value={searchQuery}
              onChange={handleSearch}
              className="input input-bordered w-full shadow-md pr-10"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Clear search"
              >
                <HiX className="w-5 h-5" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-center text-sm text-gray-600 mt-2">
              Found {filteredCategories.reduce((acc, cat) => acc + cat.questions.length, 0)} result(s)
            </p>
          )}
        </div>

        {/* Quick Tips Banner */}
        {!searchQuery && (
          <div className="bg-purple-100 border-l-4 border-purple-600 p-4 mb-8 rounded-r-lg">
            <div className="flex items-start">
              <span className="text-2xl mr-3">💡</span>
              <div>
                <h3 className="font-bold text-purple-900 mb-1">Quick Tip</h3>
                <p className="text-purple-800 text-sm">
                  Always review previous session notes before meeting with a client. This helps maintain continuity of care and shows clients you remember their journey.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No Results Message */}
        {searchQuery && filteredCategories.length === 0 && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Results Found</h3>
            <p className="text-gray-600 mb-4">
              We couldn't find any questions matching "{searchQuery}"
            </p>
            <button
              onClick={clearSearch}
              className="btn btn-primary bg-purple-600 hover:bg-purple-700 border-purple-600"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* FAQ Categories */}
        <div className="space-y-6">
          {filteredCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-white rounded-lg shadow-lg p-6">
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-purple-600">
                <span className="text-3xl">{category.icon}</span>
                <h2 className="text-2xl font-bold text-gray-800">
                  {category.category}
                  {searchQuery && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({category.questions.length})
                    </span>
                  )}
                </h2>
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

        {/* Footer Note */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Remember: You make a difference every day ❤️</p>
          <p className="mt-2">Last updated: November 2025</p>
        </div>
      </div>
    </div>
  );
};

export default CaseManagerFAQ;