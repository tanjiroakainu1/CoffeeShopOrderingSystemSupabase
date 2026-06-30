import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function ImageLightbox({
  src,
  alt,
  title,
  onClose,
}: {
  src: string;
  alt: string;
  title?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={title ?? alt}
      onClick={onClose}
    >
      <div className="image-lightbox-header" onClick={(e) => e.stopPropagation()}>
        <p className="image-lightbox-title">{title ?? alt}</p>
        <button type="button" className="image-lightbox-close" onClick={onClose} aria-label="Close receipt viewer">
          <X className="h-5 w-5 shrink-0" strokeWidth={2.5} />
          <span>Close</span>
        </button>
      </div>
      <div className="image-lightbox-body" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt={alt} className="image-lightbox-img" />
      </div>
    </div>,
    document.body,
  );
}
