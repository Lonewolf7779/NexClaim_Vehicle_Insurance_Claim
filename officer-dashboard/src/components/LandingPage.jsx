import React, { useEffect, useRef } from 'react';
import { Zap, ArrowRight, ShieldCheck, Activity, CheckCircle2, ArrowUpRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const SplitTextReveal = ({ text, className }) => {
  return (
    <h2 className={`split-text-target ${className || ''}`}>
      {text.split(' ').map((word, i) => (
        <span
          key={i}
          className="word-mask"
          style={{
            display: 'inline-block',
            overflow: 'hidden',
            verticalAlign: 'top',
            marginTop: '-0.05em',
            marginRight: '0.25em',
            paddingTop: '0.18em',
            paddingBottom: '0.34em',
            marginBottom: '-0.18em'
          }}
        >
          <span className="word-inner" style={{ display: 'inline-block', transform: 'translateY(120%)', transformOrigin: 'top left', willChange: 'transform' }}>
            {word}
          </span>
        </span>
      ))}
    </h2>
  );
};

const LandingPage = ({ onAction, onLoginClick }) => {
  const masterRef = useRef(null);
  const cursorRef = useRef(null);
  const imageBgRef = useRef(null);
  const parallaxImgRef2 = useRef(null);
  const marqueeRef = useRef(null);
  
  const { auth, customerUser, logoutCustomer } = useAuth();
  const navigate = useNavigate();

  const customerName = customerUser?.name || customerUser?.policeholderName || 'Customer'

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      * { margin: 0; padding: 0; box-sizing: border-box; cursor: none; }
      body {
        background-color: #050505;
        color: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        overflow-x: hidden;
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
        display: flex; align-items: center; justify-content: center;
        color: black; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; opacity: 1;
      }
      .custom-cursor.hovering {
        width: 80px; height: 80px;
        background-color: #ffffff;
        mix-blend-mode: normal;
        opacity: 1;
      }

      .noise-overlay {
        position: fixed; inset: 0; z-index: 50; pointer-events: none; opacity: 0.035;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
      }

      /* Navigation */
      .premium-nav {
        position: fixed; top: 0; left: 0; right: 0; padding: 40px 6vw; display: flex; justify-content: space-between; align-items: center; z-index: 1000; mix-blend-mode: difference;
      }
      .nav-brand { font-size: 1.5rem; font-weight: 600; letter-spacing: -0.02em; }
      .nav-right-text { font-size: 1rem; font-weight: 400; color: rgba(255, 255, 255, 0.8); }

      /* Magnetic Wrapper */
      .magnetic-wrap { display: inline-block; }
      .magnetic-inner { display: inline-block; pointer-events: none; }

      /* Hero Section */
      .hero-section {
        position: relative; width: 100vw; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; padding: 16vh 6vw 12vh 6vw; overflow: visible; isolation: isolate;
      }
      .hero-bg-wrapper { position: absolute; inset: 0; z-index: 1; overflow: hidden; }
      .hero-bg-image { width: 100%; height: 130%; object-fit: cover; position: absolute; top: -15%; left: 0; will-change: transform; filter: brightness(0.9); }
      .hero-gradient-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(5,5,5,1) 0%, rgba(5,5,5,0.3) 50%, rgba(5,5,5,0.1) 100%); z-index: 2; pointer-events: none; }
      
      .hero-content { position: relative; z-index: 120; pointer-events: auto; max-width: 1100px; margin-top: -10vh; }
      .hero-title { font-size: clamp(3.5rem, 9vw, 9rem); font-weight: 500; line-height: 1.02; letter-spacing: -0.04em; margin-bottom: 2.5rem; overflow: visible; }
      
      .hero-subtext { font-size: clamp(1.1rem, 1.5vw, 1.4rem); color: rgba(255, 255, 255, 0.7); line-height: 1.5; max-width: 600px; margin-bottom: 4rem; }

      /* Buttons */
      .button-group { display: flex; gap: 24px; align-items: center; margin-bottom: 4vh; }
      .btn {
        border: none; padding: 24px 40px; border-radius: 100px; font-size: 1.1rem; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 12px; position: relative; overflow: hidden; text-transform: uppercase; letter-spacing: 1px; font-size: 0.9rem;
      }
      .btn-primary { background: #ffffff; color: #050505; }
      .btn-secondary { background: rgba(255, 255, 255, 0.05); color: #ffffff; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); }
      .btn-icon { width: 44px; height: 44px; background: rgba(0,0,0,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
      .btn-secondary .btn-icon { background: rgba(255,255,255,0.1); }

      /* Marquee */
      .marquee-section { padding: 8vh 0 6vh 0; background: #050505; white-space: nowrap; overflow: hidden; display: flex; align-items: center; }
      .marquee-content { display: inline-flex; font-size: clamp(2rem, 4vw, 4rem); font-weight: 300; letter-spacing: -0.02em; text-transform: uppercase; color: #fff; padding-right: 2rem; }
      .marquee-content span { padding: 0 2rem; opacity: 0.4; }
      .marquee-content span.highlight { opacity: 1; -webkit-text-stroke: 1px #fff; color: transparent; }

      /* Generic Section */
      .section-layout { position: relative; padding: 20vh 6vw; background: #050505; z-index: 10; }
      .section-header { font-size: clamp(3rem, 6vw, 5.5rem); font-weight: 400; letter-spacing: -0.03em; line-height: 1; margin-bottom: 6rem; max-width: 900px; }

      /* Grid Cards with 3D Tilt */
      .cards-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 40px; perspective: 1500px; }
      .tilt-card {
        padding: 56px 48px; border-radius: 24px; background: rgba(255,255,255,0.015); border: 1px solid rgba(255,255,255,0.04);
        transform-style: preserve-3d;
        will-change: transform;
      }
      .tilt-card-inner { transform: translateZ(40px); }
      .card-icon { width: 72px; height: 72px; border-radius: 50%; background: #ffffff; color: #000; display: flex; align-items: center; justify-content: center; margin-bottom: 40px; transform: translateZ(60px); }
      .card-title { font-size: 1.8rem; font-weight: 500; margin-bottom: 16px; transform: translateZ(50px); letter-spacing: -0.02em; }
      .card-desc { color: rgba(255,255,255,0.5); font-weight: 400; font-size: 1.15rem; line-height: 1.6; transform: translateZ(30px); }

      /* About/Why Choose Us Section */
      .about-us-section {
        position: relative;
        padding: 15vh 6vw;
        background: #050505;
        overflow: hidden;
      }
      .about-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6vw;
        align-items: center;
      }
      .about-left h2 {
        font-size: clamp(3rem, 6vw, 5.5rem);
        font-weight: 500;
        line-height: 1;
        letter-spacing: -0.03em;
        margin-bottom: 2rem;
      }
      .about-left p {
        font-size: 1.25rem;
        color: rgba(255,255,255,0.7);
        line-height: 1.6;
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
        border-color: rgba(255,255,255,0.3);
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
      }
      .feature-content p {
        font-size: 1rem;
        color: rgba(255,255,255,0.5);
        line-height: 1.5;
        transition: color 0.4s ease;
      }
      .hover-feature-item:hover .feature-content p {
        color: rgba(255,255,255,0.9);
      }
      .hover-feature-item:hover .feature-content h4 {
        color: #000;
        text-shadow: 0 0 20px rgba(255,255,255,0.8);
      }
      .hover-feature-item:hover .feature-content p {
        color: #111;
        font-weight: 500;
      }

      /* Huge Image Section */
      .impact-section { padding: 0 6vw 20vh 6vw; }
      .impact-image-wrapper { width: 100%; height: 80vh; border-radius: 32px; overflow: hidden; position: relative; background: #111; }
      .impact-image { width: 100%; height: 130%; object-fit: cover; position: absolute; top: -15%; opacity: 0.7; }
      .impact-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
      .impact-stat { font-size: clamp(5rem, 15vw, 15rem); font-weight: 500; color: #fff; line-height: 1; margin-bottom: 1rem; letter-spacing: -0.05em; }
      .impact-label { font-size: clamp(1.2rem, 2vw, 2rem); color: rgba(255,255,255,0.8); font-weight: 300; }

      /* Footer */
      .premium-footer { padding: 10vh 6vw 5vh 6vw; background: #000; border-top: 1px solid rgba(255,255,255,0.05); }
      .footer-main-text { font-size: clamp(3rem, 8vw, 8rem); font-weight: 500; letter-spacing: -0.04em; margin-bottom: 10vh; color: #fff; line-height: 0.9; }
      .footer-main-text span { color: rgba(255,255,255,0.2); }
      
      .footer-content { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 60px; margin-bottom: 10vh; }
      .footer-brand p { color: rgba(255,255,255,0.5); font-size: 1.2rem; max-width: 400px; line-height: 1.6; }
      .footer-links { display: flex; gap: 100px; flex-wrap: wrap; }
      .link-group h4 { font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 32px; color: rgba(255,255,255,0.4); }
      .link-group ul { list-style: none; display: flex; flex-direction: column; gap: 20px; }
      .link-group ul li a { color: #fff; text-decoration: none; font-size: 1.1rem; display: inline-flex; align-items: center; gap: 4px; }
      .link-group ul li a:hover { opacity: 0.7; }

      .footer-bottom { display: flex; justify-content: space-between; align-items: center; padding-top: 40px; border-top: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.4); font-size: 1rem; }
      .social-links { display: flex; gap: 32px; }
      .social-links a { color: #fff; text-decoration: none; text-transform: uppercase; font-size: 0.9rem; letter-spacing: 1px; }

      @media (max-width: 900px) {
        .about-grid { grid-template-columns: 1fr; }
      }

      @media (max-width: 768px) {
        .custom-cursor { display: none; }
        * { cursor: auto !important; }
        .premium-nav { padding: 24px; }
        .hero-section { padding: 12vh 24px 10vh 24px; justify-content: center; }
        .hero-content { margin-top: 80px; }
        .hero-title { margin-top: 0px; }
        .button-group { flex-direction: column; width: 100%; }
        .btn { width: 100%; justify-content: center; }
        .section-layout { padding: 12vh 24px; }
        .impact-section { padding: 0 24px 10vh 24px; }
        .footer-links { gap: 40px; flex-direction: column; }
        .footer-bottom { flex-direction: column; gap: 20px; align-items: flex-start; }
      }
    `;
    document.head.appendChild(style);

    const tl = gsap.timeline({ defaults: { ease: 'power4.out' }, delay: 0.1 });

    // Hero Entry Animation
    gsap.set('.word-inner', { y: '120%' });
    gsap.set('.hero-subtext', { opacity: 0, y: 30 });
    gsap.set('.btn', { opacity: 0, y: 30 });
    gsap.set(imageBgRef.current, { scale: 1.15 });

    tl.to(imageBgRef.current, { scale: 1, duration: 2.2, ease: 'power3.inOut' })
      .to('.hero-title .word-inner', { y: '0%', duration: 1.2, stagger: 0.08, ease: 'power4.out' }, "-=1.5")
      .to('.hero-subtext', { opacity: 1, y: 0, duration: 1 }, "-=0.8")
      .to('.btn', { opacity: 1, y: 0, duration: 1, stagger: 0.1 }, "-=0.8");

    // Scroll Parallax for massive images
    gsap.to(imageBgRef.current, {
      y: '25%', ease: 'none',
      scrollTrigger: { trigger: '.hero-section', start: 'top top', end: 'bottom top', scrub: true }
    });
    if(parallaxImgRef2.current) {
      gsap.to(parallaxImgRef2.current, {
        y: '25%', ease: 'none',
        scrollTrigger: { trigger: '.impact-image-wrapper', start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }

    // Impact Counter Animation
    const counter = document.querySelector('.impact-stat .count');
    if(counter) {
      ScrollTrigger.create({
        trigger: '.impact-section',
        start: 'top 80%',
        once: true,
        onEnter: () => {
          gsap.fromTo(counter, { innerHTML: 0 }, {
            innerHTML: 99,
            duration: 3,
            ease: 'power3.out',
            snap: { innerHTML: 1 }
          });
        }
      });
    }

    // Section Reveals (Text Split Stagger)
    document.querySelectorAll('.split-text-target').forEach((header) => {
      if(!header.closest('.hero-section')) {
        gsap.to(header.querySelectorAll('.word-inner'), {
          y: '0%', duration: 1, stagger: 0.05, ease: 'power3.out',
          scrollTrigger: { trigger: header, start: 'top 85%' }
        });
      }
    });

    // Tilt Cards Reveal
    gsap.utils.toArray('.tilt-card').forEach((card, i) => {
      gsap.fromTo(card, { opacity: 0, y: 60 }, {
        opacity: 1, y: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: card, start: 'top 90%' }
      });
    });

    // Infinite Marquee
    if (marqueeRef.current) {
      const w = marqueeRef.current.offsetWidth / 2;
      gsap.fromTo(marqueeRef.current, 
        { x: 0 }, 
        { x: -w, duration: 20, ease: 'none', repeat: -1 }
      );
    }

    // --- INTERACTIVITY: Cursor & Magnetic Features ---
    const cursor = cursorRef.current;
    
    // 1. Mouse Follower
    const moveCursor = (e) => {
      gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.15, ease: 'power2.out' });
    };
    window.addEventListener('mousemove', moveCursor);

    // 2. Hover states for dynamic cursor expanding
    const hoverElements = document.querySelectorAll('button, a, .magnetic-wrap, .tilt-card');
    hoverElements.forEach(el => {
      el.addEventListener('mouseenter', () => {
        if(cardHoveringActive && el.classList.contains('tilt-card')) {
           cursor.classList.add('hovering');
           cursor.innerText = 'Drag'; // Or read from data-cursor
        } else if (!el.classList.contains('tilt-card')) {
           cursor.classList.add('hovering');
           cursor.innerText = '';
        }
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('hovering');
        cursor.innerText = '';
      });
    });

    // 3. Reusable Magnetic Logic
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

    // 4. 3D Tilt Logic
    let cardHoveringActive = true;
    const cleanupTilt = [];
    document.querySelectorAll('.tilt-card').forEach(el => {
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


    return () => {
      document.head.removeChild(style);
      window.removeEventListener('mousemove', moveCursor);
      ScrollTrigger.getAll().forEach(t => t.kill());
      tl.kill();
      cleanupMagnetic.forEach(fn => fn());
      cleanupTilt.forEach(fn => fn());
    };
  }, []);

  return (
    <div className="master-wrapper" ref={masterRef}>
      <div className="noise-overlay" />
      <div className="custom-cursor" ref={cursorRef} />

      <nav className="premium-nav">
        <a href="#" className="magnetic-wrap nav-brand" style={{ textDecoration: 'none', color: '#fff', display: 'none' }}>
          <span className="magnetic-inner">NexClaim</span>
        </a>
        {auth.customer && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <div
              className="btn btn-secondary"
              style={{ padding: '14px 22px', fontSize: '0.85rem', fontWeight: 600 }}
            >
              <span style={{ opacity: 0.7 }}>Welcome</span>
              <span
                className="nx-name-gradient"
                style={{ fontWeight: 700, letterSpacing: '-0.01em', textTransform: 'none' }}
              >
                {customerName}
              </span>
            </div>

            <div
              className="magnetic-wrap"
              onClick={() => navigate('/customer-dashboard')}
              style={{ cursor: 'pointer' }}
            >
              <span className="btn btn-primary magnetic-inner" style={{ padding: '16px 32px', fontSize: '0.85rem', fontWeight: 600 }}>
                ENTER DASHBOARD <ArrowRight size={16} />
              </span>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="hero-section">
        <div className="hero-bg-wrapper">
          <img
            ref={imageBgRef}
            src="https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=2560"
            className="hero-bg-image"
            alt="Cyberpunk Neon City"
          />
          <div className="hero-gradient-overlay" />
        </div>

        <div className="hero-content">
          <SplitTextReveal text="Peace of mind. Restored instantly." className="hero-title" />

          <p className="hero-subtext">
            The next generation of vehicle insurance. Powered by vision models and cryptography to settle claims instantly without paperwork or surveyor delays.
          </p>

          <div className="button-group">
            {auth.customer ? (
              <>
                <button className="magnetic-wrap btn btn-primary" onClick={() => navigate('/customer-dashboard')} style={{ paddingLeft: '60px', paddingRight: '60px' }}>
                  <span className="magnetic-inner" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    ENTER DASHBOARD <div className="btn-icon"><ArrowRight size={20} /></div>
                  </span>
                </button>

                <button
                  className="magnetic-wrap btn btn-secondary"
                  type="button"
                  onClick={() => {
                    logoutCustomer()
                    navigate('/', { replace: true })
                  }}
                  style={{ paddingLeft: '44px', paddingRight: '44px' }}
                >
                  <span className="magnetic-inner" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    LOGOUT <div className="btn-icon"><ArrowUpRight size={20} /></div>
                  </span>
                </button>
              </>
            ) : (
              <button className="magnetic-wrap btn btn-primary" onClick={onLoginClick} style={{ paddingLeft: '60px', paddingRight: '60px' }}>
                <span className="magnetic-inner" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  LOGIN / ACCESS PORTAL <div className="btn-icon"><ArrowRight size={20} /></div>
                </span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Marquee Banner */}
      <section className="marquee-section">
        <div className="marquee-content" ref={marqueeRef}>
           {/* Doubled for seamless loop */}
           <span>Zero Paperwork</span> <span className="highlight">•</span>
           <span>Instant Settlement</span> <span className="highlight">•</span>
           <span>AI Validation</span> <span className="highlight">•</span>
           <span>24/7 Support</span> <span className="highlight">•</span>
           <span>Trully Cashless</span> <span className="highlight">•</span>
           <span>Zero Paperwork</span> <span className="highlight">•</span>
           <span>Instant Settlement</span> <span className="highlight">•</span>
           <span>AI Validation</span> <span className="highlight">•</span>
           <span>24/7 Support</span> <span className="highlight">•</span>
           <span>Trully Cashless</span> <span className="highlight">•</span>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="section-layout">
        <SplitTextReveal text="Redefining trust with speed, transparency & machine intelligence." className="section-header" />

        <div className="cards-container">
          <div className="tilt-card">
            <div className="tilt-card-inner">
              <div className="card-icon"><ShieldCheck size={32} /></div>
              <h3 className="card-title">Cryptographic Security</h3>
              <p className="card-desc">Your policies and personal data are protected by bank-level encryption, ensuring complete privacy during processing.</p>
            </div>
          </div>

          <div className="tilt-card">
            <div className="tilt-card-inner">
              <div className="card-icon"><Zap size={32} /></div>
              <h3 className="card-title">AI Damage Analysis</h3>
              <p className="card-desc">Our vision models instantly analyze vehicle damages from your uploaded photos, bypassing days of manual inspection.</p>
            </div>
          </div>

          <div className="tilt-card">
            <div className="tilt-card-inner">
              <div className="card-icon"><Activity size={32} /></div>
              <h3 className="card-title">Real-Time Ledger</h3>
              <p className="card-desc">Every status update, surveyor note, and settlement is recorded on an immutable ledger accessible to you instantly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Us / Why Choose Us */}
      <section className="about-us-section">
        <div className="about-grid">
          <div className="about-left">
            <SplitTextReveal text="Why choose NexClaim?" />
            <p style={{ marginTop: '2rem' }}>
              We aren't just an insurance provider; we are a technology-first protection ecosystem. 
              By removing manual surveyor checks and excessive documentation, we offer unparalleled speed 
              when you need it the most.
            </p>
          </div>
          
          <div className="about-right">
            <div className="hover-feature-list">
              <div className="hover-feature-item magnetic-wrap" style={{width: '100%'}}>
                <div className="feature-content magnetic-inner" style={{width: '100%'}}>
                  <h4>0% Depreciation on Repairs</h4>
                  <p>In the event of an accident, you won't pay a single rupee out of pocket for plastic, glass, or rubber parts.</p>
                </div>
              </div>
              
              <div className="hover-feature-item magnetic-wrap" style={{width: '100%'}}>
                <div className="feature-content magnetic-inner" style={{width: '100%'}}>
                  <h4>24/7 Roadside Assistance</h4>
                  <p>Flat battery? Empty tank? Major breakdown? Our network responds in under 30 minutes nationwide.</p>
                </div>
              </div>
              
              <div className="hover-feature-item magnetic-wrap" style={{width: '100%'}}>
                <div className="feature-content magnetic-inner" style={{width: '100%'}}>
                  <h4>Instant Payout Integration</h4>
                  <p>When claims are approved, the funds are deposited directly via UPI and NEFT in seconds, bypassing bank queues.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Image Section */}
      <section className="impact-section">
        <div className="impact-image-wrapper">
          <img 
            ref={parallaxImgRef2}
            src="https://images.unsplash.com/photo-1617469165786-8007eda3caa7?q=80&w=2670&auto=format&fit=crop" 
            alt="Impact Background"
            className="impact-image"
          />
          <div className="impact-overlay">
            <h2 className="impact-stat"><span className="count">0</span>%</h2>
            <p className="impact-label">Settlement approval rate within 2 hours</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="premium-footer">
        <h2 className="footer-main-text">Looking forward to <br/><span>safeguard your journey.</span></h2>
        
        <div className="footer-content">
          <div className="footer-brand">
            <p>Pioneering the future of digital-first autonomous insurance claims. Redefining what it means to be protected.</p>
          </div>
          
          <div className="footer-links">
            <div className="link-group">
              <h4>Insurance</h4>
              <ul>
                <li className="magnetic-wrap"><a href="#" className="magnetic-inner">Car Insurance <ArrowUpRight size={16}/></a></li>
                <li className="magnetic-wrap"><a href="#" className="magnetic-inner">Bike Insurance <ArrowUpRight size={16}/></a></li>
                <li className="magnetic-wrap"><a href="#" className="magnetic-inner">Commercial <ArrowUpRight size={16}/></a></li>
                <li className="magnetic-wrap"><a href="#" className="magnetic-inner">EV Protect <ArrowUpRight size={16}/></a></li>
              </ul>
            </div>
            <div className="link-group">
              <h4>Support</h4>
              <ul>
                <li className="magnetic-wrap"><a href="#" className="magnetic-inner">Track Claim <ArrowUpRight size={16}/></a></li>
                <li className="magnetic-wrap"><a href="#" className="magnetic-inner">Network Garages <ArrowUpRight size={16}/></a></li>
                <li className="magnetic-wrap"><a href="#" className="magnetic-inner">FAQs <ArrowUpRight size={16}/></a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} NexClaim Tech Pvt Ltd. All rights reserved.</p>
          <div className="social-links">
            <a href="#" className="magnetic-wrap"><span className="magnetic-inner">Twitter</span></a>
            <a href="#" className="magnetic-wrap"><span className="magnetic-inner">Instagram</span></a>
            <a href="#" className="magnetic-wrap"><span className="magnetic-inner">LinkedIn</span></a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;