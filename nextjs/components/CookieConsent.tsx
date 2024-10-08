"use client"
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCookie } from '@fortawesome/free-solid-svg-icons';

export function cookieConsentGiven() {
  if (!localStorage.getItem('cookie_consent')) {
    return 'undecided';
  }

  return localStorage.getItem('cookie_consent') as string;
}

export default function CookieConsent() {
  const [consentGiven, setConsentGiven] = useState('');

  useEffect(() => {
    // Run once on component load
    setConsentGiven(cookieConsentGiven());
  }, []);

  const handleAcceptCookies = () => {
    localStorage.setItem('cookie_consent', 'yes');
    setConsentGiven('yes');
  };

  const handleDeclineCookies = () => {
    localStorage.setItem('cookie_consent', 'no');
    setConsentGiven('no');
  };

  return (
    <div>
      {consentGiven === 'undecided' && (
        <div className="cookie-consent fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center bg-indigo-500 text-white p-4 shadow-md">
          <FontAwesomeIcon icon={faCookie} className="text-yellow-400 text-2xl mr-2 animate-bounce" /> {/* Font Awesome icon */}
          <p className="text-sm md:text-base">
            We use cookies to improve your experience.
          </p>
          <button 
            onClick={handleAcceptCookies}
            className="bg-white text-indigo-600 px-4 py-2 rounded-md ml-4 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Accept
          </button>
          {/* Uncomment below to include Decline button */}
          {/* <button
            onClick={handleDeclineCookies}
            className="text-white px-4 py-2 rounded-md ml-2 hover:text-indigo-200 focus:outline-none"
          >
            Decline
          </button> */}
        </div>
      )}
      {/* {consentGiven === 'yes' && (
        <div className="cookie-consent fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center bg-indigo-500 text-white p-4 shadow-md">
          <FontAwesomeIcon icon={faCookie} className="text-yellow-400 text-2xl mr-2 animate-bounce" />
          <p className="text-sm md:text-base">
            Thank you for accepting cookies!
          </p>
        </div>
      )}
      {consentGiven === 'no' && (
        <div className="cookie-consent fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center bg-indigo-500 text-white p-4 shadow-md">
          <FontAwesomeIcon icon={faCookie} className="text-yellow-400 text-2xl mr-2 animate-bounce" />
          <p className="text-sm md:text-base">
            Cookies declined.
          </p>
        </div>
      )} */}
    </div>
  );
}
