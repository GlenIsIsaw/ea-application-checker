import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

const Captcha = forwardRef(({ onVerify, onExpire }, ref) => {
  const recaptchaRef = useRef(null);
  const containerRef = useRef(null);
  const [captchaSize, setCaptchaSize] = useState('normal');

  // Check screen size and adjust CAPTCHA size
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 400) {
        setCaptchaSize('compact');
      } else {
        setCaptchaSize('normal');
      }
    };

    // Check on initial load
    checkScreenSize();

    // Add resize listener
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Expose reset function to parent component
  useImperativeHandle(ref, () => ({
    resetCaptcha: () => {
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
    }
  }));

  const handleChange = (token) => {
    if (token) {
      onVerify(token);
    }
  };

  const handleExpired = () => {
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
    if (onExpire) onExpire();
  };

  const siteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

  if (!siteKey) {
    return (
      <div className="captcha-error-container">
        <i className="bi bi-exclamation-triangle-fill me-2"></i>
        CAPTCHA configuration error. Please check your .env file.
      </div>
    );
  }

  return (
    <div className="captcha-container" ref={containerRef}>
      <div className="captcha-wrapper">
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={siteKey}
          onChange={handleChange}
          onExpired={handleExpired}
          theme="light"
          size={captchaSize}
        />
      </div>
    </div>
  );
});

export default Captcha;