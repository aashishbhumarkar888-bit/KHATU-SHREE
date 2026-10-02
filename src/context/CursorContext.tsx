import React, { createContext, useContext } from 'react';

type CursorVariant = 'default' | 'hover' | 'view' | 'drag' | 'add';

interface CursorContextType {
  cursorVariant: CursorVariant;
  cursorText: string;
  setCursor: (variant?: CursorVariant, text?: string) => void;
  resetCursor: () => void;
  isTouchDevice: boolean;
}

const CursorContext = createContext<CursorContextType>({
  cursorVariant: 'default',
  cursorText: '',
  setCursor: () => {},
  resetCursor: () => {},
  isTouchDevice: false,
});

export const CursorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Standard native browser cursor is enforced per user requirement.
  // No floating text or custom cursor dot that tells 'VIEW'.
  const setCursor = () => {};
  const resetCursor = () => {};

  return (
    <CursorContext.Provider value={{ cursorVariant: 'default', cursorText: '', setCursor, resetCursor, isTouchDevice: false }}>
      {children}
    </CursorContext.Provider>
  );
};

export const useCursor = () => {
  return useContext(CursorContext);
};

