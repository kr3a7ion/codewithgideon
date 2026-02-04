
export interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export interface Course {
  title: string;
  duration: string;
  sessions: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
}

export interface PricingPlan {
  name: string;
  price: string;
  features: string[];
  cta: string;
  isPopular?: boolean;
}

export interface FAQItem {
  question: string;
  answer: string;
}
