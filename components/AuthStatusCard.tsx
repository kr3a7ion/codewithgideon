import React from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

type AuthStatusTone = "error" | "success" | "info";

interface AuthStatusCardProps {
  tone?: AuthStatusTone;
  message: string;
}

const toneClasses: Record<
  AuthStatusTone,
  {
    shell: string;
    icon: string;
    Icon: typeof AlertCircle;
  }
> = {
  error: {
    shell:
      "bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-300",
    icon: "bg-red-500",
    Icon: AlertCircle,
  },
  success: {
    shell:
      "bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-900/30 text-teal-700 dark:text-teal-300",
    icon: "bg-teal-500",
    Icon: CheckCircle2,
  },
  info: {
    shell:
      "bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-300",
    icon: "bg-blue-500",
    Icon: Info,
  },
};

const AuthStatusCard: React.FC<AuthStatusCardProps> = ({
  tone = "info",
  message,
}) => {
  const meta = toneClasses[tone];
  const Icon = meta.Icon;

  return (
    <div
      className={`p-4 rounded-2xl flex items-start gap-3 ${meta.shell}`}
      role="status"
      aria-live="polite"
    >
      <div className="shrink-0 mt-0.5">
        {tone === "error" ? (
          <div className={`w-2 h-2 rounded-full ${meta.icon} mt-1.5`} />
        ) : (
          <Icon className="w-5 h-5" />
        )}
      </div>
      <p className="text-sm font-medium leading-relaxed">{message}</p>
    </div>
  );
};

export default AuthStatusCard;
