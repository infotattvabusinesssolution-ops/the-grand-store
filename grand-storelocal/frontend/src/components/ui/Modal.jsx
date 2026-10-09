import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

export default function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef();

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>
      <div 
        ref={modalRef}
        className="relative z-10 animate-in fade-in zoom-in-95 duration-200"
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
