// register.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', agree: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false); // New state for modal
  const navigate = useNavigate();
  const { checkSession } = useAuth();

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Show modal only when checkbox is checked
    if (name === 'agree' && checked) {
      setShowModal(true);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.agree) {
      setError('You must agree to the terms!');
      return;
    }  
    setLoading(true);  
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          username: form.username, 
          email: form.email, 
          password: form.password 
        })
      });      
      const data = await res.json();     
      if (res.ok) {
        // Do NOT call checkSession() here to avoid auto-login/redirect to landing page
        // Instead, just show success message and redirect to login
        alert('Registered successfully! Please log in to access your account.');
        navigate('/user/login'); // Fixed route path (no .jsx extension, matches your Link)
      } else {
        setError(data.msg || data.errors?.[0]?.msg || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row min-h-screen bg-base-100">
        {/* Left Side: Logo and Tagline */}
        <div className="w-full md:w-1/2 bg-[#4c8dd8] flex flex-col items-center justify-center p-8 md:p-12 shadow-xl">
          <h1 className="mb-6 ">
            <img 
              src="/src/assets/hivnice-removebg-preview.png" 
              alt="HealthHub Promotion" 
              className="w-300 h-200 rounded-3xl hover:scale-105" 
            />
          </h1>
          <div className="text-center text-xl md:text-2xl lg:text-3xl font-semibold text-white opacity-90 px-4">
            Breaking Stigma, Spreading Truth
          </div>
        </div>
        {/* Right Side: Form */}
        <div className=" w-full md:w-1/2 bg-base-100 flex flex-col items-center justify-center p-4 md:p-8">
          <div className=" w-full max-w-md mx-auto space-y-6">
            <div className="text-center justify-center items-center flex flex-col">
              <img 
              src="/src/assets/HEALTHUB.png" 
              alt="HealthHub Logo" 
              className=" rounded-lg w-500 h-300  hover:scale-105 mb-4" 
            />
              <h2 className="text-3xl md:text-4xl font-bold mb-2 text-[#4c8dd8]">Welcome!</h2>
              <p className="text-base-content/70">Please enter your details to create a user account.</p>
            </div>
            {error && (
              <div className="alert alert-error shadow-lg">
                <span>{error}</span>
              </div>
            )}  
            <form onSubmit={handleSubmit} className="space-y-4">
              <input 
                name="username" 
                placeholder="Username" 
                value={form.username}
                onChange={handleChange} 
                required
                minLength={3}
                className="input input-bordered w-full input-lg"
              />
              <input 
                name="email" 
                type="email" 
                placeholder="Email" 
                value={form.email}
                onChange={handleChange} 
                required
                className="input input-bordered w-full input-lg"
              />
              <input 
                name="password" 
                type="password" 
                placeholder="Password" 
                value={form.password}
                onChange={handleChange} 
                required
                minLength={6}
                className="input input-bordered w-full input-lg"
              />
              <label className="flex items-start space-x-3 cursor-pointer">
                <input 
                  name="agree" 
                  type="checkbox" 
                  checked={form.agree} 
                  onChange={handleChange} 
                  className="checkbox checkbox-lg checkbox-primary hover:bg-[#2E5D93] mt-1" 
                />
                <span className="text-sm text-base-content/80 leading-relaxed">
                  I agree to HealthHub's Terms of Use and Privacy Policy, and I am of legal age.
                </span>
              </label>
              <button 
                type="submit" 
                className="btn bg-[#4c8dd8] hover:bg-[#2E5D93] text-white w-full btn-lg shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  'Register'
                )}
              </button>
              <p className="text-center text-sm text-base-content/70">
                Already have account? <Link to="/user/login" className="link link-hover text-[#4c8dd8] font-semibold">Login</Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* DaisyUI Modal for Terms and Privacy Policy */}
      <input type="checkbox" id="policy-modal" className="modal-toggle" checked={showModal} readOnly />
      <div className="modal" role="dialog">
        <div className="modal-box w-11/12 max-w-5xl max-h-[80vh] overflow-y-auto">
          <h3 className="font-bold text-lg mb-4">Terms of Use and Privacy Policy</h3>
          <div className="space-y-6 text-sm leading-relaxed">
            {/* Terms of Use Section */}
            <div className="bg-base-100 p-4 rounded-lg border border-base-200">
              <h4 className="font-semibold text-primary mb-2">Terms of Use</h4>
              <p>
                TERMS OF USE

                Overview
                Welcome to [Site Name], an anonymous social network that provides education on HIV, peer support, and scheduling tools to help users manage appointments and reminders.
                By accessing or using [Site Name], you agree to these Terms of Use and our Privacy Policy.
                Eligibility and Accounts
                Intended for adults (18+). Minors under 18 may use the site only with verified parental/guardian consent, where legally permitted.
                Anonymity: Public profiles and posts should not include personally identifiable information (PII). We may offer optional private features (e.g., scheduling) that require contact details; these are never displayed publicly.
                You are responsible for maintaining the confidentiality of any login credentials and for all activities under your account.
                Community Guidelines
                Purpose: Reduce stigma, share education, and provide supportive community interactions.
                Prohibited content: Stigma or discrimination, hate speech, harassment, threats, doxxing, explicit sexual content, self-harm encouragement, medical misinformation, spam, illegal activity, commercial solicitation, and attempts to identify other users.
                Be respectful, use evidence-based information, and avoid sharing others’ private information.
                We may remove content, restrict accounts, or report unlawful activity to authorities where legally required.
                Content Ownership and License
                User content: You retain ownership of the content you post. By posting, you grant [Site Name] a non-exclusive, worldwide, royalty-free license to host, display, and distribute your content on the service, solely to operate and improve the platform.
                Do not post content you do not have rights to.
                Scheduling and Educational Tools
                Scheduling features are optional. You may provide contact details solely to receive appointment reminders and support services.
                Educational content is for informational purposes only and is not medical or legal advice.
                Not for emergencies: If you are in crisis or experiencing a medical emergency, contact local emergency services immediately (e.g., 911/Philippine emergency hotlines) or your healthcare provider.
                No Medical Advice
                [Site Name] is not a healthcare provider. Content on the platform does not replace guidance from licensed medical professionals.
                Always consult qualified health professionals for diagnosis, treatment, or medical decisions.
                Privacy and Data Protection
                We process personal data in accordance with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173), its Implementing Rules and Regulations, and other applicable laws. See our Privacy Policy for details.
                Moderation and Enforcement
                We may monitor publicly available content for violations.
                We may suspend or terminate accounts that breach these Terms or applicable law.
                You can report content through [Report Feature/Email]. We will review and act as appropriate.
                Third-Party Services
                We may use third-party processors (e.g., analytics, messaging providers) under data processing agreements and consistent with our Privacy Policy.
                Disclaimers and Limitation of Liability
                The service is provided “as is” and “as available.” We do not guarantee uninterrupted, error-free service or the accuracy of user-generated content.
                To the maximum extent permitted by law, [Company Name] is not liable for indirect, incidental, or consequential damages arising from your use of the service.
                Some jurisdictions do not allow certain limitations; in such cases, limits apply to the fullest extent permitted.
                Indemnification
                You agree to indemnify and hold harmless [Company Name], its officers, employees, and partners from claims arising out of your use of the service, your content, or violation of these Terms.
                Termination
                You may stop using the service at any time. We may suspend or terminate your access if you violate these Terms, pose a security risk, or if legally required.
                Governing Law and Dispute Resolution
                These Terms are governed by the laws of the Republic of the Philippines.
                Venue: Courts of [City/Province], Philippines, unless otherwise mandated by law. We may offer voluntary mediation/arbitration options.
                Changes to Terms
                We may update these Terms periodically. We will notify users through the site or email when material changes occur. Continued use after changes signifies acceptance.
                Contact
                For questions about these Terms: [Contact Email] or [Postal Address].
              </p>
              {/* Add more paragraphs or sections as needed */}
            </div>
            
            {/* Privacy Policy Section */}
            <div className="bg-base-100 p-4 rounded-lg border border-base-200">
              <h4 className="font-semibold text-primary mb-2">Privacy Policy</h4>
              <p>
                Overview and Scope
                This Privacy Policy explains how [Site Name] collects, uses, and protects personal data, including sensitive personal information related to health that you may choose to share, in compliance with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173) and its IRR.
                Applies to all site features, including social posting, messaging, scheduling, reminders, and support services.
                Legal Bases for Processing
                Consent: For optional features (e.g., scheduling, reminders, any health-related information you choose to provide).
                Contract: To provide and operate the service you request.
                Legitimate Interests: Maintain platform security, prevent abuse, improve features; not overridden by your rights.
                Legal Obligations and Vital Interests: Compliance with law, safety, and incident response.
                Data We Collect
                Account and Authentication: Username (pseudonymous), password, email or phone (optional for scheduling or account recovery).
                Profile and Posts: Anonymous text, images (if enabled). We discourage sharing PII or specific health status in public posts.
                Scheduling: Appointment details, clinic/provider info you input, reminder preferences (SMS/email/push), time zone, device settings needed for reminders.
                Communications: Support inquiries, report submissions.
                Device/Usage: IP address, device/browser type, language, app version, timestamps, pages viewed, referrer URLs; used for security and performance.
                Cookies and Similar Technologies: Essential cookies for login and security; preference cookies; minimal analytics with privacy safeguards. You can adjust cookie settings in your browser.
                Sensitive Personal Information (Health)
                You control what you share. We do not require disclosure of HIV status to use the social features.
                If you opt into scheduling or support services and provide health-related details (e.g., appointment type), we will process this data with enhanced protections, separate from public content, and only for the specified purpose with your consent.
                Do not post sensitive personal information in public areas.
                How We Use Data
                Provide and secure the service: authentication, content hosting, moderation, fraud and abuse prevention.
                Scheduling and reminders: send notifications you request; coordinate with providers only with your explicit consent.
                Improve the platform: quality assurance, feature development, analytics (using aggregate or de-identified data where possible).
                Compliance and Safety: fulfill legal obligations, respond to lawful requests, detect and address violations or risks.
                Data Minimization, Anonymity, and Pseudonymity
                Public features are designed for anonymity: we do not display PII publicly.
                We separate identifiers used for scheduling from public profiles.
                We apply data minimization and proportionality consistent with RA 10173.
                Sharing and Disclosure
                Service Providers: Hosting, analytics, messaging, security vendors under data processing agreements, bound by confidentiality and security obligations.
                Healthcare Providers or NGOs: Only with your explicit, informed consent for scheduling or support coordination.
                Legal Requirements: We may disclose data if required by law, court order, or government regulation, with transparency where permitted.
                Business Transfers: In case of merger/acquisition, your data may transfer under equivalent protections, with notice and choices where feasible.
                Cross-Border Transfers
                We aim to store data in the Philippines. If data is transferred outside the Philippines, we will implement appropriate safeguards (e.g., contractual clauses), inform you where required, and ensure compliance with RA 10173.
                Security Measures
                Encryption in transit (TLS) and at rest for sensitive fields.
                Access controls, audit logs, role-based permissions.
                Segregation of scheduling data from public content.
                Regular security testing, vulnerability management, and employee training.
                Incident Response: We will notify the National Privacy Commission (NPC) and affected individuals of personal data breaches in accordance with RA 10173 and NPC guidelines.
                Retention
                Account data: retained while your account is active. If you delete your account, we delete or anonymize data within [30–90] days, except where retention is required by law or for legitimate interests (e.g., abuse prevention, legal defense).
                Public posts: retained to support community continuity; you may delete your posts, and we will remove them from public view promptly.
                Scheduling data: retained only as long as necessary to deliver reminders and support services, typically [12–24] months, unless you request earlier deletion.
                Aggregated or de-identified data may be retained for analytics.
                Your Rights under RA 10173
                Right to be Informed: Clear information about processing activities, purposes, and recipients.
                Right to Object: You can object to processing for direct marketing or where your rights outweigh our legitimate interests.
                Right to Access: Request a copy of your personal data and processing details.
                Right to Rectification: Correct inaccurate or incomplete data.
                Right to Erasure/Blocking: Request deletion or blocking of data that is excessive, unauthorized, or inaccurate.
                Right to Damages: Seek damages for violations of your data privacy rights, as provided by law.
                Right to File a Complaint: With the National Privacy Commission (NPC).
                Exercising Rights: Contact our Data Protection Officer (DPO) at [DPO Email]. We will respond within [30] days or as required by law, subject to identity verification.
                Children’s Privacy
                We do not knowingly collect personal data from children under 18 without verified parental/guardian consent. If we learn of such data collected without consent, we will delete it.
                Automated Decision-Making and Profiling
                We do not use automated decision-making that produces legal or similarly significant effects. Limited automated moderation may flag content for human review.
                Cookies and Analytics
                Essential cookies: required for login and security.
                Preference cookies: remember settings.
                Minimal privacy-friendly analytics: aggregated usage to improve performance; opt-out options may be provided.
                You can manage cookies via your browser settings. Disabling essential cookies may affect site functionality.
                Changes to This Policy
                We may update this Privacy Policy. Material changes will be communicated via the site or email. Continued use indicates acceptance.
                Data Protection Officer and Contact
                Data Protection Officer: [DPO Name]
                Email: [DPO Email]
                Address: [Company Address]
                National Privacy Commission (NPC): You may file complaints or inquiries at https://privacy.gov.ph
                Effective Date
                Last updated: [Date]
              </p>
              {/* Add more paragraphs or sections as needed */}
            </div>
          </div>
          <div className="modal-action mt-6">
            <label 
              htmlFor="policy-modal" 
              className="btn bg-[#4c8dd8] hover:bg-[#2E5D93] text-white"
              onClick={() => setShowModal(false)} // Close modal programmatically
            >
              I Agree and Close
            </label>
          </div>
        </div>
      </div>
    </>
  );
}