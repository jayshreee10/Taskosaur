;

import { motion } from 'framer-motion';
import { Sparkles, Award } from 'lucide-react';

export function LoginContent() {
  return (
    <div className="login-hero-container">
      {/* Diagonal fade grid */}

      {/* Enhanced Background Elements */}

      
      {/* Main Content */}
      <div className="login-hero-content">
        {/* Brand Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="login-brand-header"
        >
          <div className="login-brand-logo-row">
            <div className="login-brand-logo-icon">
              <Sparkles className="login-brand-logo-sparkles" />
            </div>
            <div>
              <h1 className="login-brand-title">Taskosaur</h1>
              <div className="login-brand-subtitle-row">
                <Award className="login-brand-award-icon" />
                <p className="login-brand-subtitle">Award-winning Project Management</p>
              </div>
            </div>
          </div>
          
          <h2 className="login-hero-heading">
            Transform your
            <br />
            <span className="login-hero-heading-gradient">
              team's workflow
            </span>
          </h2>
          
          <p className="login-hero-description">
            Experience the future of project management with AI-powered tools 
            that adapt to your team's unique workflow and boost productivity.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
