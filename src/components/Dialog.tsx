import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export default function Dialog({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    const focused = document.activeElement as HTMLElement | null;
    const dialog = ref.current!; dialog.showModal();
    const previous = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const cancel = (e: Event) => { e.preventDefault(); close.current(); };
    dialog.addEventListener('cancel', cancel);
    return () => { dialog.removeEventListener('cancel', cancel); dialog.close(); document.body.style.overflow = previous; focused?.focus(); };
  }, []);
  return <dialog ref={ref} className={`dialog ${wide ? 'dialog--wide' : ''}`} onClick={e => { if (e.target === ref.current) onClose(); }} aria-label={title}>
    <div className="dialog-inner"><header className="dialog-header"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="关闭窗口"><X size={21} /></button></header>{children}</div>
  </dialog>;
}
