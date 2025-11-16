import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, Mail, Phone, MapPin, MessageCircle, HelpCircle } from 'lucide-react';

const FAQs = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const faqData = [
    {
      id: 1,
      category: 'Account & Registration',
      question: 'How do I create an account on HealthHub?',
      answer: 'To create an account: (1) Click "Register" on the login page, (2) Choose a unique anonymous username (DO NOT use your real name), (3) Enter a valid email address for verification, (4) Create a strong password, (5) Agree to the Terms of Use and Privacy Policy, (6) Verify your email with the 6-digit code sent to your inbox. Remember: Use a pseudonym to protect your identity and privacy.'
    },
    {
      id: 2,
      category: 'Account & Registration',
      question: 'Why do I need to verify my email?',
      answer: 'Email verification is required for security purposes and to ensure you can recover your account if needed. It also helps us prevent spam and unauthorized access. We will never share your email with third parties, and it is only used for account recovery and important notifications.'
    },
    {
      id: 3,
      category: 'Account & Registration',
      question: 'I didn\'t receive my verification code. What should I do?',
      answer: 'If you haven\'t received your verification code: (1) Check your spam/junk folder, (2) Wait a few minutes as email delivery may be delayed, (3) Click "Resend Code" on the verification page (available after 60 seconds), (4) Ensure you entered the correct email address. If problems persist, contact us at cavitepositiveactiongroup@outlook.com.'
    },
    {
      id: 4,
      category: 'Account & Registration',
      question: 'Can I change my username or email?',
      answer: 'You can change your username anytime through your Profile page. However, your email address cannot be changed for security reasons. If you need to update your email, you\'ll need to create a new account with the new email address.'
    },
    {
      id: 5,
      category: 'Privacy & Anonymity',
      question: 'Is my identity really anonymous on HealthHub?',
      answer: 'Yes! Your privacy and anonymity are our top priorities. We NEVER require or store your real name. Your anonymous username cannot be traced to your real identity. All data is encrypted, and we comply with the Philippine Data Privacy Act of 2012 (RA 10173). We will NEVER disclose your HIV status, medical information, or identity to employers, insurance companies, or unauthorized parties.'
    },
    {
      id: 6,
      category: 'Privacy & Anonymity',
      question: 'What information do you collect about me?',
      answer: 'We collect: (1) Anonymous username, (2) Email address (for verification only), (3) Encrypted password, (4) Information you voluntarily share in posts, (5) Appointment details with clinics. We only collect your name, age, gender, municipality (Cavite only), and contact number for the record. We do NOT share any of the sensitive date based on the Privacy act of 11166. See our complete Privacy Policy for more details.'
    },
    {
      id: 7,
      category: 'Privacy & Anonymity',
      question: 'Who can see my posts in the Community Forum?',
      answer: 'All posts in the Community Forum are displayed with your anonymous username only (e.g., "Anonymous #12345"). Other users cannot identify you. Your real name and email are NEVER shown. Case managers and administrators can view posts for moderation purposes but are bound by strict confidentiality agreements.'
    },
    {
      id: 8,
      category: 'Appointments & Scheduling',
      question: 'How do I book an appointment?',
      answer: 'To book an appointment: (1) Go to the Schedule page, (2) Click "Book New Appointment", (3) Select a service (Testing & Counseling or Psychosocial Support), (4) Fill in your personal information, (5) Choose an available date and time from the calendar, (6) Review your appointment details, (7) Confirm booking. You\'ll receive a confirmation and can view your appointment details anytime.'
    },
    {
      id: 9,
      category: 'Appointments & Scheduling',
      question: 'What are the clinic hours?',
      answer: 'CPAG clinic hours are Monday to Friday, 9:00 AM to 5:30 PM. The clinic is closed on Sundays. Saturday appointments are available only through special request with admin approval. Check the Schedule page calendar for real-time availability and any special closures or holidays.'
    },
    {
      id: 10,
      category: 'Appointments & Scheduling',
      question: 'How do I request a Saturday appointment?',
      answer: 'Saturday appointments require special approval: (1) When selecting a Saturday date on the calendar, check the "I request a Saturday appointment" box, (2) Provide a detailed reason (minimum 10 characters) explaining why you need a Saturday slot, (3) Submit your appointment request, (4) Wait for admin review and approval (you\'ll be notified), (5) If approved, your appointment is confirmed. If denied, you can reschedule for a weekday.'
    },
    {
      id: 11,
      category: 'Appointments & Scheduling',
      question: 'Can I cancel or reschedule my appointment?',
      answer: 'Yes! If within 24 hours of booking: You can cancel directly from your appointment details. After 24 hours: Submit a cancellation request with a reason, and wait for admin approval. To reschedule: Cancel your current appointment and book a new one. Note: Frequent cancellations may affect future booking privileges.'
    },
    {
      id: 12,
      category: 'Appointments & Scheduling',
      question: 'What should I bring to my appointment?',
      answer: 'For Testing & Counseling: Bring a valid ID for verification. For Psychosocial Support: No specific documents required, but bring any relevant medical records if available. Arrive 10-15 minutes early. If you have any special needs or concerns, note them when booking your appointment.'
    },
    {
      id: 13,
      category: 'Services',
      question: 'What services does CPAG offer?',
      answer: 'CPAG offers: (1) HIV Testing and Counseling - confidential screening and pre/post-test counseling, (2) Psychosocial Support and Assistance - emotional support, mental health counseling, and ongoing care, (3) Community Forum - anonymous peer support and information sharing, (4) Educational Resources - articles and information about HIV prevention, treatment, and living with HIV/AIDS.'
    },
    {
      id: 14,
      category: 'Services',
      question: 'Is HIV testing really confidential?',
      answer: 'Absolutely! All HIV testing at CPAG is completely confidential. Test results are only shared with you and authorized healthcare providers involved in your care. We never disclose your HIV status to anyone without your explicit consent. All staff members are bound by medical confidentiality standards and the Philippine Data Privacy Act.'
    },
    {
      id: 15,
      category: 'Services',
      question: 'What is psychosocial support?',
      answer: 'Psychosocial support provides emotional, mental health, and social assistance to individuals affected by HIV/AIDS. Services include: one-on-one counseling, support groups, stress management, mental health support, assistance with disclosure, relationship counseling, and connection to community resources. Sessions are scheduled through the appointment system and conducted by trained case managers.'
    },
    {
      id: 16,
      category: 'Services',
      question: 'How many psychosocial support sessions can I have?',
      answer: 'Psychosocial support is ongoing based on your needs. After your initial appointment, your assigned case manager will work with you to schedule follow-up sessions. There is no limit to the number of sessions - we provide support for as long as you need it. Session frequency is determined collaboratively between you and your case manager.'
    },
    {
      id: 17,
      category: 'Community Forum',
      question: 'How do I post in the Community Forum?',
      answer: 'To post in the Community Forum: (1) Go to the Community page, (2) Select a category for your post (General Support, HIV Testing, Treatment Support, Mental Health, etc.), (3) Write your post in the text box, (4) Click "Share Anonymously", (5) Your post will be submitted for moderator review before appearing publicly. Posts typically appear within 24 hours after approval.'
    },
    {
      id: 18,
      category: 'Community Forum',
      question: 'Why was my post not approved?',
      answer: 'Posts may not be approved if they: (1) Contain identifying information (names, addresses, phone numbers), (2) Include discriminatory or hateful language, (3) Share false medical information, (4) Contain spam or advertisements, (5) Violate community guidelines. You will not receive notification if a post is rejected. Please review our Community Guidelines and try posting again with appropriate content.'
    },
    {
      id: 19,
      category: 'Community Forum',
      question: 'Can I report inappropriate posts or comments?',
      answer: 'Yes! If you see content that violates our guidelines: (1) Click the flag icon on the post or comment, (2) Provide a reason for reporting, (3) Submit the report. Our moderation team reviews all reports within 24-48 hours. Reports are anonymous, and we take all concerns seriously to maintain a safe, respectful community.'
    },
    {
      id: 20,
      category: 'Community Forum',
      question: 'How do I comment on or reply to posts?',
      answer: 'To comment: (1) Click "Comments" under any post, (2) Type your comment in the text box, (3) Click "Post Comment". To reply to a specific comment: (1) Click "Reply" under the comment, (2) Type your reply, (3) Click the reply button. All comments and replies are posted with your anonymous username only.'
    },
    {
      id: 21,
      category: 'Technical Issues',
      question: 'The website is not loading or running slowly. What should I do?',
      answer: 'Try these troubleshooting steps: (1) Refresh the page (Ctrl+R or Cmd+R), (2) Clear your browser cache and cookies, (3) Try a different browser (Chrome, Firefox, Safari, Edge), (4) Check your internet connection, (5) Disable browser extensions temporarily, (6) Try accessing from a different device. If problems persist, contact technical support at itsmedalgom@gmail.com.'
    },
    {
      id: 22,
      category: 'Technical Issues',
      question: 'I forgot my password. How do I reset it?',
      answer: 'To reset your password: (1) Click "Forgot Password?" on the login page, (2) Enter your registered email address, (3) Check your email for a 6-digit reset code, (4) Enter the code on the password reset page, (5) Create and confirm your new password, (6) Log in with your new password. Reset codes expire in 10 minutes. Check your spam folder if you don\'t receive the email.'
    },
    {
      id: 23,
      category: 'Technical Issues',
      question: 'Can I use HealthHub on my mobile phone?',
      answer: 'Yes! HealthHub is fully responsive and works on mobile phones, tablets, and desktop computers. Simply access the website through your mobile browser (Chrome, Safari, Firefox, etc.). For the best experience, we recommend using the latest version of your preferred mobile browser and a stable internet connection.'
    },
    {
      id: 24,
      category: 'Contact & Support',
      question: 'How can I contact CPAG?',
      answer: 'You can reach CPAG through: Email: cavitepositiveactiongroup@outlook.com, Phone: (046) 542 9246, Address: 9002 J. Miranda Street, Barangay Lao Lao Caridad, Cavite City 4100, Philippines. Office Hours: Monday-Friday, 9:00 AM - 5:30 PM. For technical issues, email: itsmedalgom@gmail.com. We respond to all inquiries within 48 hours.'
    },
    {
      id: 25,
      category: 'Contact & Support',
      question: 'Can I visit the clinic without an appointment?',
      answer: 'While walk-ins are sometimes accepted depending on availability, we strongly recommend booking an appointment through the HealthHub platform to ensure you receive timely service and avoid long wait times. Appointments help us provide better care and reduce overcrowding at the clinic.'
    }
  ];

  const categories = [
    'all',
    'Account & Registration',
    'Privacy & Anonymity',
    'Appointments & Scheduling',
    'Services',
    'Community Forum',
    'Technical Issues',
    'Contact & Support'
  ];

  // Filter FAQs based on search query and selected category
  const filteredFAQs = useMemo(() => {
    let filtered = faqData;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(faq => faq.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        faq =>
          faq.question.toLowerCase().includes(query) ||
          faq.answer.toLowerCase().includes(query) ||
          faq.category.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
            <HelpCircle className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about HealthHub, CPAG services, and how to use the platform
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for questions, topics, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-700 placeholder-gray-400"
            />
          </div>
          {searchQuery && (
            <p className="mt-3 text-sm text-gray-600">
              Found <span className="font-semibold text-blue-600">{filteredFAQs.length}</span> result{filteredFAQs.length !== 1 ? 's' : ''} for "{searchQuery}"
            </p>
          )}
        </div>

        {/* Category Filter */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter by Category</h3>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category === 'all' ? 'All Questions' : category}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ List */}
        {filteredFAQs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No Results Found</h3>
            <p className="text-gray-600 mb-6">
              We couldn't find any questions matching "{searchQuery}"
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFAQs.map((faq) => (
              <div
                key={faq.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
              >
                <button
                  onClick={() => toggleExpand(faq.id)}
                  className="w-full px-6 py-5 flex items-start justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 pr-4">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full mb-2">
                      {faq.category}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-800 leading-relaxed">
                      {faq.question}
                    </h3>
                  </div>
                  <div className="flex-shrink-0">
                    {expandedId === faq.id ? (
                      <ChevronUp className="w-6 h-6 text-blue-600" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                </button>

                {expandedId === faq.id && (
                  <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Contact Section */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-3">Still Have Questions?</h2>
            <p className="text-blue-100 text-lg">
              Our team is here to help. Contact us through any of these channels:
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-white/20 transition">
              <div className="inline-block p-3 bg-white/20 rounded-full mb-4">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Email Support</h3>
              <p className="text-sm text-blue-100 mb-2">General Inquiries:</p>
              <a
                href="mailto:cavitepositiveactiongroup@outlook.com"
                className="text-sm hover:underline break-all"
              >
                cavitepositiveactiongroup@outlook.com
              </a>
              <p className="text-sm text-blue-100 mt-3 mb-2">Technical Support:</p>
              <a
                href="mailto:itsmedalgom@gmail.com"
                className="text-sm hover:underline"
              >
                itsmedalgom@gmail.com
              </a>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-white/20 transition">
              <div className="inline-block p-3 bg-white/20 rounded-full mb-4">
                <Phone className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Phone</h3>
              <p className="text-sm text-blue-100 mb-2">Call us at:</p>
              <a href="tel:0465429246" className="text-lg font-semibold hover:underline">
                (046) 542 9246
              </a>
              <p className="text-sm text-blue-100 mt-3">
                Monday-Friday<br />9:00 AM - 5:30 PM
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-white/20 transition">
              <div className="inline-block p-3 bg-white/20 rounded-full mb-4">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Visit Us</h3>
              <p className="text-sm text-blue-100">
                9002 J. Miranda Street<br />
                Brgy. Lao Lao Caridad<br />
                Cavite City 4100<br />
                Philippines
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-blue-100">
              ⏰ We respond to all inquiries within 48 hours
            </p>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-2">Privacy & Confidentiality</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                All communications with CPAG are strictly confidential and protected under the Philippine Data Privacy Act of 2012 (RA 10173). Your information is never shared without your explicit consent. For more details, review our privacy policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQs;