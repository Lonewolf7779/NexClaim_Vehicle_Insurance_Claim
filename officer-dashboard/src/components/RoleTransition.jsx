import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';

const RoleTransition = ({ roleName, children, isAfterLogin = false }) => {
  const [show, setShow] = useState(true);
  const containerRef = useRef(null);
  
  const textRef1 = useRef(null);
  const innerTextRef1 = useRef(null);
  
  const textRef2 = useRef(null);
  const innerTextRef2 = useRef(null);

  const loaderRef = useRef(null);
  const leftEyeRef = useRef(null);
  const rightEyeRef = useRef(null);
  const mouthRef = useRef(null);


  // Trigger entry animation
  useEffect(() => {
    if (isAfterLogin) return; // Skip if it's the after-login state

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    let ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          setShow(false);
          document.body.style.overflow = originalOverflow;
        }
      });

      // Initial states
      gsap.set(innerTextRef1.current, { y: '100%' });
      gsap.set(innerTextRef2.current, { y: '100%' });
      gsap.set(containerRef.current, { y: '0%' });

      // 1. Sweep up "Welcome" text smoothly
      tl.to(innerTextRef1.current, {
        y: '0%',
        duration: 0.5,
        ease: 'expo.out',
        delay: 0.05
      })
      .to(innerTextRef1.current, {
        y: '-100%',
        duration: 0.4,
        ease: 'expo.in',
        delay: 0.15
      })
      .set(textRef1.current, { display: 'none' })
      .to(innerTextRef2.current, {
        y: '0%',
        duration: 0.5,
        ease: 'expo.out'
      }, "-=0.1")
      .to(innerTextRef2.current, {
        y: '-100%',
        duration: 0.4,
        ease: 'expo.in',
        delay: 0.2
      });

      // Cinematic heavy lift removal
      tl.to(containerRef.current, {
        y: '-100vh',
        borderBottomLeftRadius: '50% 20vh',
        borderBottomRightRadius: '50% 20vh',
        duration: 1.1,
        ease: 'power4.inOut',
      }, "-=0.1");
    });

    return () => {
      document.body.style.overflow = originalOverflow;
      ctx.revert();
    };
  }, []);

  // Trigger post-login animation
  useEffect(() => {
    if (!isAfterLogin) return;

    setShow(true); // Bring loader back
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    let ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          // login() unmounts component
        }
      });

      // Instantly drop the curtain down
      gsap.set(containerRef.current, { 
        y: '0%', 
        borderBottomLeftRadius: '0%', 
        borderBottomRightRadius: '0%' 
      });
      gsap.set(textRef1.current, { display: 'none' });
      gsap.set(textRef2.current, { display: 'none' });
      gsap.set(loaderRef.current, { display: 'flex', opacity: 1, y: 0 });

      // Cute smiley face animation
      tl.to([leftEyeRef.current, rightEyeRef.current], {
        scaleY: 0.1,
        duration: 0.15,
        repeat: 3,
        yoyo: true,
        transformOrigin: 'center',
        ease: 'power1.inOut',
        delay: 0.2
      })
      .to(mouthRef.current, {
        attr: { d: 'M20 36 Q32 46 44 36' },
        duration: 0.4,
        ease: 'back.out(1.7)'
      }, "-=0.3")
      .to(loaderRef.current, {
        y: -20,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        delay: 0.3
      })
      // Heavy lift out to reveal dashboard!
      .to(containerRef.current, {
        y: '-100vh',
        borderBottomLeftRadius: '50% 20vh',
        borderBottomRightRadius: '50% 20vh',
        duration: 1.1,
        ease: 'power4.inOut',
      }, "-=0.1");
    });

    return () => {
      document.body.style.overflow = originalOverflow;
      ctx.revert();
    };
  }, [isAfterLogin]);


  return (
    <>
      <div style={{ opacity: show ? 0 : 1, transition: 'opacity 0.6s ease', pointerEvents: show ? 'none' : 'auto' }}>
        {children}
      </div>

      
        <div
          ref={containerRef}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: '#111111',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            willChange: 'transform'
          }}
        >
          {/* Container 1: Welcome */}
          <div ref={textRef1} style={{ overflow: 'hidden', position: 'absolute' }}>
            <div
              ref={innerTextRef1}
              style={{
                fontFamily: '"Helvetica Neue", "Neue Montreal", Helvetica, Arial, sans-serif',
                fontSize: '3rem',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                color: '#ffffff'
              }}
            >
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#fff', opacity: 0.6, marginTop: '4px' }} />
              Welcome
            </div>
          </div>

          {/* Container 2: Role Name */}
          <div ref={textRef2} style={{ overflow: 'hidden', position: 'absolute' }}>
            <div
              ref={innerTextRef2}
              style={{
                fontFamily: '"Helvetica Neue", "Neue Montreal", Helvetica, Arial, sans-serif',
                fontSize: '4rem',
                fontWeight: 500,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                background: 'linear-gradient(45deg, #ffffff, #999999)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              {roleName}
            </div>
          </div>
          
          {/* Cute Smiley Loader */}
          <div ref={loaderRef} style={{ display: isAfterLogin ? 'flex' : 'none', position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>       
             <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="32" cy="32" r="30" stroke="#ffffff" strokeWidth="4"/>
                <path ref={leftEyeRef} d="M22 28 Q22 26 24 26 Q26 26 26 28 Q26 30 24 30 Q22 30 22 28 Z" fill="#ffffff" />
                <path ref={rightEyeRef} d="M38 28 Q38 26 40 26 Q42 26 42 28 Q42 30 40 30 Q38 30 38 28 Z" fill="#ffffff" />
                <path ref={mouthRef} d="M20 40 Q32 50 44 40" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" fill="transparent" />
             </svg>
          </div>
        </div>
      
    </>
  );
};

export default RoleTransition;
