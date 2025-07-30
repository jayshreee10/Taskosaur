'use client';

import { motion } from 'framer-motion';
import { UserPlus, Shield, Zap, Users, Sparkles, ArrowRight, TrendingUp, Award } from 'lucide-react';

const features = [
  {
    icon: UserPlus,
    title: 'Quick Setup Process',
    description: 'Get started in minutes with our intuitive onboarding and smart project templates.',
    metric: '< 5 min setup'
  },
  {
    icon: Shield,
    title: 'Secure by Design',
    description: 'Your data is protected with enterprise-grade security and privacy controls.',
    metric: 'SOC 2 certified'
  },
  {
    icon: Zap,
    title: 'Instant Productivity',
    description: 'Start managing tasks immediately with pre-built workflows and automations.',
    metric: '100+ templates'
  },
  {
    icon: Users,
    title: 'Team Ready',
    description: 'Collaborate seamlessly with unlimited team members and guest access.',
    metric: 'Unlimited users'
  }
];


export function SignupContent() {
  // Define the SVG pattern as a separate variable to avoid JSX parsing issues
  const dotPattern = "data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E";

  return (
    <div className="relative flex flex-col justify-center px-8 lg:px-12 xl:px-16 py-8 bg-gradient-to-br from-[var(--primary)] via-[var(--primary)] to-[var(--primary)]/95 overflow-hidden h-full">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--primary)]/10 to-[var(--primary)]/20" />
        <div className="absolute top-10 left-10 w-80 h-80 bg-[var(--primary)]/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[var(--primary)]/10 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/3 w-60 h-60 bg-[var(--primary)]/8 rounded-full blur-2xl animate-pulse delay-300" />
        <div 
          className="absolute inset-0 opacity-20" 
          style={{ backgroundImage: `url("${dotPattern}")` }}
        />
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 max-w-2xl mx-auto lg:mx-0">
        {/* Brand Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white/15 backdrop-blur-lg rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
              <Sparkles className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">Taskosaur</h1>
              <div className="flex items-center space-x-2 mt-1">
                <Award className="w-3 h-3 text-white/70" />
                <p className="text-white/70 text-xs lg:text-sm font-medium">Join the Evolution</p>
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-4 leading-tight">
            Start your journey to
            <br />
            <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              effortless productivity
            </span>
          </h2>
          
          <p className="text-white/85 text-sm lg:text-base leading-relaxed mb-6 max-w-xl">
            Create your free account today and discover why thousands of teams 
            choose Taskosaur to streamline their workflow and achieve more.
          </p>

          {/* Enhanced CTA Badge */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="inline-flex items-center space-x-3 bg-white/15 backdrop-blur-md border border-white/25 rounded-full px-4 lg:px-6 py-3 shadow-lg"
          >
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-sm" />
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-white text-xs lg:text-sm font-semibold">Free forever • No credit card required</span>
          </motion.div>
        </motion.div>

        {/* Enhanced Features Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="space-y-4"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 + index * 0.1, ease: "easeOut" }}
              className="group cursor-pointer bg-white/5 backdrop-blur-sm border border-white/15 rounded-xl p-4 hover:bg-white/10 hover:border-white/25 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] w-full"
            >
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/15 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 group-hover:bg-white/25 group-hover:scale-105 transition-all duration-300 flex-shrink-0 shadow-sm">
                  <feature.icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-white font-semibold text-sm lg:text-base group-hover:text-white transition-colors">
                      {feature.title}
                    </h3>
                    <span className="text-xs font-medium text-white/90 bg-white/10 px-2 py-1 rounded-full">
                      {feature.metric}
                    </span>
                  </div>
                  <p className="text-white/75 text-xs lg:text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-white/60 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1 flex-shrink-0" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
