
import React from 'react';
import { View } from '../App';
import { IMAGES } from '../assets/images';

interface FooterProps {
  onNavigate: (view: View) => void;
  isAdminLoggedIn?: boolean;
}

const Footer: React.FC<FooterProps> = ({ onNavigate, isAdminLoggedIn }) => {
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    onNavigate('home');
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        const headerOffset = 80;
        const offsetPosition = element.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 py-12 md:py-20 transition-colors">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2 mb-6 cursor-pointer" onClick={() => onNavigate('home')}>
              <div className="w-8 h-8 rounded-md overflow-hidden flex items-center justify-center">
                <img src={IMAGES.logo} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-xl tracking-tight text-blue-900 dark:text-white">
                CodeWithGideon
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
              Empowering the next generation of developers through live, instructor-led, cohort-based education. Built for serious learners.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://www.instagram.com/c0dewithgideon" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-slate-400 hover:text-blue-900 dark:hover:text-teal-400 transition-colors"
                title="Instagram"
              >
                <span className="sr-only">Instagram</span>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a 
                href="https://www.tiktok.com/@codewithgideon" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-slate-400 hover:text-blue-900 dark:hover:text-teal-400 transition-colors"
                title="TikTok"
              >
                <span className="sr-only">TikTok</span>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31 0 2.591.21 3.824.627v4.962c-.522-.194-1.082-.302-1.662-.302-2.345 0-4.247 1.902-4.247 4.247v3.456h4.958c.208 2.105-1.495 3.993-3.593 4.194-2.103.201-3.993-1.498-4.195-3.601-.01-.101-.015-.203-.015-.305V4.267C7.636 1.908 9.537 0 11.896 0h.629zM24 4.488c-1.718-1.044-3.222-2.424-4.432-4.068h-4.962v18.086c.014 3.294-2.653 5.961-5.947 5.961h-.63c-3.297 0-5.97-2.673-5.97-5.97 0-3.294 2.673-5.967 5.967-5.967.302 0 .604.022.903.066v-5.01c-.302-.03-.604-.045-.903-.045C2.964 7.541 0 10.505 0 14.156c0 3.65 2.964 6.615 6.615 6.615h.63c3.647 0 6.612-2.965 6.612-6.615V9.17c1.446 1.052 3.029 1.87 4.731 2.433v-4.962c-1.458-.401-2.825-1.056-4.062-1.933V4.488h9.474z"/></svg>
              </a>
              <a 
                href="https://api.whatsapp.com/message/NMQR2ZKNJTZBL1?autoload=1&app_absent=0" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-slate-400 hover:text-blue-900 dark:hover:text-teal-400 transition-colors"
                title="WhatsApp"
              >
                <span className="sr-only">WhatsApp</span>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.411.001 12.045c0 2.12.554 4.188 1.597 6.004L0 24l6.135-1.61a11.822 11.822 0 005.912 1.569h.005c6.634 0 12.043-5.411 12.046-12.047a11.817 11.817 0 00-3.535-8.414z"/></svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-blue-900 dark:text-teal-400 mb-6 uppercase text-xs tracking-widest">Platform</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')} className="text-slate-500 dark:text-slate-400 hover:text-blue-900 dark:hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#courses" onClick={(e) => scrollToSection(e, 'courses')} className="text-slate-500 dark:text-slate-400 hover:text-blue-900 dark:hover:text-white transition-colors">Courses</a></li>
              <li><a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className="text-slate-500 dark:text-slate-400 hover:text-blue-900 dark:hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#faq" onClick={(e) => scrollToSection(e, 'faq')} className="text-slate-500 dark:text-slate-400 hover:text-blue-900 dark:hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-blue-900 dark:text-teal-400 mb-6 uppercase text-xs tracking-widest">Company</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="javascript:void(0)" onClick={() => onNavigate('contact')} className="text-slate-500 dark:text-slate-400 hover:text-blue-900 dark:hover:text-white transition-colors">Contact</a></li>
              <li><a href="javascript:void(0)" onClick={() => onNavigate('privacy')} className="text-slate-500 dark:text-slate-400 hover:text-blue-900 dark:hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="javascript:void(0)" onClick={() => onNavigate('terms')} className="text-slate-500 dark:text-slate-400 hover:text-blue-900 dark:hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="javascript:void(0)" onClick={() => onNavigate('refund')} className="text-slate-500 dark:text-slate-400 hover:text-blue-900 dark:hover:text-white transition-colors">Refund Policy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-blue-900 dark:text-teal-400 mb-6 uppercase text-xs tracking-widest">Admin</h4>
            <ul className="space-y-4 text-sm">
              <li>
                <button 
                  onClick={() => onNavigate(isAdminLoggedIn ? 'admin-dashboard' : 'admin-login')}
                  className="text-slate-400 hover:text-blue-900 dark:hover:text-teal-400 font-bold transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  Admin Portal
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 dark:text-slate-500 text-xs text-center md:text-left">
            © {new Date().getFullYear()} CodeWithGideon. All rights reserved. Registered in Nigeria.
          </p>
          <div className="flex items-center space-x-6">
            <span className="text-xs text-slate-400 dark:text-slate-500">Live Cohort-Based Education.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
