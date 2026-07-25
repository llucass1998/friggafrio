import React, { useState, useEffect } from 'react';

// Tipagem base
interface FloatingActionsProps {
  whatsappNumber?: string;
  whatsappMessage?: string;
}

export function FloatingActions({ 
  whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || "", 
  whatsappMessage = "Olá! Vim pelo site da Friggafrio e gostaria de falar com um especialista."
}: FloatingActionsProps) {
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    const checkScrollTop = () => {
      if (!showScroll && window.scrollY > 500) {
        setShowScroll(true);
      } else if (showScroll && window.scrollY <= 500) {
        setShowScroll(false);
      }
    };

    window.addEventListener('scroll', checkScrollTop);
    return () => window.removeEventListener('scroll', checkScrollTop);
  }, [showScroll]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sanitizeNumber = (num: string) => {
    return num.replace(/\D/g, '');
  };

  const cleanNumber = sanitizeNumber(whatsappNumber);
  
  if (import.meta.env.DEV && !cleanNumber) {
    console.warn("VITE_WHATSAPP_NUMBER não está configurado.");
  }

  const encodedMessage = encodeURIComponent(whatsappMessage);
  const whatsappUrl = `https://wa.me/55${cleanNumber}?text=${encodedMessage}`;

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 flex flex-col gap-[10px] md:gap-3 z-50 safe-area-bottom">
      {/* Scroll to Top */}
      <button
        onClick={scrollToTop}
        className={`bg-white text-[var(--color-navy)] shadow-md hover:shadow-lg rounded-full w-[52px] h-[52px] md:w-14 md:h-14 flex items-center justify-center transition-all duration-300 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] ${showScroll ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        aria-label="Voltar ao topo"
        title="Voltar ao topo"
      >
        <svg xmlns="http://www.w3.org/w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m18 15-6-6-6 6"/>
        </svg>
      </button>

      {/* WhatsApp */}
      {cleanNumber ? (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#25D366] text-white shadow-md hover:shadow-lg rounded-full w-[52px] h-[52px] md:w-14 md:h-14 flex items-center justify-center transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
          aria-label="Falar com a Friggafrio pelo WhatsApp"
          title="Falar com especialista"
        >
          <svg xmlns="http://www.w3.org/w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
          </svg>
        </a>
      ) : null}
    </div>
  );
}
