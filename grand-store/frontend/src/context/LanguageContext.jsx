import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  return useContext(LanguageContext);
};

export const LANGUAGES = [
  // Official South African Languages (Prioritized First)
  { value: 'en', code: 'EN', label: 'English (South Africa)', flagCode: 'za', nativeName: 'English', isSouthAfrican: true },
  { value: 'af', code: 'AF', label: 'Afrikaans', flagCode: 'za', nativeName: 'Afrikaans', isSouthAfrican: true },
  { value: 'zu', code: 'ZU', label: 'isiZulu', flagCode: 'za', nativeName: 'isiZulu', isSouthAfrican: true },
  { value: 'xh', code: 'XH', label: 'isiXhosa', flagCode: 'za', nativeName: 'isiXhosa', isSouthAfrican: true },
  { value: 'st', code: 'ST', label: 'Sesotho (Sotho)', flagCode: 'za', nativeName: 'Sesotho', isSouthAfrican: true },
  { value: 'tn', code: 'TN', label: 'Setswana (Tswana)', flagCode: 'za', nativeName: 'Setswana', isSouthAfrican: true },
  { value: 'nso', code: 'NSO', label: 'Sepedi (Northern Sotho)', flagCode: 'za', nativeName: 'Sepedi', isSouthAfrican: true },
  { value: 'ts', code: 'TS', label: 'Xitsonga (Tsonga)', flagCode: 'za', nativeName: 'Xitsonga', isSouthAfrican: true },
  { value: 'ss', code: 'SS', label: 'siSwati (Swati)', flagCode: 'za', nativeName: 'siSwati', isSouthAfrican: true },
  { value: 've', code: 'VE', label: 'Tshivenda (Venda)', flagCode: 'za', nativeName: 'Tshivenda', isSouthAfrican: true },
  { value: 'nr', code: 'NR', label: 'isiNdebele (Ndebele)', flagCode: 'za', nativeName: 'isiNdebele', isSouthAfrican: true },

  // Important Global Luxury Market Languages
  { value: 'fr', code: 'FR', label: 'French (Français)', flagCode: 'fr', nativeName: 'Français', isSouthAfrican: false },
  { value: 'de', code: 'DE', label: 'German (Deutsch)', flagCode: 'de', nativeName: 'Deutsch', isSouthAfrican: false },
  { value: 'it', code: 'IT', label: 'Italian (Italiano)', flagCode: 'it', nativeName: 'Italiano', isSouthAfrican: false },
  { value: 'es', code: 'ES', label: 'Spanish (Español)', flagCode: 'es', nativeName: 'Español', isSouthAfrican: false },
  { value: 'pt', code: 'PT', label: 'Portuguese (Português)', flagCode: 'pt', nativeName: 'Português', isSouthAfrican: false },
  { value: 'nl', code: 'NL', label: 'Dutch (Nederlands)', flagCode: 'nl', nativeName: 'Nederlands', isSouthAfrican: false },
  { value: 'zh-CN', code: 'ZH', label: 'Chinese (中文)', flagCode: 'cn', nativeName: '中文', isSouthAfrican: false },
  { value: 'ja', code: 'JA', label: 'Japanese (日本語)', flagCode: 'jp', nativeName: '日本語', isSouthAfrican: false },
  { value: 'ar', code: 'AR', label: 'Arabic (العربية)', flagCode: 'ae', nativeName: 'العربية', isSouthAfrican: false },
  { value: 'hi', code: 'HI', label: 'Hindi (हिन्दी)', flagCode: 'in', nativeName: 'हिन्दी', isSouthAfrican: false },
  { value: 'ru', code: 'RU', label: 'Russian (Русский)', flagCode: 'ru', nativeName: 'Русский', isSouthAfrican: false }
];

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    try {
      const stored = localStorage.getItem('grandstore_language');
      if (stored && LANGUAGES.some(l => l.value === stored || l.code.toLowerCase() === stored.toLowerCase())) {
        return stored;
      }
    } catch (e) {}
    return 'en';
  });

  // Apply Google Translate cookie & language change
  const changeLanguage = useCallback((langValue) => {
    const target = LANGUAGES.find(
      l => l.value.toLowerCase() === String(langValue).toLowerCase() ||
           l.code.toLowerCase() === String(langValue).toLowerCase()
    );
    const newLang = target ? target.value : 'en';

    setLanguage(newLang);
    try {
      localStorage.setItem('grandstore_language', newLang);
    } catch (e) {}

    document.documentElement.lang = newLang;

    // Set Google Translate cookie so the DOM auto-translates
    const cookieVal = `/auto/${newLang}`;
    document.cookie = `googtrans=${cookieVal}; path=/; domain=${window.location.hostname}`;
    document.cookie = `googtrans=${cookieVal}; path=/;`;

    // Trigger select element inside google translate container if present
    const selectElem = document.querySelector('.goog-te-combo');
    if (selectElem) {
      selectElem.value = newLang;
      selectElem.dispatchEvent(new Event('change'));
    } else {
      // If switching to or from non-english, reload to let the google translate engine activate
      const currentCookie = document.cookie.split('; ').find(row => row.startsWith('googtrans='));
      if (currentCookie || newLang !== 'en') {
        window.location.reload();
      }
    }
  }, []);

  // Initialize invisible Google Translate script
  useEffect(() => {
    // Hidden container for Google Translate
    if (!document.getElementById('google_translate_element')) {
      const div = document.createElement('div');
      div.id = 'google_translate_element';
      div.style.display = 'none';
      document.body.appendChild(div);
    }

    // Define callback
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            autoDisplay: false,
            includedLanguages: LANGUAGES.map(l => l.value).join(',')
          },
          'google_translate_element'
        );
      }
    };

    // Load script if not already added
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }

    // Hide Google Translate attribution bar & styling
    const styleId = 'google-translate-luxury-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        .goog-te-banner-frame { display: none !important; }
        .goog-te-balloon-frame { display: none !important; }
        #goog-gt-tt { display: none !important; }
        .goog-text-highlight { background: none !important; box-shadow: none !important; }
        body { top: 0px !important; }
        .skiptranslate { display: none !important; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};
