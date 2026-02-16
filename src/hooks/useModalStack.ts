import { useEffect, useRef } from 'react';

const modalStack: symbol[] = [];

export function useModalStack(): { isTopModal: () => boolean } {
  const modalId = useRef(Symbol('modal'));

  useEffect(() => {
    const id = modalId.current;
    modalStack.push(id);
    return (): void => {
      const index = modalStack.lastIndexOf(id);
      if (index !== -1) {
        modalStack.splice(index, 1);
      }
    };
  }, []);

  const isTopModal = (): boolean => modalStack.at(-1) === modalId.current;

  return { isTopModal };
}
