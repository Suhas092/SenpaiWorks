import type { ReactNode } from 'react';
export function Toolbar({ children }: { children: ReactNode }) { return <div className="flex flex-wrap items-center gap-3 mb-5">{children}</div>; }
