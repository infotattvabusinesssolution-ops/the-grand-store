import React, { useState, useEffect } from 'react';
import './AgeGate.css';

export default function AgeGate() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDenied, setIsDenied] = useState(false);

  useEffect(() => {
    const sessionVerified = sessionStorage.getItem('age_verified');
    if (sessionVerified) {
      return; // Already verified this session, keep isVisible false
    }

    const stored = localStorage.getItem('ageVerified');
    if (stored) {
      try {
        const { expiry } = JSON.parse(stored);
        if (expiry > Date.now()) {
          return; // Still valid from a previous session, keep isVisible false
        }
      } catch (e) {
        // invalid stored format, ignore
      }
    }

    // If we reach here, neither session nor local storage has a valid verification
    setIsVisible(true);
  }, []);

  useEffect(() => {
    // Disable scrolling while the gate is open
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isVisible]);

  const handleYes = () => {
    const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
    localStorage.setItem('ageVerified', JSON.stringify({ verified: true, expiry }));
    sessionStorage.setItem('age_verified', 'true');
    setIsVisible(false);
    window.dispatchEvent(new Event('grand-store-age-verified'));
  };

  const handleNo = () => {
    setIsDenied(true);
  };

  if (!isVisible) return null;

  return (
    <div className="age-gate-overlay">
      <div className="age-gate-modal">
        <div className="age-gate-content">
          <div className="age-gate-logo-wrap">
            <img
              src="/grand-store-logo.png"
              alt="The Grand Store"
              className="age-gate-logo"
            />
          </div>
          <h2>Are you 18 years or older?</h2>
          {isDenied ? (
            <div className="age-gate-denied-message">
              <p>You cannot visit this site as you are under the legal smoking and drinking age.</p>
            </div>
          ) : (
            <>
              <p className="age-gate-desc">
                You must be of legal smoking/drinking age to enter this site. By clicking "Yes", you confirm that you are 18 years of age or older.
              </p>
              <div className="age-gate-actions">
                <button className="btn-yes" onClick={handleYes}>Yes, I am 18+</button>
                <button className="btn-no" onClick={handleNo}>No, I am under 18</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
