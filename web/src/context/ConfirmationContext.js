import React, { createContext, useState, useCallback, useRef } from 'react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export const ConfirmationContext = createContext();

export const ConfirmationProvider = ({ children }) => {
  const [modalConfig, setModalConfig] = useState(null);
  const [inputValue, setInputValue] = useState("");
  
  // We use a ref to hold the 'resolve' function of the active Promise.
  // This allows us to resolve the promise from a different render cycle (when the user clicks a button).
  const resolverRef = useRef(null);

  const handleClose = () => {
    if (resolverRef.current) {
      // If closed without action (clicking X or background), resolve as false/null
      resolverRef.current(modalConfig?.type === 'prompt' ? null : false);
    }
    setModalConfig(null);
    setInputValue("");
    resolverRef.current = null;
  };

  const handleConfirm = () => {
    if (resolverRef.current) {
      if (modalConfig?.type === 'prompt') {
        resolverRef.current(inputValue);
      } else {
        resolverRef.current(true);
      }
    }
    setModalConfig(null);
    setInputValue("");
    resolverRef.current = null;
  };

  /**
   * standard confirmation (Yes/No)
   * Usage: if (await confirm({ title: "Sure?", message: "Really?" })) { ... }
   */
  const confirm = useCallback(({ title, message, confirmText = "Confirm", cancelText = "Cancel", variant = "primary" }) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setModalConfig({
        type: 'confirm',
        title,
        message,
        confirmText,
        cancelText,
        variant
      });
    });
  }, []);

  /**
   * standard prompt (Input text)
   * Usage: const reason = await prompt({ title: "Why?", message: "Reason:" });
   */
  const prompt = useCallback(({ title, message, confirmText = "Submit", cancelText = "Cancel", placeholder = "" }) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setModalConfig({
        type: 'prompt',
        title,
        message,
        confirmText,
        cancelText,
        placeholder,
        variant: 'primary'
      });
    });
  }, []);

  return (
    <ConfirmationContext.Provider value={{ confirm, prompt }}>
      {children}
      
      {/* GLOBAL MODAL RENDER */}
      {modalConfig && (
        <Modal
          title={modalConfig.title}
          onClose={handleClose}
          actions={
            <>
              <Button onClick={handleConfirm} variant={modalConfig.variant}>
                {modalConfig.confirmText}
              </Button>
              <Button onClick={handleClose} variant="secondary">
                {modalConfig.cancelText}
              </Button>
            </>
          }
        >
          <p style={{ color: '#ccc', lineHeight: '1.5', marginBottom: '20px' }}>
            {modalConfig.message}
          </p>

          {modalConfig.type === 'prompt' && (
            <Input 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={modalConfig.placeholder}
              multiline
              autoFocus
            />
          )}
        </Modal>
      )}
    </ConfirmationContext.Provider>
  );
};