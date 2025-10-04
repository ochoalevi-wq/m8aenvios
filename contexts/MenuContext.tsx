import createContextHook from '@nkzw/create-context-hook';
import { useState, useMemo, useCallback } from 'react';

export const [MenuProvider, useMenu] = createContextHook(() => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const openMenu = useCallback(() => setIsOpen(true), []);
  const closeMenu = useCallback(() => setIsOpen(false), []);
  const toggleMenu = useCallback(() => setIsOpen(prev => !prev), []);

  return useMemo(() => ({
    isOpen,
    openMenu,
    closeMenu,
    toggleMenu,
  }), [isOpen, openMenu, closeMenu, toggleMenu]);
});
