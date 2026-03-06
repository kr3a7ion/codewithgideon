import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Instagram,
  MessageCircle,
  Send,
  User,
  PencilLine,
  ArrowUpRight,
  Smartphone,
  Clock3,
  BadgeHelp,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, functions } from "../services/firebase";
import { httpsCallable } from "firebase/functions";

const CONTACT_CONFIG = {
  heading: "Contact Us",
  subheading: "We’d love to hear from you.",
  introTitle: "Get in Touch",
  introText:
    "If you have questions about weekly billing, enrollment, or the CodeWithGideon app, feel free to reach out. We typically respond within 24 hours.",

  email: "codewithgideon.learn@gmail.com",
  instagramUrl: "https://www.instagram.com/c0dewithgideon",
  instagramHandle: "@c0dewithgideon",
  tiktokUrl: "https://www.tiktok.com/@codewithgideon",
  tiktokHandle: "@codewithgideon",
  whatsappUrl:
    "https://api.whatsapp.com/message/NMQR2ZKNJTZBL1?autoload=1&app_absent=0",

  responseTime: "Typically within 24 hours",
  supportTopics: ["Enrollment", "Billing", "App Access"],
};

const contactCards = [
  {
    label: "Email",
    value: CONTACT_CONFIG.email,
    href: `mailto:${CONTACT_CONFIG.email}`,
    icon: Mail,
    accent:
      "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-900/30",
    hover: "hover:text-blue-600 dark:hover:text-blue-400",
  },
  {
    label: "Instagram",
    value: `Instagram: ${CONTACT_CONFIG.instagramHandle}`,
    href: CONTACT_CONFIG.instagramUrl,
    icon: Instagram,
    accent:
      "bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 border-pink-100 dark:border-pink-900/30",
    hover: "hover:text-pink-600 dark:hover:text-pink-400",
  },
  {
    label: "TikTok",
    value: `TikTok: ${CONTACT_CONFIG.tiktokHandle}`,
    href: CONTACT_CONFIG.tiktokUrl,
    icon: Smartphone,
    accent:
      "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700",
    hover: "hover:text-slate-900 dark:hover:text-white",
  },
  {
    label: "WhatsApp",
    value: "Direct Chat",
    href: CONTACT_CONFIG.whatsappUrl,
    icon: MessageCircle,
    accent:
      "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-100 dark:border-green-900/30",
    hover: "hover:text-green-600 dark:hover:text-green-400",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    message?: string;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const validate = () => {
    const nextErrors: {
      name?: string;
      email?: string;
      message?: string;
    } = {};

    const cleanName = formData.name.trim();
    const cleanEmail = formData.email.trim();
    const cleanMessage = formData.message.trim();

    if (!cleanName) {
      nextErrors.name = "Please enter your name.";
    } else if (cleanName.length < 2) {
      nextErrors.name = "Name must be at least 2 characters.";
    }

    if (!cleanEmail) {
      nextErrors.email = "Please enter your email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!cleanMessage) {
      nextErrors.message = "Please enter your message.";
    } else if (cleanMessage.length < 10) {
      nextErrors.message = "Message must be at least 10 characters.";
    }

    return nextErrors;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setFieldErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));

    setSubmitError("");
    setSubmitSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");

    const errors = validate();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);

    try {
      const sendContactMessage = httpsCallable<
        { name: string; email: string; message: string },
        { success: boolean; message: string }
      >(functions, "sendContactMessage");

      const result = await sendContactMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        message: formData.message.trim(),
      });

      if (!result.data?.success) {
        throw new Error("Message was not accepted.");
      }

      setSubmitSuccess(result.data.message || "Message sent successfully.");
      setFormData({
        name: "",
        email: "",
        message: "",
      });
      setFieldErrors({});
    } catch (err: any) {
      const code = String(err?.code || "");
      const msg = String(err?.message || "");

      if (code.includes("invalid-argument")) {
        setSubmitError(msg || "Please check your input and try again.");
      } else if (code.includes("internal")) {
        setSubmitError("Server error. Please try again shortly.");
      } else {
        setSubmitError(msg || "Could not send your message. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative py-20 md:py-24 bg-white dark:bg-slate-950 transition-colors overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] rounded-full bg-blue-600/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] rounded-full bg-teal-500/10 blur-[120px]" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08 } },
          }}
        >
          <motion.div variants={fadeUp} className="text-center mb-14 md:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest mb-6">
              <BadgeHelp size={14} />
              <span>Support & Enquiries</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
              {CONTACT_CONFIG.heading}
            </h1>
            <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              {CONTACT_CONFIG.subheading}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 md:gap-10 items-start">
            {/* Left Side */}
            <motion.div
              variants={fadeUp}
              className="rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 md:p-8 shadow-xl"
            >
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-4">
                {CONTACT_CONFIG.introTitle}
              </h2>

              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 text-base md:text-lg">
                {CONTACT_CONFIG.introText}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4">
                  <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                    <Clock3 size={14} />
                    Response Time
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {CONTACT_CONFIG.responseTime}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4">
                  <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                    <BadgeHelp size={14} />
                    Common Topics
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {CONTACT_CONFIG.supportTopics.join(" • ")}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {contactCards.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.a
                      key={item.label}
                      href={item.href}
                      target={
                        item.href.startsWith("http") ? "_blank" : undefined
                      }
                      rel={
                        item.href.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 * index }}
                      className="group flex items-start gap-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:shadow-lg transition-all"
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${item.accent}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                          {item.label}
                        </p>
                        <p
                          className={`font-bold text-slate-900 dark:text-white break-words transition-colors ${item.hover}`}
                        >
                          {item.value}
                        </p>
                      </div>

                      <ArrowUpRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors shrink-0 mt-1" />
                    </motion.a>
                  );
                })}
              </div>
            </motion.div>

            {/* Right Side */}
            <motion.div
              variants={fadeUp}
              className="rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-6 md:p-8 shadow-2xl"
            >
              <div className="mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white shadow-lg mb-4">
                  <Send className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                  Quick Query
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Fill this form and connect it to your preferred contact
                  handler.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <AnimatePresence mode="wait">
                  {submitError && (
                    <motion.div
                      key="contact-error"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-start gap-3"
                    >
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-red-600 dark:text-red-400 text-sm font-medium leading-relaxed">
                        {submitError}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {submitSuccess && (
                    <motion.div
                      key="contact-success"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-900/30 rounded-2xl flex items-start gap-3"
                    >
                      <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                      <p className="text-teal-700 dark:text-teal-300 text-sm font-medium leading-relaxed">
                        {submitSuccess}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                    Name
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your Name"
                      disabled={isSubmitting}
                      className="block w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all disabled:opacity-60"
                    />
                  </div>
                  {fieldErrors.name && (
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 ml-1">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                    Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Your Email"
                      disabled={isSubmitting}
                      className="block w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all disabled:opacity-60"
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 ml-1">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                    Message
                  </label>
                  <div className="relative group">
                    <div className="absolute top-4 left-4 pointer-events-none">
                      <PencilLine className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <textarea
                      name="message"
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="How can we help?"
                      disabled={isSubmitting}
                      className="block w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all resize-none disabled:opacity-60"
                    />
                  </div>
                  {fieldErrors.message && (
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 ml-1">
                      {fieldErrors.message}
                    </p>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-slate-900 dark:bg-teal-600 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 dark:hover:bg-teal-500 transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Message</span>
                    </>
                  )}
                </motion.button>

                <div className="pt-1 text-center">
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                    Messages are stored securely for follow-up.
                  </p>
                </div>
              </form>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Contact;
