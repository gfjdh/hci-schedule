import React from "react";
import "./Modal.css";

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ visible, onClose, title, children }) => {
  if (!visible) return null;
  return (
    <div className="modal-mask">
      <div className="modal-window">
        <div className="modal-header">
          <span>{title || "提示"}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
};

export default Modal;