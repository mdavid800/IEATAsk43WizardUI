import React, { useState, useEffect } from 'react';
import { Wind, ArrowRight, CheckCircle, Users, Globe, BarChart3, ChevronDown, Github, ExternalLink, Code } from 'lucide-react';
import { Button } from './ui/button';

interface LandingPageProps {
  onStartForm: () => void;
}

export function LandingPage({ onStartForm }: LandingPageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <Wind className="w-8 h-8" />,
      title: "Digital Station Configuration",
      description: "Digitally represent the complete configuration of met masts, lidars, sodars, floating lidars, and solar measurement stations with precise location and equipment details."
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Comprehensive Measurement Tracking",
      description: "Track measurement heights, sensor specifications, mounting arrangements, logger configurations, and how these properties change over time."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Open Source Standard",
      description: "Built on the IEA Task 43 open source digital WRA data standard, enabling standardized data exchange across the renewable energy industry."
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Industry Collaboration",
      description: "Contribute to the development of industry-wide standards for wind and solar resource assessment data management and sharing."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        />
        <div 
          className="absolute top-1/2 -left-40 w-60 h-60 bg-gradient-to-br from-blue-400/20 to-green-400/20 rounded-full blur-3xl animate-pulse"
          style={{ transform: `translateY(${scrollY * 0.2}px)` }}
        />
        <div 
          className="absolute bottom-20 right-1/4 w-40 h-40 bg-gradient-to-br from-green-400/30 to-emerald-400/30 rounded-full blur-2xl animate-pulse"
          style={{ transform: `translateY(${scrollY * 0.1}px)` }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 via-transparent to-blue-600/5" />
        
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className={`space-y-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              {/* Logo/Brand */}
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg shadow-green-500/25">
                  <Wind className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">IEA Task 43</h1>
                  <p className="text-gray-600 text-sm">WRA Data Model</p>
                </div>
              </div>

              {/* Main Headline */}
              <div className="space-y-6">
                <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
                  Digital WRA
                  <span className="block bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Data Standard
                  </span>
                </h2>
                
                <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                  A proof of concept implementation of the IEA Task 43 digital Wind Resource Assessment data model. 
                  Standardize the digital representation of your measurement station configurations including met masts, 
                  lidars, sodars, floating lidars, and solar installations.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  onClick={onStartForm}
                  className="group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300 hover:scale-105"
                >
                  Try the Data Model
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <Button
                  variant="outline"
                  className="px-8 py-4 text-lg font-semibold rounded-2xl border-2 border-gray-200 hover:border-green-500 hover:text-green-600 transition-all duration-300 flex items-center gap-2"
                  onClick={() => window.open('https://github.com/IEA-Task-43/digital_wra_data_standard', '_blank')}
                >
                  <Github className="w-5 h-5" />
                  Data Standard Specification
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Right Content - Hero Image */}
            <div className={`relative transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="relative">
                {/* Glassmorphism Frame */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-white/30 shadow-2xl shadow-green-500/10" />
                
                {/* Image */}
                <div className="relative p-6">
                  <img
                    src="https://images.unsplash.com/photo-1548337138-e87d889cc369?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                    alt="Offshore wind farm with floating measurement platforms representing advanced WRA data collection systems"
                    className="w-full h-96 object-cover rounded-2xl shadow-xl"
                  />
                  
                  {/* Floating Cards */}
                  <div className="absolute -top-4 -left-4 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-gray-700">Data Collection</span>
                    </div>
                  </div>
                  
                  <div className="absolute -bottom-4 -right-4 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-medium text-gray-700">Standardized</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-gray-400" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              WRA Data Model Capabilities
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The WRA Data Model provides instructions for digitally representing measurement station configurations, 
              tracking equipment specifications, mounting arrangements, and temporal changes in setup.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative p-8 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  
                  <h4 className="text-xl font-semibold text-gray-900 mb-4">
                    {feature.title}
                  </h4>
                  
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Details Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              What the Data Model Captures
            </h3>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50">
            <div className="prose prose-lg mx-auto text-gray-700">
              <p className="text-lg leading-relaxed mb-6">
                The WRA Data Model implementation can contain comprehensive details including:
              </p>
              <ul className="space-y-3 text-base">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Precise latitude and longitude coordinates of measurement station installations</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Measurement heights and corresponding sensor specifications for each parameter</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Detailed sensor mounting arrangements and physical configurations</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Logger channel connections and programming parameters (slopes, offsets, calibration data)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Temporal tracking of configuration changes throughout measurement campaigns</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-3xl p-12 relative overflow-hidden">
            {/* Simple dot pattern background */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }} />
            </div>
            
            <div className="relative">
              <h3 className="text-4xl font-bold text-white mb-6">
                Ready to Explore the Data Model?
              </h3>
              
              <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
                Try this proof of concept implementation and contribute to the development of 
                standardized renewable energy measurement data formats.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Button
                  onClick={onStartForm}
                  className="group bg-white text-green-600 hover:bg-gray-50 px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Start Building Your Data Model
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <Button
                  variant="outline"
                  className="border-2 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white px-8 py-4 text-lg font-semibold rounded-2xl transition-all duration-300 flex items-center gap-2"
                  onClick={() => window.open('https://github.com/IEA-Task-43/digital_wra_data_standard', '_blank')}
                >
                  <Github className="w-5 h-5" />
                  Data Standard Specification
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>

              {/* App Source Code Section */}
              <div className="pt-8 border-t border-white/20">
                <h4 className="text-xl font-semibold text-white mb-4">
                  Open Source Form Builder Application
                </h4>
                <p className="text-green-100 mb-6 max-w-2xl mx-auto">
                  This form builder application is completely open source and available under MIT license. 
                  Download, modify, and use it freely for your own projects - no restrictions!
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    variant="outline"
                    className="border-2 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white px-6 py-3 font-semibold rounded-xl transition-all duration-300 flex items-center gap-2"
                    onClick={() => window.open('https://github.com/mdavid800/IEATAsk43WizardUI', '_blank')}
                  >
                    <Code className="w-5 h-5" />
                    Form Builder Source Code
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="border-2 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white px-6 py-3 font-semibold rounded-xl transition-all duration-300 flex items-center gap-2"
                    onClick={() => window.open('https://github.com/mdavid800/IEATAsk43WizardUI/archive/main.zip', '_blank')}
                  >
                    <Github className="w-5 h-5" />
                    Download ZIP
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-green-100/80 text-sm mt-4">
                  MIT License • Free to use commercially • Fork and customize as needed
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}