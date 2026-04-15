import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FileText, MapPin, Lock, Activity } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const CustomerDashboardNew = () => {
  const { auth, customerUser } = useAuth();
  const navigate = useNavigate();
  const dashboardRef = useRef(null);
  const heroRef = useRef(null);
  const imageBgRef = useRef(null);
  const cardsContainerRef = useRef(null);
  const cardRefs = useRef([]);
  const cursorRef = useRef(null);

  const customerName = customerUser?.policeholderName || 'Customer';

  // Protect route
  useEffect(() => {
    if (!auth.customer) {
      navigate('/', { replace: true });
    }
  }, [auth.customer, navigate]);

  // Inject Snellenberg-inspired CSS
  useEffect(() => {
    const styleId = 'customer-dashboard-styles';
    const existing = document.getElementById(styleId);
    if (existing) existing.remove();

    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
        .customer-dashboard,
        .customer-dashboard * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          cursor: none;
        }

        .customer-dashboard {
          background-color: #050505;
          color: #ffffff;
          font-family: "Helvetica Neue", "Neue Montreal", Helvetica, Arial, sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
        }

        .noise-overlay {
          position: fixed;
          inset: 0;
          z-index: 50;
          pointer-events: none;
          opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }

        .magnetic-wrap {
          display: inline-block;
        }

        .magnetic-inner {
          display: inline-block;
          pointer-events: none;
        }

        /* Custom Cursor */
        .custom-cursor {
          position: fixed;
          top: 0; left: 0;
          width: 14px; height: 14px;
          background-color: #ffffff;
          border-radius: 50%;
          pointer-events: none;
          z-index: 9999;
          mix-blend-mode: difference;
          transform: translate(-50%, -50%);
          transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1), height 0.4s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          color: black;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
          opacity: 1;
        }

        .custom-cursor.hovering {
          width: 80px;
          height: 80px;
          background-color: #ffffff;
          mix-blend-mode: normal;
          opacity: 1;
        }

        .hero-section {
          position: relative;
          width: 100vw;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 16vh 6vw 12vh 6vw;
          overflow: hidden;
        }

        .hero-bg-wrapper {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
        }

        .hero-bg-image {
          width: 100%;
          height: 130%;
          object-fit: cover;
          position: absolute;
          top: -15%;
          left: 0;
          will-change: transform;
          filter: brightness(0.9);
        }

        .hero-gradient-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(5,5,5,1) 0%, rgba(5,5,5,0.3) 50%, rgba(5,5,5,0.1) 100%);
          z-index: 1;
          pointer-events: none;
        }

        .hero-content {
          position: relative;
          z-index: 10;
          pointer-events: auto;
          max-width: 1100px;
          margin-top: -10vh;
        }

        .hero-greeting {
          font-size: clamp(3.5rem, 9vw, 9rem);
          font-weight: 500;
          line-height: 0.95;
          letter-spacing: -0.04em;
          margin-bottom: 2.5rem;
          color: #ffffff;
          opacity: 0;
        }

        .hero-subtext {
          font-size: clamp(1.1rem, 1.5vw, 1.4rem);
          color: rgba(255, 255, 255, 0.7);
          font-weight: 400;
          line-height: 1.5;
          max-width: 600px;
          margin-bottom: 0;
          opacity: 0;
        }

        /* Generic Section + Cards (LandingPage parity) */
        .section-layout {
          position: relative;
          padding: 20vh 6vw;
          background: #050505;
          z-index: 10;
        }

        .cards-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 40px;
          perspective: 1500px;
        }

        .tilt-card {
          padding: 56px 48px;
          border-radius: 24px;
          background: rgba(255,255,255,0.015);
          border: 1px solid rgba(255,255,255,0.04);
          transform-style: preserve-3d;
          will-change: transform;
        }

        .tilt-card-inner {
          transform: translateZ(40px);
        }

        .card-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: #ffffff;
          color: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 40px;
          transform: translateZ(60px);
        }

        .card-title {
          font-size: 1.8rem;
          font-weight: 500;
          margin-bottom: 16px;
          transform: translateZ(50px);
          letter-spacing: -0.02em;
        }

        .card-desc {
          color: rgba(255,255,255,0.5);
          font-weight: 400;
          font-size: 1.15rem;
          line-height: 1.6;
          transform: translateZ(30px);
          margin-bottom: 28px;
        }

        .card-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          font-size: 0.95rem;
          font-weight: 500;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          transition: opacity 0.3s ease;
          transform: translateZ(40px);
        }

        .tilt-card:hover .card-cta {
          opacity: 0.85;
        }

        /* About Us Section */
        .about-us-section {
          position: relative;
          padding: 15vh 6vw;
          background: #050505;
          overflow: hidden;
        }

        .about-title {
          font-size: clamp(3rem, 8vw, 5.5rem);
          font-weight: 500;
          letter-spacing: -0.03em;
          line-height: 1;
          margin-bottom: 3rem;
          color: #ffffff;
        }

        .about-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6vw;
          align-items: center;
        }

        .about-left p {
          font-size: 1.25rem;
          color: rgba(255,255,255,0.7);
          line-height: 1.6;
          max-width: 520px;
        }

        .hover-feature-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .hover-feature-item {
          padding: 32px 40px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 24px;
          position: relative;
          overflow: hidden;
          transition: transform 0.4s ease, border-color 0.4s ease;
        }

        .hover-feature-item::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, rgba(255,255,255,0.8), rgba(168,100,253,0.5), rgba(41,216,255,0.5), rgba(255,255,255,0));
          opacity: 0;
          transition: opacity 0.6s ease;
          z-index: 0;
        }

        .hover-feature-item:hover {
          transform: translateY(-8px);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .hover-feature-item:hover::before {
          opacity: 1;
          mix-blend-mode: overlay;
        }

        .feature-content {
          position: relative;
          z-index: 1;
        }

        .feature-content h4 {
          font-size: 1.5rem;
          font-weight: 500;
          margin-bottom: 12px;
          color: #ffffff;
          transition: color 0.4s ease, text-shadow 0.4s ease;
        }

        .hover-feature-item:hover .feature-content h4 {
          color: #000;
          text-shadow: 0 0 20px rgba(255,255,255,0.8);
        }

        .feature-content p {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.6;
          margin: 0;
          transition: color 0.4s ease, font-weight 0.4s ease;
        }

        .hover-feature-item:hover .feature-content p {
          color: #111;
          font-weight: 500;
        }

        /* Footer */
        .customer-footer {
          padding: 10vh 6vw 5vh 6vw;
          background: #000;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .footer-main-text {
          font-size: clamp(3rem, 8vw, 8rem);
          font-weight: 500;
          letter-spacing: -0.04em;
          margin-bottom: 10vh;
          color: #fff;
          line-height: 0.9;
        }

        .footer-main-text span {
          color: rgba(255, 255, 255, 0.2);
        }

        .footer-content {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 60px;
          margin-bottom: 10vh;
        }

        .footer-brand p {
          color: rgba(255, 255, 255, 0.5);
          font-size: 1.2rem;
          max-width: 400px;
          line-height: 1.6;
        }

        .footer-links {
          display: flex;
          gap: 100px;
          flex-wrap: wrap;
        }

        .link-group h4 {
          font-size: 0.9rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 32px;
          color: rgba(255, 255, 255, 0.4);
        }

        .link-group ul {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin: 0;
          padding: 0;
        }

        .link-group ul li a {
          color: #fff;
          text-decoration: none;
          font-size: 1.1rem;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: opacity 0.3s ease;
        }

        .link-group ul li a:hover {
          opacity: 0.7;
        }

        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 40px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.4);
          font-size: 1rem;
        }

        .social-links {
          display: flex;
          gap: 32px;
        }

        .social-links a {
          color: #fff;
          text-decoration: none;
          text-transform: uppercase;
          font-size: 0.9rem;
          letter-spacing: 1px;
          transition: opacity 0.3s ease;
        }

        .social-links a:hover {
          opacity: 0.7;
        }

        @media (max-width: 1024px) {
          .about-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .custom-cursor { display: none; }
          .customer-dashboard, .customer-dashboard * { cursor: auto !important; }

          .hero-section {
            padding: 12vh 24px 10vh 24px;
            justify-content: center;
          }

          .hero-content {
            margin-top: 80px;
          }

          .section-layout {
            padding: 12vh 24px;
          }

          .cards-container {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .tilt-card {
            padding: 44px 36px;
          }

          .about-us-section {
            padding: 12vh 24px;
          }

          .customer-footer {
            padding: 6vh 4vw;
          }

          .footer-content {
            gap: 40px;
          }

          .footer-links {
            gap: 40px;
            flex-direction: column;
          }

          .footer-bottom {
            flex-direction: column;
            gap: 20px;
            align-items: flex-start;
          }
        }
      `;
    document.head.appendChild(style);

    return () => {
      style.remove();
    };
  }, []);

  // GSAP staggered animations on mount
  useEffect(() => {
    if (!dashboardRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

    if (imageBgRef.current) {
      gsap.set(imageBgRef.current, { scale: 1.15 });
      gsap.to(imageBgRef.current, { scale: 1, duration: 2.2, ease: 'power2.out' });
    }

    // Animate hero greeting
    tl.fromTo(
      heroRef.current?.querySelector('.hero-greeting'),
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 1.2 },
      0
    );

    // Animate hero subtext
    tl.fromTo(
      heroRef.current?.querySelector('.hero-subtext'),
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1 },
      '-=0.8'
    );

    // 3D Tilt Logic
    const cleanupTilt = [];
    cardRefs.current.forEach(el => {
      if (!el) return;
      const handleMove = (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const xPct = x / rect.width - 0.5;
        const yPct = y / rect.height - 0.5;
        gsap.to(el, { rotateX: -yPct * 25, rotateY: xPct * 25, duration: 0.6, ease: 'power2.out' });
      };
      const handleLeave = () => {
        gsap.to(el, { rotateX: 0, rotateY: 0, duration: 1, ease: 'elastic.out(1, 0.3)' });
      };
      el.addEventListener('mousemove', handleMove);
      el.addEventListener('mouseleave', handleLeave);
      cleanupTilt.push(() => {
        el.removeEventListener('mousemove', handleMove);
        el.removeEventListener('mouseleave', handleLeave);
      });
    });

    // Custom Cursor tracking
    const cursor = cursorRef.current;
    const moveCursor = (e) => {
      if(cursor) gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.15, ease: 'power2.out' });
    };
    window.addEventListener('mousemove', moveCursor);

    // Hover states for dynamic cursor expanding
     const hoverElements = document.querySelectorAll('button, a, .magnetic-wrap, .tilt-card');
    hoverElements.forEach(el => {
      el.addEventListener('mouseenter', () => {
        if(cursor && el.classList.contains('tilt-card')) {
           cursor.classList.add('hovering');
           cursor.innerText = 'Drag';
        } else if (cursor && !el.classList.contains('tilt-card')) {
           cursor.classList.add('hovering');
           cursor.innerText = '';
        }
      });
      el.addEventListener('mouseleave', () => {
        if(cursor) {
           cursor.classList.remove('hovering');
           cursor.innerText = '';
        }
      });
    });

    // About Us Scroll Animations
    const aboutTitle = dashboardRef.current?.querySelector('.about-title');
    const aboutLeft = dashboardRef.current?.querySelector('.about-left p');
    const aboutFeatures = dashboardRef.current?.querySelectorAll('.hover-feature-item');

    if (aboutTitle) {
      gsap.fromTo(aboutTitle, { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 1.2, ease: 'power3.out',
        scrollTrigger: { trigger: aboutTitle, start: 'top 85%' }
      });
    }

    if (aboutLeft) {
      gsap.fromTo(aboutLeft, { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', delay: 0.2,
        scrollTrigger: { trigger: aboutLeft, start: 'top 85%' }
      });
    }

    if (aboutFeatures) {
      gsap.fromTo(aboutFeatures, { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 1, ease: 'power3.out',
        stagger: 0.2,
        scrollTrigger: { trigger: '.about-right', start: 'top 85%' }
      });
    }

    // Footer Scroll Animations
    const footerMainText = dashboardRef.current?.querySelector('.footer-main-text');
    const footerBrand = dashboardRef.current?.querySelector('.footer-brand');
    const footerLinkGroups = dashboardRef.current?.querySelectorAll('.link-group');

    if (footerMainText) {
      gsap.fromTo(footerMainText, { opacity: 0, y: 50 }, {
        opacity: 1, y: 0, duration: 1.5, ease: 'power4.out',
        scrollTrigger: { trigger: footerMainText, start: 'top 90%' }
      });
    }

    if (footerBrand) {
      gsap.fromTo(footerBrand, { opacity: 0, x: -30 }, {
        opacity: 1, x: 0, duration: 1.2, ease: 'power3.out',
        scrollTrigger: { trigger: '.footer-content', start: 'top 90%' }
      });
    }

    if (footerLinkGroups) {
      gsap.fromTo(footerLinkGroups, { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.15,
        scrollTrigger: { trigger: '.footer-links', start: 'top 90%' }
      });
    }

    // Reusable Magnetic Logic for hover effects
    const makeMagnetic = (el) => {
      const inner = el.querySelector('.magnetic-inner');
      const handleMove = (e) => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * 0.4;
        const y = (e.clientY - rect.top - rect.height / 2) * 0.4;
        gsap.to(el, { x, y, duration: 0.8, ease: 'power3.out' });
        if(inner) gsap.to(inner, { x: x * 0.5, y: y * 0.5, duration: 0.8, ease: 'power3.out' });
      };
      const handleLeave = () => {
        gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.3)' });
        if(inner) gsap.to(inner, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.3)' });
      };
      el.addEventListener('mousemove', handleMove);
      el.addEventListener('mouseleave', handleLeave);
      return () => {
        el.removeEventListener('mousemove', handleMove);
        el.removeEventListener('mouseleave', handleLeave);
      };
    };

    const cleanupMagnetic = [];
    document.querySelectorAll('.magnetic-wrap').forEach(el => {
      cleanupMagnetic.push(makeMagnetic(el));
    });

    return () => {
      tl.kill();
      cleanupTilt.forEach(cleanup => cleanup());
      cleanupMagnetic.forEach(fn => fn());
      window.removeEventListener('mousemove', moveCursor);
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  const cards = [
    {
      title: 'Track Active Claim',
      description: 'Monitor real-time status updates and settlement progress.',
      icon: <Activity size={28} />,
      action: () => navigate('/track'),
    },
    {
      title: 'File a New Claim',
      description: 'Start a new claim in minutes with our guided FNOL process.',
      icon: <FileText size={28} />,
      action: () => navigate('/claim'),
    },
    {
      title: 'Digital Policy Locker',
      description: 'View policy details, coverage limits, and expiry dates.',
      icon: <Lock size={28} />,
      action: () => navigate('/policy-locker'),
    },
    {
      title: 'Authorized Garage Locator',
      description: 'Find and request repairs at certified partner facilities.',
      icon: <MapPin size={28} />,
      action: () => navigate('/garages'),
    },
  ];

  return (
    <div
      className="customer-dashboard"
      ref={dashboardRef}
      style={{
        minHeight: '100vh',
        backgroundColor: '#050505',
        color: '#ffffff'
      }}
    >
      <div className="noise-overlay" />
      <div className="custom-cursor" ref={cursorRef} />

      {/* Hero Section */}
      <section className="hero-section" ref={heroRef}>
        <div className="hero-bg-wrapper">
          <img
            ref={imageBgRef}
            src="https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=2560"
            className="hero-bg-image"
            alt=""
          />
          <div className="hero-gradient-overlay" />
        </div>

        <div className="hero-content">
          <h1 className="hero-greeting">
            Hello <span className="nx-name-gradient">{customerName}</span>.
          </h1>
          <p className="hero-subtext">
            Manage your claims and policies with full transparency. Everything you need is right here.
          </p>
        </div>
      </section>

      {/* Cards Grid */}
      <section className="section-layout" id="overview">
        <div className="cards-container">
          {cards.map((card, index) => (
            <div
              key={index}
              className="tilt-card"
              ref={(el) => (cardRefs.current[index] = el)}
              onClick={card.action}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') card.action();
              }}
            >
              <div className="tilt-card-inner">
                <div className="card-icon">{card.icon}</div>
                <h3 className="card-title">{card.title}</h3>
                <p className="card-desc">{card.description}</p>
                <span className="card-cta">Explore →</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* About Us Section */}
      <section className="about-us-section" id="about">
        <div className="about-grid">
          <div className="about-left">
            <h2 className="about-title">Why Choose NexClaim</h2>
            <p>
              We're redefining insurance claims with transparency, speed, and intelligence. Every claim is processed with precision using advanced validation and seamless communication at every step.
            </p>
          </div>

          <div className="about-right">
            <div className="hover-feature-list">
              <div className="hover-feature-item magnetic-wrap" style={{ width: '100%' }}>
                <div className="feature-content magnetic-inner" style={{ width: '100%' }}>
                  <h4>Instant Processing</h4>
                  <p>Claims assessed and approved in real-time using AI-powered validation systems.</p>
                </div>
              </div>

              <div className="hover-feature-item magnetic-wrap" style={{ width: '100%' }}>
                <div className="feature-content magnetic-inner" style={{ width: '100%' }}>
                  <h4>Zero Paperwork</h4>
                  <p>Fully digital flow from initiation to settlement. No unnecessary documentation.</p>
                </div>
              </div>

              <div className="hover-feature-item magnetic-wrap" style={{ width: '100%' }}>
                <div className="feature-content magnetic-inner" style={{ width: '100%' }}>
                  <h4>24/7 Support</h4>
                  <p>Round-the-clock assistance with dedicated claim managers for every policyholder.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="customer-footer">
        <h1 className="footer-main-text">
          Your peace of mind. <span>Our commitment.</span>
        </h1>
        <div className="footer-content">
          <div className="footer-brand">
            <p>NexClaim brings intelligent, transparent insurance claim settlement to every policyholder. We believe in fairness, speed, and trust.</p>
          </div>
          <div className="footer-links">
            <div className="link-group">
              <h4>Product</h4>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#security">Security</a></li>
              </ul>
            </div>
            <div className="link-group">
              <h4>Company</h4>
              <ul>
                <li><a href="#about">About</a></li>
                <li><a href="#blog">Blog</a></li>
                <li><a href="#careers">Careers</a></li>
              </ul>
            </div>
            <div className="link-group">
              <h4>Legal</h4>
              <ul>
                <li><a href="#privacy">Privacy</a></li>
                <li><a href="#terms">Terms</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 NexClaim. All rights reserved.</p>
          <div className="social-links">
            <a href="#twitter">Twitter</a>
            <a href="#linkedin">LinkedIn</a>
            <a href="#instagram">Instagram</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerDashboardNew;
