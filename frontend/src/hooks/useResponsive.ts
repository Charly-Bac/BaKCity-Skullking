import { useState, useEffect } from 'react';

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  width: number;
  height: number;
  cardWidth: number;
  cardHeight: number;
  playedCardWidth: number;
  playedCardHeight: number;
}

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

function getState(): ResponsiveState {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const height = typeof window !== 'undefined' ? window.innerHeight : 768;
  const isMobile = width < MOBILE_BREAKPOINT;
  const isTablet = width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT;

  return {
    isMobile,
    isTablet,
    width,
    height,
    cardWidth: isMobile ? 65 : 90,
    cardHeight: isMobile ? 91 : 126,
    playedCardWidth: isMobile ? 60 : 90,
    playedCardHeight: isMobile ? 84 : 126,
  };
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState(getState);

  useEffect(() => {
    const handleResize = () => setState(getState());
    window.addEventListener('resize', handleResize);
    // Also listen to orientation change on mobile
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return state;
}
