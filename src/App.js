// src/App.js - Complete file with inline styles
import React, { useState, useEffect } from 'react';

// Icons with fixed sizes to prevent layout issues
const icons = {
  Trophy: () => (
    <svg style={{width: '24px', height: '24px', minWidth: '24px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  Settings: () => (
    <svg style={{width: '24px', height: '24px', minWidth: '24px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  User: () => (
    <svg style={{width: '24px', height: '24px', minWidth: '24px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Video: () => (
    <svg style={{width: '24px', height: '24px', minWidth: '24px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  Brain: () => (
    <svg style={{width: '24px', height: '24px', minWidth: '24px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  CheckCircle: () => (
    <svg style={{width: '24px', height: '24px', minWidth: '24px'}} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  ),
  Circle: () => (
    <svg style={{width: '20px', height: '20px', minWidth: '20px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"></circle>
    </svg>
  ),
  Lock: () => (
    <svg style={{width: '20px', height: '20px', minWidth: '20px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  Clock: () => (
    <svg style={{width: '16px', height: '16px', minWidth: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12,6 12,12 16,14"></polyline>
    </svg>
  ),
  Target: () => (
    <svg style={{width: '16px', height: '16px', minWidth: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="12" r="6"></circle>
      <circle cx="12" cy="12" r="2"></circle>
    </svg>
  ),
  ChevronRight: () => (
    <svg style={{width: '16px', height: '16px', minWidth: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <polyline points="9,18 15,12 9,6"></polyline>
    </svg>
  ),
  PlayCircle: () => (
    <svg style={{width: '32px', height: '32px', minWidth: '32px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"></circle>
      <polygon points="10,8 16,12 10,16"></polygon>
    </svg>
  ),
  Play: () => (
    <svg style={{width: '48px', height: '48px', minWidth: '48px'}} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z"/>
    </svg>
  ),
  Lightbulb: () => (
    <svg style={{width: '48px', height: '48px', minWidth: '48px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  BookOpen: () => (
    <svg style={{width: '48px', height: '48px', minWidth: '48px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  BarChart3: () => (
    <svg style={{width: '24px', height: '24px', minWidth: '24px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Star: () => (
    <svg style={{width: '24px', height: '24px', minWidth: '24px'}} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
  Zap: () => (
    <svg style={{width: '24px', height: '24px', minWidth: '24px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"></polygon>
    </svg>
  ),
  Timer: () => (
    <svg style={{width: '24px', height: '24px', minWidth: '24px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12,6 12,12 16,14"></polyline>
    </svg>
  ),
  Rocket: () => (
    <svg style={{width: '24px', height: '24px', minWidth: '24px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Shield: () => (
    <svg style={{width: '16px', height: '16px', minWidth: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  Download: () => (
    <svg style={{width: '20px', height: '20px', minWidth: '20px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  MessageSquare: () => (
    <svg style={{width: '20px', height: '20px', minWidth: '20px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  Calendar: () => (
    <svg style={{width: '20px', height: '20px', minWidth: '20px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  )
};

function App() {
  const [currentModule, setCurrentModule] = useState(0);
  const [completedModules, setCompletedModules] = useState(new Set());
  const [currentStep, setCurrentStep] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [userProgress, setUserProgress] = useState({
    overallProgress: 0,
    streakDays: 1,
    pointsEarned: 0,
    badgesEarned: []
  });
  const [coachProfile, setCoachProfile] = useState({
    name: '',
    experience: '',
    strengths: [],
    studentProfile: null
  });

  // Timer effect for tracking time spent
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const trainingModules = [
    {
      id: 'welcome',
      title: 'Welcome & Elite Selection',
      icon: icons.Trophy,
      duration: '5 min',
      type: 'interactive',
      progress: 0,
      unlocked: true,
      description: 'Discover your exclusive position and impact potential',
      steps: [
        { type: 'video', title: 'Welcome Message', content: 'Personal welcome from Ivylevel leadership' },
        { type: 'interactive', title: 'Coach Profile Setup', content: 'Tell us about yourself and your coaching strengths' },
        { type: 'quiz', title: 'Culture Check', content: 'Understanding Ivylevel values and mission' }
      ]
    },
    {
      id: 'setup',
      title: 'Technical Foundation',
      icon: icons.Settings,
      duration: '15 min',
      type: 'guided',
      progress: 0,
      unlocked: false,
      description: 'Interactive setup wizard with real-time validation',
      steps: [
        { type: 'wizard', title: 'Email Setup', content: 'Step-by-step email configuration with ivymentors.co domain' },
        { type: 'wizard', title: 'Zoom Integration', content: 'Guided Zoom setup with calendar integration and testing' },
        { type: 'wizard', title: 'Payment Setup', content: 'Mercury account configuration for bi-weekly payments' },
        { type: 'validation', title: 'Setup Verification', content: 'Automated testing of all systems before first session' }
      ]
    },
    {
      id: 'student-mastery',
      title: 'Your Student Deep-Dive',
      icon: icons.User,
      duration: '20 min',
      type: 'personalized',
      progress: 0,
      unlocked: false,
      description: 'Personalized training for your specific student profile',
      steps: [
        { type: 'profile', title: 'Student Profile Analysis', content: 'Interactive exploration of your assigned student' },
        { type: 'strategy', title: 'Coaching Strategy', content: 'Develop personalized approach based on student needs' },
        { type: 'simulation', title: 'Session Simulation', content: 'Practice first session with your student scenario' },
        { type: 'assessment', title: 'Readiness Check', content: 'Ensure complete mastery before first real session' }
      ]
    },
    {
      id: 'session-mastery',
      title: 'Session Excellence',
      icon: icons.Video,
      duration: '25 min',
      type: 'practical',
      progress: 0,
      unlocked: false,
      description: 'Master the art of transformational 60-minute coaching sessions',
      steps: [
        { type: 'interactive', title: 'Session Flow Mastery', content: 'Interactive practice of optimal session structure' },
        { type: 'roleplay', title: 'Challenging Scenarios', content: 'Handle difficult situations like no-shows and low engagement' },
        { type: 'template', title: 'Communication Mastery', content: 'Master email templates and family communication' },
        { type: 'checklist', title: 'Excellence Checklist', content: 'Interactive pre/post session requirements checklist' }
      ]
    },
    {
      id: 'advanced',
      title: 'Elite Performance & Bonuses',
      icon: icons.Brain,
      duration: '18 min',
      type: 'advanced',
      progress: 0,
      unlocked: false,
      description: 'Unlock elite coaching techniques and bonus qualification strategies',
      steps: [
        { type: 'case-study', title: 'Breakthrough Case Studies', content: 'Learn from real coach success stories and student wins' },
        { type: 'advanced', title: 'Specialized Techniques', content: 'Grade-level and student profile-specific advanced strategies' },
        { type: 'bonus', title: 'Performance Bonus Mastery', content: 'Understand qualification criteria and maximize earning potential' },
        { type: 'certification', title: 'Elite Coach Certification', content: 'Final comprehensive assessment and certification' }
      ]
    }
  ];

  const badges = [
    { id: 'setup-wizard', name: 'Setup Wizard', icon: icons.Settings, earned: false },
    { id: 'student-whisperer', name: 'Student Whisperer', icon: icons.User, earned: false },
    { id: 'session-master', name: 'Session Master', icon: icons.Video, earned: false },
    { id: 'communication-expert', name: 'Communication Expert', icon: icons.MessageSquare, earned: false },
    { id: 'elite-coach', name: 'Elite Coach', icon: icons.Trophy, earned: false }
  ];

  const completeStep = (moduleId, stepIndex) => {
    const newCompleted = new Set(completedModules);
    const moduleIndex = trainingModules.findIndex(m => m.id === moduleId);
    
    if (stepIndex === trainingModules[moduleIndex].steps.length - 1) {
      newCompleted.add(moduleId);
      setCompletedModules(newCompleted);
      
      // Unlock next module
      if (moduleIndex < trainingModules.length - 1) {
        trainingModules[moduleIndex + 1].unlocked = true;
      }
      
      // Award points and update progress
      setUserProgress(prev => ({
        ...prev,
        pointsEarned: prev.pointsEarned + 100,
        overallProgress: (newCompleted.size / trainingModules.length) * 100
      }));
      
      // Move to next module if available
      if (moduleIndex < trainingModules.length - 1) {
        setCurrentModule(moduleIndex + 1);
        setCurrentStep(0);
      }
    } else {
      // Move to next step
      setCurrentStep(stepIndex + 1);
    }

    // Log progress data (for your analytics)
    console.log('Progress Update:', {
      coachProfile,
      completedStep: { moduleId, stepIndex },
      timeSpent,
      overallProgress: userProgress.overallProgress
    });
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f0f9ff, #e0e7ff)', 
      padding: '0',
      margin: '0'
    }}>
      {/* Header */}
      <div style={{ 
        background: 'white', 
        padding: '16px 24px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'white' 
            }}>
              <icons.Rocket />
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 2px 0', color: '#111827' }}>
                Ivylevel Coach Training
              </h1>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                Interactive Excellence Platform
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>
                Welcome, {coachProfile.name || 'Coach'}!
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                {Math.round(userProgress.overallProgress)}% Complete
              </div>
            </div>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              background: '#dbeafe', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#2563eb' 
            }}>
              <icons.User />
            </div>
          </div>
        </div>
      </div>

      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '32px 24px', 
        display: 'grid', 
        gridTemplateColumns: window.innerWidth > 1024 ? '2fr 1fr' : '1fr', 
        gap: '32px',
        alignItems: 'start'
      }}>
        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Current Module Content */}
          {trainingModules[currentModule] && (
            <div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                justifyContent: 'space-between', 
                marginBottom: '24px', 
                gap: '16px',
                flexWrap: 'wrap'
              }}>
                <div>
                  <h2 style={{ 
                    fontSize: '2rem', 
                    fontWeight: 'bold', 
                    color: '#111827', 
                    marginBottom: '8px',
                    lineHeight: '1.2'
                  }}>
                    {trainingModules[currentModule].title}
                  </h2>
                  <p style={{ color: '#6b7280', fontSize: '1rem' }}>
                    {trainingModules[currentModule].description}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
                    Step {currentStep + 1} of {trainingModules[currentModule].steps.length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                    {trainingModules[currentModule].duration} estimated
                  </div>
                </div>
              </div>
              
              {/* Step Progress */}
              <div style={{ marginBottom: '24px', display: 'flex', gap: '8px' }}>
                {trainingModules[currentModule].steps.map((_, idx) => (
                  <div 
                    key={idx}
                    style={{
                      flex: 1,
                      height: '8px',
                      borderRadius: '4px',
                      backgroundColor: idx <= currentStep ? '#2563eb' : '#e5e7eb',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </div>
              
              {/* Step Content */}
              <div style={{ 
                background: 'white', 
                borderRadius: '12px', 
                padding: '32px', 
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                border: '1px solid #f3f4f6'
              }}>
                <h3 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '600', 
                  marginBottom: '16px', 
                  color: '#111827' 
                }}>
                  {trainingModules[currentModule].steps[currentStep].title}
                </h3>
                <p style={{ 
                  color: '#6b7280', 
                  marginBottom: '24px', 
                  lineHeight: '1.6' 
                }}>
                  {trainingModules[currentModule].steps[currentStep].content}
                </p>
                
                {/* Interactive Content Based on Step Type */}
                {trainingModules[currentModule].steps[currentStep].type === 'interactive' && 
                 trainingModules[currentModule].steps[currentStep].title === 'Coach Profile Setup' && (
                  <div>
                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '0.875rem', 
                        fontWeight: '500', 
                        color: '#374151', 
                        marginBottom: '8px' 
                      }}>
                        Your Full Name
                      </label>
                      <input 
                        type="text" 
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          transition: 'all 0.2s ease',
                          background: 'white'
                        }}
                        placeholder="Enter your full name"
                        value={coachProfile.name}
                        onChange={(e) => setCoachProfile(prev => ({...prev, name: e.target.value}))}
                      />
                    </div>
                    
                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '0.875rem', 
                        fontWeight: '500', 
                        color: '#374151', 
                        marginBottom: '8px' 
                      }}>
                        Coaching Experience Level
                      </label>
                      <select 
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          background: 'white'
                        }}
                        value={coachProfile.experience}
                        onChange={(e) => setCoachProfile(prev => ({...prev, experience: e.target.value}))}
                      >
                        <option value="">Select your experience level</option>
                        <option value="new">New to coaching (0-1 years)</option>
                        <option value="some">Some coaching experience (1-3 years)</option>
                        <option value="experienced">Experienced coach (3+ years)</option>
                      </select>
                    </div>
                    
                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '0.875rem', 
                        fontWeight: '500', 
                        color: '#374151', 
                        marginBottom: '8px' 
                      }}>
                        Your Key Strengths (Select all that apply)
                      </label>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr',
                        gap: '12px' 
                      }}>
                        {['Academic Excellence', 'Student Motivation', 'Communication', 'Organization', 'Empathy', 'Leadership'].map(strength => (
                          <label key={strength} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            padding: '12px', 
                            border: '1px solid #e5e7eb', 
                            borderRadius: '8px', 
                            cursor: 'pointer',
                            background: 'white'
                          }}>
                            <input 
                              type="checkbox" 
                              style={{ width: '16px', height: '16px' }}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCoachProfile(prev => ({...prev, strengths: [...prev.strengths, strength]}));
                                } else {
                                  setCoachProfile(prev => ({...prev, strengths: prev.strengths.filter(s => s !== strength)}));
                                }
                              }}
                            />
                            <span style={{ fontSize: '0.875rem' }}>{strength}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => completeStep(trainingModules[currentModule].id, currentStep)}
                      disabled={!coachProfile.name || !coachProfile.experience}
                      style={{
                        width: '100%',
                        background: (!coachProfile.name || !coachProfile.experience) ? '#d1d5db' : '#2563eb',
                        color: 'white',
                        padding: '12px 24px',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: '500',
                        cursor: (!coachProfile.name || !coachProfile.experience) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Complete Profile Setup
                    </button>
                  </div>
                )}
                
                {/* Default Continue Button for other step types */}
                {!(trainingModules[currentModule].steps[currentStep].type === 'interactive' && 
                   trainingModules[currentModule].steps[currentStep].title === 'Coach Profile Setup') && (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <div style={{ margin: '0 auto 16px', display: 'flex', justifyContent: 'center' }}>
                      <icons.Lightbulb />
                    </div>
                    <button 
                      onClick={() => completeStep(trainingModules[currentModule].id, currentStep)}
                      style={{
                        background: '#2563eb',
                        color: 'white',
                        padding: '12px 24px',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Continue
                    </button>
                  </div>
                )}
              </div>
              
              {/* Navigation */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginTop: '32px',
                paddingTop: '24px',
                borderTop: '1px solid #f3f4f6'
              }}>
                <button 
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  style={{
                    padding: '12px 24px',
                    background: 'transparent',
                    color: currentStep === 0 ? '#d1d5db' : '#6b7280',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: currentStep === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Previous
                </button>
                
                <button 
                  onClick={() => {
                    if (currentStep < trainingModules[currentModule].steps.length - 1) {
                      setCurrentStep(currentStep + 1);
                    }
                  }}
                  disabled={currentStep === trainingModules[currentModule].steps.length - 1}
                  style={{
                    padding: '12px 24px',
                    background: currentStep === trainingModules[currentModule].steps.length - 1 ? '#d1d5db' : '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: currentStep === trainingModules[currentModule].steps.length - 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next Step
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Progress Dashboard */}
          <div style={{ 
            background: 'white', 
            borderRadius: '12px', 
            padding: '24px', 
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #f3f4f6'
          }}>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '600', 
              marginBottom: '20px', 
              color: '#111827' 
            }}>
              Your Progress
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '16px', 
              marginBottom: '24px' 
            }}>
              <div style={{ 
                textAlign: 'center', 
                padding: '16px', 
                background: '#f0f9ff',
                border: '1px solid #e0f2fe',
                borderRadius: '8px' 
              }}>
                <div style={{ margin: '0 auto 8px', display: 'flex', justifyContent: 'center', color: '#2563eb' }}>
                  <icons.BarChart3 />
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb', marginBottom: '4px' }}>
                  {Math.round(userProgress.overallProgress)}%
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Complete</div>
              </div>
              
              <div style={{ 
                textAlign: 'center', 
                padding: '16px', 
                background: '#fefce8',
                border: '1px solid #fef3c7',
                borderRadius: '8px' 
              }}>
                <div style={{ margin: '0 auto 8px', display: 'flex', justifyContent: 'center', color: '#d97706' }}>
                  <icons.Star />
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d97706', marginBottom: '4px' }}>
                  {userProgress.pointsEarned}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Points</div>
              </div>
              
              <div style={{ 
                textAlign: 'center', 
                padding: '16px', 
                background: '#f0fdf4',
                border: '1px solid #dcfce7',
                borderRadius: '8px' 
              }}>
                <div style={{ margin: '0 auto 8px', display: 'flex', justifyContent: 'center', color: '#16a34a' }}>
                  <icons.Zap />
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a', marginBottom: '4px' }}>
                  {userProgress.streakDays}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Day Streak</div>
              </div>
              
              <div style={{ 
                textAlign: 'center', 
                padding: '16px', 
                background: '#faf5ff',
                border: '1px solid #f3e8ff',
                borderRadius: '8px' 
              }}>
                <div style={{ margin: '0 auto 8px', display: 'flex', justifyContent: 'center', color: '#9333ea' }}>
                  <icons.Timer />
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#9333ea', marginBottom: '4px' }}>
                  {Math.floor(timeSpent / 60)}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Minutes</div>
              </div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '0.875rem', 
                color: '#6b7280', 
                marginBottom: '8px' 
              }}>
                <span>Overall Progress</span>
                <span>{Math.round(userProgress.overallProgress)}%</span>
              </div>
              <div style={{ 
                width: '100%', 
                height: '12px', 
                background: '#e5e7eb', 
                borderRadius: '6px', 
                overflow: 'hidden' 
              }}>
                <div 
                  style={{ 
                    height: '100%', 
                    background: 'linear-gradient(90deg, #2563eb, #7c3aed)', 
                    transition: 'width 0.3s ease',
                    width: `${userProgress.overallProgress}%`
                  }}
                />
              </div>
            </div>
          </div>
          
          {/* Module Navigation */}
          <div style={{ 
            background: 'white', 
            borderRadius: '12px', 
            padding: '24px', 
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #f3f4f6'
          }}>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '600', 
              marginBottom: '20px', 
              color: '#111827' 
            }}>
              Training Modules
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {trainingModules.map((module, index) => {
                const isCompleted = completedModules.has(module.id);
                const isActive = currentModule === index;
                const isLocked = !module.unlocked;
                
                return (
                  <div 
                    key={module.id}
                    onClick={() => !isLocked && setCurrentModule(index)}
                    style={{
                      position: 'relative',
                      padding: '20px',
                      border: `2px solid ${
                        isActive ? '#2563eb' : 
                        isCompleted ? '#16a34a' : 
                        isLocked ? '#e5e7eb' : '#e5e7eb'
                      }`,
                      borderRadius: '12px',
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      background: isActive ? '#f0f9ff' : 
                                isCompleted ? '#f0fdf4' : 
                                isLocked ? '#f9fafb' : 'white',
                      opacity: isLocked ? 0.6 : 1,
                      transform: isActive ? 'translateY(-2px)' : 'none',
                      boxShadow: isActive ? '0 4px 6px rgba(0, 0, 0, 0.1)' : 'none'
                    }}
                  >
                    {isLocked && (
                      <div style={{ position: 'absolute', top: '16px', right: '16px', color: '#9ca3af' }}>
                        <icons.Lock />
                      </div>
                    )}
                    {isCompleted && (
                      <div style={{ position: 'absolute', top: '16px', right: '16px', color: '#16a34a' }}>
                        <icons.CheckCircle />
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                      <div style={{
                        padding: '12px',
                        borderRadius: '8px',
                        flexShrink: 0,
                        background: isCompleted ? '#dcfce7' : 
                                  isActive ? '#dbeafe' : '#f3f4f6',
                        color: isCompleted ? '#16a34a' : 
                              isActive ? '#2563eb' : '#6b7280'
                      }}>
                        <module.icon />
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <h4 style={{ 
                          fontWeight: '600', 
                          color: '#111827', 
                          marginBottom: '8px', 
                          fontSize: '1rem' 
                        }}>
                          {module.title}
                        </h4>
                        <p style={{ 
                          color: '#6b7280', 
                          fontSize: '0.875rem', 
                          marginBottom: '12px', 
                          lineHeight: '1.4' 
                        }}>
                          {module.description}
                        </p>
                        
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          fontSize: '0.75rem', 
                          color: '#6b7280', 
                          marginBottom: '12px' 
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <icons.Clock />
                            <span>{module.duration}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <icons.Target />
                            <span>{module.steps.length} steps</span>
                          </div>
                        </div>
                        
                        <div style={{ 
                          width: '100%', 
                          height: '6px', 
                          background: '#e5e7eb', 
                          borderRadius: '3px', 
                          overflow: 'hidden' 
                        }}>
                          <div 
                            style={{ 
                              height: '100%', 
                              transition: 'width 0.3s ease',
                              width: `${isCompleted ? 100 : module.progress}%`,
                              background: isCompleted ? '#16a34a' : '#2563eb'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;