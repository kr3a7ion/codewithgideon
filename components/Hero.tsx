import React from "react";
import { IMAGES } from "../assets/images";

const Hero: React.FC = () => {
  const scrollToId = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
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
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-white dark:bg-slate-900 transition-colors">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl opacity-50 -z-10"></div>

      <div className="max-w-7xl mx-auto px-6 text-center md:text-left flex flex-col lg:flex-row items-center gap-20">
        <div className="lg:w-1/2 relative z-20">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 text-sm font-bold mb-6 border border-teal-100 dark:border-teal-800 uppercase tracking-tight">
            <span className="w-2 h-2 rounded-full bg-teal-500 mr-2 animate-pulse"></span>
            Next Flutter Cohort: March 15
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-blue-900 dark:text-white leading-[1.1] mb-6 tracking-tight">
            Learn Coding Live. <br />
            <span className="text-teal-600 dark:text-teal-500">Together.</span>
          </h1>

          <p className="text-xl text-slate-600 dark:text-slate-300 mb-4 max-w-xl leading-relaxed mx-auto md:mx-0">
            Join instructor-led paths in{" "}
            <span className="font-bold text-blue-900 dark:text-white">
              Flutter
            </span>
            ,{" "}
            <span className="font-bold text-blue-900 dark:text-white">
              WordPress
            </span>
            , or{" "}
            <span className="font-bold text-blue-900 dark:text-white">
              AI-Assisted Dev
            </span>
            . Build real products with a cohort of peers.
          </p>

          <p className="text-lg font-bold text-orange-600 dark:text-orange-400 mb-4 flex items-center justify-center md:justify-start">
            <svg
              className="w-6 h-6 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            Learning happens inside our mobile app.
          </p>

          {/* ✅ NEW: App download placeholders (small + non-intrusive) */}
          <div className="mb-10 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
            <a
              href="#"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm3.9 14.6c-.2.4-.6.7-1 .7-.2 0-.4 0-.6-.1-.9-.4-2-.9-3-1.5-1-.6-1.8-1.3-2.5-2.1-.3-.4-.3-.9 0-1.3.3-.4.9-.5 1.3-.2.6.7 1.4 1.3 2.2 1.8.8.5 1.8 1 2.7 1.4.5.2.7.8.5 1.3z" />
              </svg>
              Play Store
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                (Soon)
              </span>
            </a>

            <a
              href="#"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M16.7 13.2c0-2 1.6-2.9 1.7-3-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-2.9-.8-1.5 0-2.9.9-3.7 2.2-1.6 2.7-.4 6.6 1.1 8.8.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3.1-.7 1.4 0 1.9.7 3.1.7 1.3 0 2.1-1.1 2.8-2.2.8-1.2 1.2-2.4 1.2-2.5-.1 0-2.4-.9-2.4-3.4zM14.6 6.8c.6-.8 1-1.9.9-3-.9.1-2 .6-2.6 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2-.5 2.7-1.3z" />
              </svg>
              App Store
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                (Soon)
              </span>
            </a>

            <a
              href="#"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-900 dark:bg-teal-600 text-white font-black text-sm hover:bg-blue-800 dark:hover:bg-teal-500 transition-all shadow-lg"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 16l4-5h-3V4h-2v7H8l4 5zm-8 4h16v-2H4v2z" />
              </svg>
              Download APK
            </a>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <a
              href="#courses"
              onClick={(e) => scrollToId(e, "courses")}
              className="w-full sm:w-auto bg-blue-900 dark:bg-teal-600 hover:bg-blue-800 dark:hover:bg-teal-500 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-blue-200 dark:hover:shadow-teal-900/40"
            >
              Join the Next Class
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => scrollToId(e, "how-it-works")}
              className="w-full sm:w-auto bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-8 py-4 rounded-lg font-bold text-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
            >
              How It Works
            </a>
          </div>
        </div>

        <div className="lg:w-1/2 relative flex justify-center items-center">
          {/* Main Visual Frame */}
          <div className="relative z-10 w-full max-w-lg">
            <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-800">
              <img
                src={IMAGES.hero.instructor}
                alt="Live Coding Session"
                className="w-full aspect-[4/3] object-cover"
              />
            </div>

            {/* Live Chat Component - Repositioned to be less intrusive */}
            <div className="absolute -top-10 -right-4 sm:-right-8 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-gray-100 dark:border-slate-800 w-44 hidden sm:block transform hover:-translate-y-1 transition-transform z-30">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  Live Discussion
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-teal-600">
                    Sarah M.
                  </span>
                  <span className="text-[9px] text-slate-700 dark:text-slate-300">
                    This architecture makes so much sense now.
                  </span>
                </div>
                <div className="flex flex-col border-t border-gray-50 dark:border-slate-800 pt-1">
                  <span className="text-[8px] font-bold text-blue-600">
                    Gideon
                  </span>
                  <span className="text-[9px] text-slate-700 dark:text-slate-300">
                    Exactly! Separation of concerns is key.
                  </span>
                </div>
              </div>
            </div>

            {/* Code Snippet Component - Cleaned up and moved to side */}
            <div className="absolute bottom-12 -left-8 lg:-left-16 bg-slate-950 p-4 rounded-xl shadow-2xl border border-slate-800 hidden lg:block transform hover:scale-105 transition-all z-30">
              <div className="flex space-x-1.5 mb-3 border-b border-slate-800 pb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
              </div>
              <code className="text-[10px] font-mono text-slate-300 leading-tight block">
                <span className="text-purple-400">class</span>{" "}
                <span className="text-yellow-400">CleanApp</span>{" "}
                <span className="text-purple-400">extends</span> Base {"{"}
                <br />
                &nbsp;&nbsp;<span className="text-teal-400">@override</span>
                <br />
                &nbsp;&nbsp;Widget start() {"{"}
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;
                <span className="text-purple-400">return</span>{" "}
                <span className="text-yellow-400">LiveSession</span>(<br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;mentor:{" "}
                <span className="text-green-400">'Gideon'</span>,<br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;peers:{" "}
                <span className="text-teal-400">15</span>,<br />
                &nbsp;&nbsp;&nbsp;&nbsp;);
                <br />
                &nbsp;&nbsp;{"}"}
                <br />
                {"}"}
              </code>
            </div>

            {/* Students Floating UI - Bottom positioned and cleaner */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[90%] bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg p-3 rounded-2xl shadow-xl border border-white/20 z-20">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center space-x-3">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`w-7 h-7 rounded-full border-2 border-white dark:border-slate-800 bg-slate-${200 + i * 100}`}
                      ></div>
                    ))}
                    <div className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-800 bg-teal-500 flex items-center justify-center text-[9px] font-bold text-white">
                      +12
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-blue-900 dark:text-white uppercase tracking-tighter">
                      Active Cohort
                    </p>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400">
                      Live: App Architecture
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-teal-600 dark:text-teal-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                  </span>
                  <span className="text-[9px] font-bold uppercase">
                    Streaming
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative Back Gradients */}
          <div className="absolute -z-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl -top-10 -left-10"></div>
          <div className="absolute -z-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl -bottom-10 -right-10"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
