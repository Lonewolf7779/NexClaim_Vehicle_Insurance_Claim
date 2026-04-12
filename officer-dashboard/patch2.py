import re

with open("D:\\myProjects\\clones\\DA_PROJECT(DA_Integration)\\officer-dashboard\\src\\App.jsx", "r") as f:
    app_content = f.read()

# Move inputs and button to right
app_content = app_content.replace(
    "<form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '40px', maxWidth: '400px' }}>",
    "<form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '40px', maxWidth: '400px', alignSelf: 'flex-end' }}>"
)

# Increase login timeout to let the animation play
app_content = app_content.replace(
    "setTimeout(() => {\n          login(role)\n          setError('')\n        }, 1500)",
    "setTimeout(() => {\n          login(role)\n          setError('')\n        }, 2500)"
)

with open("D:\\myProjects\\clones\\DA_PROJECT(DA_Integration)\\officer-dashboard\\src\\App.jsx", "w") as f:
    f.write(app_content)

print("App.jsx patched!")

with open("D:\\myProjects\\clones\\DA_PROJECT(DA_Integration)\\officer-dashboard\\src\\components\\RoleTransition.jsx", "r") as f:
    role_content = f.read()

# Update RoleTransition to replay the animation when isAfterLogin becomes true
new_effect = """
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
"""

# Replace the single useEffect block with the two useEffects
start_idx = role_content.find("  useEffect(() => {\n    const originalOverflow")
end_idx = role_content.find("  }, []);", start_idx) + 9

if start_idx != -1 and end_idx != -1:
    role_content = role_content[:start_idx] + new_effect + role_content[end_idx:]
    with open("D:\\myProjects\\clones\\DA_PROJECT(DA_Integration)\\officer-dashboard\\src\\components\\RoleTransition.jsx", "w") as f:
        f.write(role_content)
    print("RoleTransition.jsx patched!")
else:
    print(f"Could not find useEffect in RoleTransition.jsx. {start_idx}, {end_idx}")

