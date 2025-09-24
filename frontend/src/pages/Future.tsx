import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { MessageSquare, Brain, Zap, Shield, Sparkles, ArrowRight, Play, Pause, RotateCcw } from 'lucide-react';
import ChatGPTInterface from '../components/modern/ChatGPTInterface';
import { CHATGPT_CONFIG } from '../config/chatgpt';
import './Future.css';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

const Future: React.FC = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [isLoaded, setIsLoaded] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [animationPhase, setAnimationPhase] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Initialize particles and animations
  useEffect(() => {
    const initializeParticles = () => {
      const newParticles: Particle[] = [];
      for (let i = 0; i < 50; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.8 + 0.2,
          color: ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'][Math.floor(Math.random() * 5)]
        });
      }
      setParticles(newParticles);
    };

    initializeParticles();
    setIsLoaded(true);

    // Start intro animation sequence
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Particle animation
  useEffect(() => {
    const animateParticles = () => {
      setParticles(prevParticles => 
        prevParticles.map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          opacity: 0.3 + Math.sin(Date.now() * 0.001 + particle.id) * 0.3,
          size: 1 + Math.sin(Date.now() * 0.002 + particle.id) * 2
        }))
      );
      animationRef.current = requestAnimationFrame(animateParticles);
    };

    if (isLoaded && showIntro) {
      animationRef.current = requestAnimationFrame(animateParticles);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isLoaded, showIntro]);

  // Phase animations
  useEffect(() => {
    const phaseTimer = setTimeout(() => {
      setAnimationPhase(prev => (prev + 1) % 4);
    }, 2000);

    return () => clearTimeout(phaseTimer);
  }, [animationPhase]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Add tab change animation
    setAnimationPhase(0);
  };

  if (showIntro) {
    return (
      <div className="future-intro-container">
        <div className="particle-canvas">
          {particles.map(particle => (
            <div
              key={particle.id}
              className="particle"
              style={{
                left: particle.x,
                top: particle.y,
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                opacity: particle.opacity,
                animationDelay: `${particle.id * 0.1}s`
              }}
            />
          ))}
        </div>
        
        <div className="intro-content">
          <div className={`intro-title ${isLoaded ? 'loaded' : ''}`}>
            <div className="title-main">
              <Sparkles className="title-icon" />
              <span>Future Technologies</span>
            </div>
            <div className="title-subtitle">AI-Powered Innovation Hub</div>
          </div>
          
          <div className={`intro-description ${isLoaded ? 'loaded' : ''}`}>
            <div className="description-text">
              Welcome to the next generation of business intelligence and automation.
              Experience cutting-edge AI capabilities that transform how you work.
            </div>
          </div>

          <div className={`intro-stats ${isLoaded ? 'loaded' : ''}`}>
            <div className="stat-item">
              <div className="stat-number">99.9%</div>
              <div className="stat-label">AI Accuracy</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Availability</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">∞</div>
              <div className="stat-label">Possibilities</div>
            </div>
          </div>

          <div className="loading-bar">
            <div className="loading-progress"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="future-page">
      {/* Animated Background */}
      <div className="animated-background">
        <div className="tech-grid"></div>
        <div className="floating-elements">
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`floating-element element-${i + 1}`}>
              <div className="element-content"></div>
            </div>
          ))}
        </div>
      </div>

      <div className="future-content">
        {/* Enhanced Header */}
        <div className="future-header">
          <div className="header-animation">
            <div className="header-icon-container">
              <Sparkles className="header-icon" />
              <div className="icon-glow"></div>
            </div>
            <div className="header-text">
              <h1 className="header-title">
                <span className="title-word">Future</span>
                <span className="title-word">Technologies</span>
              </h1>
              <p className="header-subtitle">
                AI-powered insights and next-generation capabilities
              </p>
            </div>
          </div>
          
          <div className="header-controls">
            <Button variant="outline" size="sm" className="control-btn">
              <Play className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="control-btn">
              <Pause className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="control-btn">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Main Content with Enhanced Animations */}
        <div className="main-content-container">
          <Card className="future-main-card">
            <CardHeader className="card-header-animated">
              <div className="card-header-content">
                <div className="header-badge">
                  <Brain className="w-5 h-5" />
                  <span>AI & Automation Hub</span>
                </div>
                <CardTitle className="card-title-animated">
                  Explore the Future of Business Intelligence
                </CardTitle>
                <p className="card-description">
                  Experience cutting-edge features and intelligent automation tools
                </p>
              </div>
            </CardHeader>
            
            <CardContent className="card-content-animated">
              <Tabs value={activeTab} onValueChange={handleTabChange} className="enhanced-tabs">
                <TabsList className="enhanced-tabs-list">
                  <TabsTrigger 
                    value="chat" 
                    className={`enhanced-tab ${activeTab === 'chat' ? 'active' : ''}`}
                  >
                    <MessageSquare className="tab-icon" />
                    <span>AI Chat</span>
                    <div className="tab-indicator"></div>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="ai-insights" 
                    className={`enhanced-tab ${activeTab === 'ai-insights' ? 'active' : ''}`}
                  >
                    <Brain className="tab-icon" />
                    <span>AI Insights</span>
                    <div className="tab-indicator"></div>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="automation" 
                    className={`enhanced-tab ${activeTab === 'automation' ? 'active' : ''}`}
                  >
                    <Zap className="tab-icon" />
                    <span>Automation</span>
                    <div className="tab-indicator"></div>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="security" 
                    className={`enhanced-tab ${activeTab === 'security' ? 'active' : ''}`}
                  >
                    <Shield className="tab-icon" />
                    <span>Security</span>
                    <div className="tab-indicator"></div>
                  </TabsTrigger>
                </TabsList>
                
                <div className="tab-content-container">
                  <TabsContent value="chat" className="enhanced-tab-content">
                    <div className="tab-intro">
                      <div className="tab-intro-content">
                        <div className="intro-icon">
                          <MessageSquare className="w-8 h-8" />
                        </div>
                        <div className="intro-text">
                          <h3>AI Assistant Chat</h3>
                          <p>Chat with our advanced AI assistant to get insights, analyze data, and get help with your business operations.</p>
                        </div>
                      </div>
                      <div className="intro-features">
                        <div className="feature-item">
                          <div className="feature-dot"></div>
                          <span>Real-time responses</span>
                        </div>
                        <div className="feature-item">
                          <div className="feature-dot"></div>
                          <span>Context-aware conversations</span>
                        </div>
                        <div className="feature-item">
                          <div className="feature-dot"></div>
                          <span>Business intelligence insights</span>
                        </div>
                      </div>
                    </div>
                    <div className="chat-container">
                      <ChatGPTInterface 
                        apiKey={CHATGPT_CONFIG.API_KEY}
                        className="enhanced-chat-interface"
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="ai-insights" className="enhanced-tab-content">
                    <div className="coming-soon-container">
                      <div className="coming-soon-animation">
                        <Brain className="coming-soon-icon" />
                        <div className="pulse-ring"></div>
                        <div className="pulse-ring delay-1"></div>
                        <div className="pulse-ring delay-2"></div>
                      </div>
                      <div className="coming-soon-content">
                        <h3>AI Insights Coming Soon!</h3>
                        <p>Advanced analytics, predictive modeling, and intelligent business recommendations powered by machine learning.</p>
                        <div className="feature-grid">
                          <div className="feature-card">
                            <div className="feature-card-icon">📊</div>
                            <h4>Predictive Analytics</h4>
                            <p>Forecast trends and patterns</p>
                          </div>
                          <div className="feature-card">
                            <div className="feature-card-icon">🎯</div>
                            <h4>Smart Recommendations</h4>
                            <p>AI-driven business insights</p>
                          </div>
                          <div className="feature-card">
                            <div className="feature-card-icon">📈</div>
                            <h4>Market Analysis</h4>
                            <p>Real-time market intelligence</p>
                          </div>
                          <div className="feature-card">
                            <div className="feature-card-icon">🔮</div>
                            <h4>Future Forecasting</h4>
                            <p>Predict future outcomes</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="automation" className="enhanced-tab-content">
                    <div className="coming-soon-container">
                      <div className="coming-soon-animation">
                        <Zap className="coming-soon-icon" />
                        <div className="lightning-bolt"></div>
                      </div>
                      <div className="coming-soon-content">
                        <h3>Automation Features Coming Soon!</h3>
                        <p>Streamline your workflows with intelligent automation, scheduled tasks, and smart business process optimization.</p>
                        <div className="feature-grid">
                          <div className="feature-card">
                            <div className="feature-card-icon">⚙️</div>
                            <h4>Workflow Automation</h4>
                            <p>Automate repetitive tasks</p>
                          </div>
                          <div className="feature-card">
                            <div className="feature-card-icon">⏰</div>
                            <h4>Smart Scheduling</h4>
                            <p>Intelligent task scheduling</p>
                          </div>
                          <div className="feature-card">
                            <div className="feature-card-icon">🔄</div>
                            <h4>Process Optimization</h4>
                            <p>Optimize business processes</p>
                          </div>
                          <div className="feature-card">
                            <div className="feature-card-icon">🤖</div>
                            <h4>AI Automation</h4>
                            <p>AI-powered automation</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="security" className="enhanced-tab-content">
                    <div className="coming-soon-container">
                      <div className="coming-soon-animation">
                        <Shield className="coming-soon-icon" />
                        <div className="shield-glow"></div>
                      </div>
                      <div className="coming-soon-content">
                        <h3>Enhanced Security Features Coming Soon!</h3>
                        <p>Protect your data with advanced security protocols, real-time threat detection, and comprehensive audit trails.</p>
                        <div className="feature-grid">
                          <div className="feature-card">
                            <div className="feature-card-icon">🛡️</div>
                            <h4>Threat Detection</h4>
                            <p>Real-time security monitoring</p>
                          </div>
                          <div className="feature-card">
                            <div className="feature-card-icon">📋</div>
                            <h4>Audit Trails</h4>
                            <p>Comprehensive activity logs</p>
                          </div>
                          <div className="feature-card">
                            <div className="feature-card-icon">🔐</div>
                            <h4>Advanced Encryption</h4>
                            <p>End-to-end data protection</p>
                          </div>
                          <div className="feature-card">
                            <div className="feature-card-icon">🚨</div>
                            <h4>Alert System</h4>
                            <p>Instant security notifications</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Future;