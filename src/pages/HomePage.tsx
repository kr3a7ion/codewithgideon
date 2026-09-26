import React from "react";
import Hero from "../../components/Hero";
import HowItWorks from "../../components/HowItWorks";
import WhyGideon from "../../components/WhyGideon";
import Features from "../../components/Features";
import Courses from "../../components/Courses";
import Pricing from "../../components/Pricing";
import InstructorBio from "../../components/InstructorBio";
import AppPreview from "../../components/AppPreview";
import FAQ from "../../components/FAQ";
import { useApp } from "../app/AppContext";
import { usePageMeta } from "../app/usePageMeta";
import { Button } from "../ui";

const HomePage: React.FC = () => {
  const { navigateTo } = useApp();
  usePageMeta({});

  return (
    <>
      <Hero />
      <HowItWorks />
      <WhyGideon />
      <Features />
      <Courses onNavigate={navigateTo} />
      <Pricing onNavigate={navigateTo} />
      <InstructorBio />
      <AppPreview />
      <FAQ />

      <section className="bg-blue-900 py-24 text-center dark:bg-slate-950">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-6 text-3xl font-bold text-white md:text-5xl">
            You don’t have to learn alone.
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-blue-100 opacity-90">
            Join a cohort of motivated learners and professional mentors. The
            next class starts soon—reserve your seat today.
          </p>
          <Button variant="accent" size="lg" onClick={() => navigateTo("curriculums")}>
            Join Code with Gideon
          </Button>
        </div>
      </section>
    </>
  );
};

export default HomePage;
