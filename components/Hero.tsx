import React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Play,
  Sparkles,
  Code2,
  Users,
  Smartphone,
  Zap,
} from "lucide-react";
import { IMAGES } from "../assets/images";
import { useSiteConfig } from "../hooks/useSiteConfig";

const Hero: React.FC = () => {
  const { config } = useSiteConfig();
  const homepageCtaHref = config.homepageCtaHref || "#courses";
  const homepageCtaSectionId = homepageCtaHref.startsWith("#")
    ? homepageCtaHref.slice(1)
    : "";
  const homepageCtaExternal = /^https?:\/\//i.test(homepageCtaHref);
  const apkHref = config.apkDownloadUrl || "/contact";
  const opensExternally = /^https?:\/\//i.test(apkHref);

  const scrollToId = (
    e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
    id: string,
  ) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="relative overflow-hidden bg-white pt-24 pb-18 transition-colors min-h-[calc(100svh-5.5rem)] md:pt-32 md:pb-24 lg:min-h-[calc(100svh-6.5rem)] dark:bg-slate-950">
      {/* Sophisticated Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-500/10 blur-[120px] animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, #334155 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="mx-auto flex min-h-[inherit] max-w-7xl flex-col items-center gap-14 px-6 lg:flex-row lg:gap-24">
        {/* Left Content */}
        <div className="lg:w-1/2 relative z-20 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest mb-8 shadow-sm">
              <Sparkles size={14} />
              <span>The Future of Tech Education</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white leading-[0.95] mb-8 tracking-tighter">
              Learn Coding, Live. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">
                Build Reality.
              </span>
            </h1>

            <p className="text-xl text-slate-500 dark:text-slate-400 mb-10 max-w-xl leading-relaxed mx-auto lg:mx-0 font-medium">
              Join elite, instructor led cohorts in{" "}
              <span className="text-slate-900 dark:text-white font-bold">
                Flutter
              </span>
              ,{" "}
              <span className="text-slate-900 dark:text-white font-bold">
                Web
              </span>
              , and{" "}
              <span className="text-slate-900 dark:text-white font-bold">
                AI
              </span>
              . No more lonely tutorials—build real products with a community
              that cares.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-5 mb-12 justify-center lg:justify-start">
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href={homepageCtaHref}
                target={homepageCtaExternal ? "_blank" : undefined}
                rel={homepageCtaExternal ? "noopener noreferrer" : undefined}
                onClick={(e) => {
                  if (homepageCtaSectionId) scrollToId(e, homepageCtaSectionId);
                }}
                className="w-full sm:w-auto bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white px-10 py-5 rounded-2xl font-black text-lg transition-all shadow-2xl shadow-blue-500/20 flex items-center justify-center gap-3 group"
              >
                <span>{config.homepageCtaLabel}</span>
                <ArrowRight
                  size={20}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </motion.a>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => scrollToId(e, "how-it-works")}
                className="w-full sm:w-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-10 py-5 rounded-2xl font-black text-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
              >
                <Play size={20} className="fill-current" />
                <span>See How It Works</span>
              </motion.button>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 opacity-70 hover:opacity-100 transition-all duration-500 mb-12">
              <div className="flex items-center gap-2">
                <Smartphone size={20} />
                <span className="text-xs font-black uppercase tracking-widest">
                  Mobile First
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={20} />
                <span className="text-xs font-black uppercase tracking-widest">
                  Live Cohorts
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={20} />
                <span className="text-xs font-black uppercase tracking-widest">
                  Expert Mentors
                </span>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100 dark:border-slate-900">
              <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6">
                Learning happens inside our mobile app
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <div className="group relative">
                  <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed transition-all">
                    <Play size={18} className="text-slate-400" />
                    <div className="text-left">
                      <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">
                        Play Store
                      </p>
                      <p className="text-[10px] font-bold text-slate-500">
                        (Soon)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="group relative">
                  <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed transition-all">
                    <Smartphone size={18} className="text-slate-400" />
                    <div className="text-left">
                      <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">
                        App Store
                      </p>
                      <p className="text-[10px] font-bold text-slate-500">
                        (Soon)
                      </p>
                    </div>
                  </div>
                </div>

                <motion.a
                  whileHover={{ y: -2 }}
                  href={apkHref}
                  target={opensExternally ? "_blank" : undefined}
                  rel={opensExternally ? "noopener noreferrer" : undefined}
                  className="flex items-center gap-3 px-5 py-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-600 dark:text-blue-400 transition-all group"
                >
                  <Smartphone
                    size={18}
                    className="group-hover:scale-110 transition-transform"
                  />
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase leading-none mb-1">
                      {config.apkDownloadLabel || config.homepageCtaLabel}
                    </p>
                    <p className="text-[10px] font-bold opacity-70">
                      {config.apkDownloadSubLabel}
                    </p>
                  </div>
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Visuals */}
        <div className="lg:w-1/2 relative flex justify-center items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative z-10 w-full max-w-xl"
          >
            {/* Main Image Frame */}
            <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-900 group">
              <img
                src={IMAGES.hero.instructor}
                alt="Live Coding Session"
                className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {/* Premium Floating UI - Live Chat */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="absolute -top-12 -right-6 sm:-right-12 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-3xl shadow-2xl border border-white/20 w-56 hidden sm:block z-30"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Live Chat
                  </span>
                </div>

                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200"
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <p className="text-[9px] font-black text-blue-500 mb-0.5">
                    SARAH M.
                  </p>
                  <p className="text-[10px] text-slate-700 dark:text-slate-300 font-medium">
                    This architecture is amazing!
                  </p>
                </div>

                <div className="p-2 bg-teal-500/10 rounded-xl">
                  <p className="text-[9px] font-black text-teal-500 mb-0.5">
                    GIDEON
                  </p>
                  <p className="text-[10px] text-slate-700 dark:text-slate-300 font-medium">
                    Wait until we see the AI part.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Premium Floating UI - Code */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="absolute bottom-20 -left-10 lg:-left-20 bg-slate-950/90 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/10 hidden lg:block z-30"
            >
              <div className="flex gap-1.5 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
              </div>

              <code className="text-xs font-mono text-blue-300 space-y-1 block">
                <p>
                  <span className="text-pink-400">class</span>{" "}
                  <span className="text-blue-400">GideonApp</span> {"{"}
                </p>
                <p className="ml-4">
                  status: <span className="text-teal-400">'Streaming'</span>,
                </p>
                <p className="ml-4">
                  students: <span className="text-teal-400">250+</span>,
                </p>
                <p className="ml-4">
                  mode: <span className="text-teal-400">'Interactive'</span>
                </p>
                <p>{"}"}</p>
              </code>
            </motion.div>

            {/* Premium Floating UI - Stats */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.6 }}
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[85%] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-[2.5rem] shadow-2xl border border-white/20 z-20"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white shadow-lg shrink-0">
                    <Code2 size={24} />
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest truncate">
                      Active Session
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate">
                      Advanced App Architecture
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-full shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">
                    Live Now
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Decorative Back Gradients */}
          <div className="absolute -z-10 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] -top-20 -left-20 animate-pulse" />
          <div
            className="absolute -z-10 w-96 h-96 bg-teal-500/20 rounded-full blur-[100px] -bottom-20 -right-20 animate-pulse"
            style={{ animationDelay: "1s" }}
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
