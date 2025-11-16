// src/pages/admin/ContentModeratorFAQ.jsx
import { useState, useMemo } from 'react';
import { HiOutlineQuestionMarkCircle, HiX } from 'react-icons/hi';

const ContentModeratorFAQ = () => {
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
          question: "What is my role as a Content Moderator?",
          answer: "As a Content Moderator, you are responsible for maintaining a safe, supportive, and respectful community environment. Your duties include reviewing user posts, moderating community discussions, addressing reported content, enforcing community guidelines, and ensuring the forum remains a positive space for users seeking HIV/AIDS support."
        },
        {
          question: "How do I access the moderation dashboard?",
          answer: "Navigate to 'Community Forum' from the sidebar menu. This is your main workspace where you can view all posts, filter by reported content, and take moderation actions. On mobile devices, use the hamburger menu (≡) to access the sidebar."
        },
        {
          question: "What tools do I have for moderation?",
          answer: "You have access to: post filtering and search, user report viewing, content removal tools, user warning system, temporary/permanent ban capabilities, and detailed activity logs. Each action you take is recorded for accountability and review."
        }
      ]
    },
    {
      category: "Community Guidelines",
      icon: "📜",
      questions: [
        {
          question: "What are the main community guidelines?",
          answer: "Key guidelines include: respect user anonymity and privacy, no hate speech or discrimination, no harassment or bullying, no sharing of personal medical advice (defer to professionals), no spam or advertising, no explicit sexual content, no promotion of self-harm, and maintain a supportive atmosphere. Full guidelines should be reviewed regularly."
        },
        {
          question: "How strictly should I enforce rules?",
          answer: "Apply rules consistently and fairly. For first-time minor violations, issue warnings. For serious violations (hate speech, threats, privacy breaches), take immediate action. Use progressive discipline: warning → temporary ban → permanent ban. Always document your reasoning."
        },
        {
          question: "Can I make exceptions to the rules?",
          answer: "Use judgment for context-specific situations, but don't compromise core safety guidelines. When in doubt, consult with the admin team. Never make exceptions for hate speech, harassment, privacy violations, or content that endangers users."
        }
      ]
    },
    {
      category: "Content Moderation",
      icon: "💬",
      questions: [
        {
          question: "How do I review reported posts?",
          answer: "Check the 'Reported Content' filter in the Community Forum. Each report shows: the post content, who reported it, reason for report, and report timestamp. Review the context by reading surrounding comments. Take action based on severity and guidelines."
        },
        {
          question: "What should I do when I see a guideline violation?",
          answer: "First, assess severity. For clear violations: remove the post, warn or ban the user as appropriate, and document your action. For borderline cases: consider context, review user's history, and consult guidelines. When uncertain, ask the admin team for guidance."
        },
        {
          question: "How do I handle posts about self-harm or suicide?",
          answer: "PRIORITY ACTION: These require immediate attention. 1) Don't remove the post immediately (user may need help), 2) Respond with crisis resources and support, 3) Notify admin team immediately, 4) Consider reaching out to the user directly through admin channels, 5) Document everything thoroughly."
        },
        {
          question: "What if multiple users report the same post?",
          answer: "Multiple reports indicate community concern and should be prioritized. Review the post carefully as it likely violates guidelines. However, don't let quantity override judgment - some posts may be reported unfairly. Always review objectively."
        },
        {
          question: "Can I edit user posts?",
          answer: "No, you should not edit user posts. You can only remove posts entirely or leave them unchanged. Editing would alter the user's voice and intent. If a post has both good and problematic content, consider reaching out to the user to revise it themselves."
        }
      ]
    },
    {
      category: "User Management",
      icon: "👥",
      questions: [
        {
          question: "How do I warn a user?",
          answer: "In the Community Forum, click on the violating post and select 'Warn User'. Write a clear, professional message explaining what guideline was violated and what behavior is expected. Warnings are logged in the user's account history."
        },
        {
          question: "When should I ban someone?",
          answer: "Temporary bans (1-30 days) for: repeated minor violations, harassment after warning, posting false medical info, or spam. Permanent bans for: severe harassment, hate speech, doxxing, sharing illegal content, or threats. Always document the reason clearly."
        },
        {
          question: "Can banned users appeal?",
          answer: "Yes, users can appeal to the admin team. You may be asked to provide context for your decision. Keep detailed notes on moderation actions. The admin team has final say on appeals, but your input is valued."
        },
        {
          question: "How do I track repeat offenders?",
          answer: "Each user's profile shows their moderation history including warnings, removed posts, and bans. Review this before taking action to ensure appropriate progressive discipline. Patterns of behavior should inform your decisions."
        }
      ]
    },
    {
      category: "Sensitive Content",
      icon: "⚠️",
      questions: [
        {
          question: "How do I handle misinformation about HIV/AIDS?",
          answer: "Misinformation is dangerous in a health community. Remove false medical claims and provide accurate resources. Leave a moderator comment with correct information from reputable sources (CDC, WHO, peer-reviewed studies). Warn users spreading misinformation intentionally."
        },
        {
          question: "What about posts discussing drug use?",
          answer: "Discussions about substance use in the context of harm reduction or seeking help are allowed. Remove content that: promotes illegal drug use, provides instructions for obtaining drugs, or endangers others. Approach with empathy while maintaining safety."
        },
        {
          question: "How do I moderate discussions about sex?",
          answer: "Allow educational discussions about safe sex, sexual health, and relationships. Remove: explicit sexual content, solicitation, harassment, or content that sexualizes others. Remember this is a support community, not a dating or hookup space."
        },
        {
          question: "What if someone shares another user's private information?",
          answer: "IMMEDIATE ACTION: Remove the post instantly. Ban the user who shared private info (this is doxxing and severe). Notify admin team urgently. Try to assess if other users saw the information. Document everything. Privacy violations are zero-tolerance."
        }
      ]
    },
    {
      category: "Best Practices",
      icon: "⭐",
      questions: [
        {
          question: "How quickly should I respond to reports?",
          answer: "High priority reports (threats, self-harm, privacy violations): within 1 hour. Standard reports (guideline violations): within 24 hours. General monitoring: check the forum at least twice daily. Set up notifications for urgent reports if available."
        },
        {
          question: "What tone should I use when moderating?",
          answer: "Be professional, firm but kind, and never personal. Remember users may be vulnerable. Explain reasons for actions clearly. Avoid sarcasm, anger, or judgment. You're enforcing rules to protect the community, not punishing individuals."
        },
        {
          question: "How do I stay objective?",
          answer: "Base decisions on guidelines, not personal feelings. If a post upsets you emotionally, take a brief break before moderating it. Review user history for context but don't hold grudges. Treat all users equally regardless of how much you like their posts."
        },
        {
          question: "Should I participate in discussions as a moderator?",
          answer: "You can participate, but distinguish between moderating and personal participation. Use your moderator status to enforce rules and provide resources, not to dominate conversations. Your primary role is maintaining safety, not being a community member."
        },
        {
          question: "How do I document my moderation decisions?",
          answer: "For each significant action, note: what was violated, why you took the action, what action you took, and date/time. This protects you during appeals, helps with consistency, and supports other moderators who may handle follow-up issues."
        }
      ]
    },
    {
      category: "Difficult Situations",
      icon: "🔥",
      questions: [
        {
          question: "What if users argue with my moderation?",
          answer: "Stay calm and professional. Explain your reasoning once, clearly. Don't get into prolonged arguments. If the user persists, tell them they can appeal through proper channels. Never abuse your power or make threats. If you feel attacked, step back and let another moderator handle it."
        },
        {
          question: "How do I handle conflicts between users?",
          answer: "Intervene if discussions become heated or violate guidelines. Remove hostile comments, remind users of guidelines, and consider cooling-off periods if needed. For ongoing disputes, you may need to temporarily ban one or both users and refer them to resolve issues through other channels."
        },
        {
          question: "What if I make a wrong decision?",
          answer: "Everyone makes mistakes. If you realize you were wrong, acknowledge it professionally, reverse the decision if appropriate, and apologize if warranted. Learn from it and move forward. Transparency builds trust with the community."
        },
        {
          question: "What should I do if I'm unsure about removing content?",
          answer: "When in doubt: 1) Consult community guidelines thoroughly, 2) Review similar past cases, 3) Ask another moderator or admin for input, 4) Consider the impact on community safety. It's better to ask for guidance than to make a rash decision."
        }
      ]
    },
    {
      category: "Self-Care",
      icon: "💆",
      questions: [
        {
          question: "How do I prevent moderator burnout?",
          answer: "Set boundaries: don't moderate 24/7, take regular breaks, don't let moderation consume your thoughts, rotate difficult tasks with other moderators. If you're seeing disturbing content repeatedly, talk to someone about it. Your wellbeing matters."
        },
        {
          question: "What if I encounter triggering content?",
          answer: "It's okay to step away from content that triggers you. Ask another moderator to handle it. If you're frequently triggered, discuss with the admin team about adjusting responsibilities. There's no shame in protecting your mental health."
        },
        {
          question: "How do I handle the emotional weight of moderation?",
          answer: "Moderating a health support community exposes you to difficult stories and situations. Practice self-care, maintain work-life separation, seek support when needed, and remember you're making a positive difference by creating a safe space for vulnerable people."
        }
      ]
    },
    {
      category: "Technical Support",
      icon: "🛠️",
      questions: [
        {
          question: "What browsers work best?",
          answer: "The platform is optimized for Chrome, Firefox, Safari, and Edge (latest versions). Keep your browser updated. The moderation interface is fully responsive and works on mobile devices, though detailed reviews are easier on desktop."
        },
        {
          question: "What if I encounter a technical error?",
          answer: "Try refreshing the page first. If the error persists, take a screenshot and contact technical support. If the error prevents critical moderation (like removing dangerous content), notify the admin team immediately for urgent assistance."
        },
        {
          question: "Can I moderate from mobile?",
          answer: "Yes, the interface is mobile-friendly. Use the hamburger menu to access moderation tools. However, for efficiency and detailed reviews, desktop is recommended. Mobile is great for quick checks and urgent issues."
        }
      ]
    },
    {
      category: "Resources & Support",
      icon: "📚",
      questions: [
        {
          question: "Where can I find the full community guidelines?",
          answer: "Full guidelines should be available in your documentation or through the admin team. Keep these handy for reference. If guidelines are unclear or need updating, suggest improvements to the admin team."
        },
        {
          question: "Who can I contact for help?",
          answer: "Contact the admin team for: guidance on difficult decisions, technical issues, user appeals, policy questions, or any concerns. You're not expected to handle everything alone - collaboration makes better moderation."
        },
        {
          question: "How can I improve my moderation skills?",
          answer: "Review past moderation decisions, learn from experienced moderators, stay updated on platform changes, read about online community management, and seek feedback from the admin team. Good moderation is a learned skill that improves with practice."
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-green-600 p-4 rounded-full shadow-lg">
              <HiOutlineQuestionMarkCircle className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">
            Content Moderator FAQ
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your guide to maintaining a safe and supportive community environment
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

        {/* Quick Reference Card */}
        {!searchQuery && (
          <div className="bg-green-100 border-l-4 border-green-600 p-4 mb-8 rounded-r-lg">
            <div className="flex items-start">
              <span className="text-2xl mr-3">⚡</span>
              <div>
                <h3 className="font-bold text-green-900 mb-2">Quick Action Guide</h3>
                <ul className="text-green-800 text-sm space-y-1">
                  <li>🚨 <strong>Crisis/Self-harm:</strong> Immediate response + notify admin</li>
                  <li>🔒 <strong>Privacy violation:</strong> Remove immediately + ban user</li>
                  <li>⚠️ <strong>Hate speech:</strong> Remove + ban (severity dependent)</li>
                  <li>📢 <strong>Spam:</strong> Remove + warn (ban if repeated)</li>
                  <li>❓ <strong>Unsure:</strong> Ask for guidance before acting</li>
                </ul>
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
              className="btn btn-primary bg-green-600 hover:bg-green-700 border-green-600"
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
              <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-green-600">
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

        {/* Moderator Principles */}
        {!searchQuery && (
          <div className="mt-8 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg shadow-xl p-8">
            <h3 className="text-2xl font-bold mb-4 text-center">Core Moderator Principles</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-2">🛡️</div>
                <h4 className="font-bold mb-1">Safety First</h4>
                <p className="text-sm opacity-90">Protect users and maintain a secure environment</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">⚖️</div>
                <h4 className="font-bold mb-1">Fair & Consistent</h4>
                <p className="text-sm opacity-90">Apply rules equally to all community members</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">❤️</div>
                <h4 className="font-bold mb-1">Compassionate</h4>
                <p className="text-sm opacity-90">Remember users are seeking support and help</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Thank you for creating a safe space for our community 🌟</p>
          <p className="mt-2">Last updated: November 2025</p>
        </div>
      </div>
    </div>
  );
};

export default ContentModeratorFAQ;