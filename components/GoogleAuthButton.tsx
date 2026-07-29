import React from "react";

interface GoogleAuthButtonProps {
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void | Promise<void>;
  label?: string;
}

const GoogleGlyph = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
    <path
      fill="#EA4335"
      d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.9-5.4 3.9-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.6 3.6 14.5 2.7 12 2.7 6.9 2.7 2.8 6.9 2.8 12s4.1 9.3 9.2 9.3c5.3 0 8.8-3.7 8.8-8.9 0-.6-.1-1-.1-1.4H12Z"
    />
    <path
      fill="#34A853"
      d="M2.8 7.4l3.2 2.3C6.9 7.7 9.2 6 12 6c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.6 3.6 14.5 2.7 12 2.7 8.4 2.7 5.2 4.7 2.8 7.4Z"
    />
    <path
      fill="#FBBC05"
      d="M12 21.3c2.4 0 4.5-.8 6.1-2.3l-2.8-2.3c-.8.6-1.8 1.1-3.3 1.1-3.8 0-5.2-2.6-5.4-3.8l-3.2 2.5c2.3 4.5 6 4.8 8.6 4.8Z"
    />
    <path
      fill="#4285F4"
      d="M20.8 12.4c0-.6-.1-1-.1-1.4H12v3.9h5.4c-.3 1.1-1.1 2-2 2.6l2.8 2.3c1.6-1.5 2.6-3.8 2.6-7.4Z"
    />
  </svg>
);

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  disabled = false,
  loading = false,
  onClick,
  label = "Continue with Google",
}) => {
  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={disabled || loading}
      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold py-4 rounded-2xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-3"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm">
        <GoogleGlyph />
      </span>
      <span>{loading ? "Please wait..." : label}</span>
    </button>
  );
};

export default GoogleAuthButton;
