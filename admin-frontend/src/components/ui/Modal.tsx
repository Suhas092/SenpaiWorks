import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { X } from 'lucide-react';
import { Button } from './button';
import type { ReactNode } from 'react';
export function Modal({ title, open, onClose, children, slideOver = false }: { title: string; open: boolean; onClose: () => void; children: ReactNode; slideOver?: boolean }) { return <Dialog open={open} onClose={onClose} className="relative z-50"><div className="modal-backdrop" /><div className={slideOver ? 'modal-position slide-position' : 'modal-position'}><DialogPanel className={slideOver ? 'modal-panel slide-panel' : 'modal-panel'}><div className="flex items-center justify-between border-b pb-4 mb-5"><DialogTitle className="font-semibold text-lg">{title}</DialogTitle><Button variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog"><X /></Button></div>{children}</DialogPanel></div></Dialog>; }
