;

import { motion } from 'framer-motion';
import { Sparkles, Award } from 'lucide-react';

export function RegisterContent() {
  // Define the SVG pattern as a separate variable to avoid JSX parsing issues
  const dotPattern = "data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E";

  return (
    <div className="min-h-screen w-full bg-background relative signup-hero-container">
      
      {/* Main Content */}
      <div className="signup-hero-content relative z-10">
        {/* Brand Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="signup-brand-header"
        >
          <div className="signup-brand-logo-row">
            <div className="signup-brand-logo-icon">
              <Sparkles className="signup-brand-logo-sparkles" />
            </div>
            <div>
              <h1 className="signup-brand-title">Taskosaur</h1>
              <div className="signup-brand-subtitle-row">
                <Award className="signup-brand-award-icon" />
                <p className="signup-brand-subtitle">Join the Evolution</p>
              </div>
            </div>
          </div>
          
          <h2 className="signup-hero-heading">
            Start your journey to
            <br />
            <span className="signup-hero-heading-gradient">
              effortless productivity
            </span>
          </h2>
          
          <p className="signup-hero-description">
            Create your free account today and discover why thousands of teams 
            choose Taskosaur to streamline their workflow and achieve more.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
