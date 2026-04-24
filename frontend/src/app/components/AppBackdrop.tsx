import { ReactNode } from 'react';

export function AppBackdrop({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.15),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(96,165,250,0.12),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#f5f9ff_46%,_#eef5ff_100%)]">
      <div className="pointer-events-none absolute left-10 top-16 h-36 w-36 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-10 h-40 w-40 rounded-full bg-sky-200/40 blur-3xl" />
      {children}
    </div>
  );
}
