import { Calendar, FileText, MessageCircle, Mic, MonitorPlay, PhoneCall } from 'lucide-react';
import { ReactNode } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1] as const;

const showcaseStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } }
};

const showcaseItem: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } }
};

export function AuthShowcase({ title, description }: { title: string; description: string }) {
  const reduce = useReducedMotion();
  const float = (delay: number, distance = 10) =>
    reduce
      ? {}
      : { animate: { y: [0, -distance, 0] }, transition: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay } };

  return (
    <motion.section
      variants={showcaseStagger}
      initial={reduce ? false : 'hidden'}
      animate="show"
      className="relative hidden flex-col justify-center gap-9 p-10 xl:p-14 lg:flex"
    >
      <motion.div variants={showcaseItem}>
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/85 px-4 py-3 text-sm font-semibold text-blue-700 shadow-sm">
          Plataforma health-tech multirol
        </div>
        <h2 className="mt-7 max-w-xl text-balance text-[2.75rem] font-black leading-[1.03] tracking-[-0.045em] text-slate-950 xl:text-5xl">
          {title}
        </h2>
        <p className="mt-5 max-w-xl text-pretty text-lg leading-8 text-slate-600">{description}</p>
      </motion.div>

      <motion.div variants={showcaseItem} className="relative mx-auto w-full max-w-[460px]">
        <div className="absolute inset-0 rounded-[44px] bg-[radial-gradient(circle_at_top_left,_rgba(191,219,254,0.95),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(96,165,250,0.28),_transparent_35%)] blur-xl" />
        <div className="relative rounded-[42px] border border-white/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.88),_rgba(235,244,255,0.96))] p-6 shadow-[0_30px_90px_rgba(37,99,235,0.12)]">
          <motion.div
            {...float(0.2)}
            className="absolute -left-7 bottom-20 z-10 rounded-[24px] border border-white/80 bg-white px-5 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
          >
            <h3 className="text-base font-bold text-slate-900">Proxima cita</h3>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <Calendar className="h-4 w-4 text-blue-600" />
              Hoy, 10:30 AM
            </div>
            <button className="mt-3 text-sm font-semibold text-blue-600">Ver detalle</button>
          </motion.div>

          <motion.div
            {...float(0.9, 8)}
            className="absolute -right-5 top-10 z-10 rounded-[24px] border border-white/80 bg-white px-5 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
          >
            <MiniInfo icon={<FileText className="h-5 w-5 text-blue-600" />} title="Historial clinico" subtitle="Siempre accesible" />
          </motion.div>

          <motion.div
            {...float(1.5, 12)}
            className="absolute -right-7 bottom-14 z-10 rounded-[24px] border border-white/80 bg-white px-5 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
          >
            <div className="flex items-center justify-between gap-4">
              <MiniInfo icon={<MessageCircle className="h-5 w-5 text-blue-600" />} title="Chat medico" subtitle="Soporte y seguimiento" />
              <motion.span
                animate={reduce ? undefined : { scale: [1, 1.35, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="h-3 w-3 rounded-full bg-emerald-400"
              />
            </div>
          </motion.div>

          <div className="mx-auto flex h-[400px] max-w-[260px] flex-col justify-between rounded-[40px] border border-blue-100 bg-[linear-gradient(180deg,_#eef5ff_0%,_#d9e8ff_100%)] p-6 shadow-[0_24px_70px_rgba(59,130,246,0.18)]">
            <div className="mx-auto h-11 w-36 rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.95)_0%,_rgba(191,219,254,0.82)_58%,_rgba(147,197,253,0.98)_100%)]" />
            <div className="mx-auto h-10 w-24 rounded-full bg-white/75" />
            <div className="rounded-[28px] bg-white/92 p-5 shadow-sm">
              <div className="h-4 w-36 rounded-full bg-blue-100" />
              <div className="mt-3 h-4 w-24 rounded-full bg-slate-100" />
              <div className="mt-5 h-40 rounded-[24px] bg-[linear-gradient(180deg,_#3358a8_0%,_#21408f_100%)]" />
            </div>
            <div className="flex items-center justify-center gap-4">
              <Bubble color="bg-blue-600" icon={<Mic className="h-5 w-5 text-white" />} reduce={reduce} />
              <Bubble color="bg-red-500" icon={<PhoneCall className="h-5 w-5 text-white" />} pulse reduce={reduce} />
              <Bubble color="bg-blue-400" icon={<MonitorPlay className="h-5 w-5 text-white" />} reduce={reduce} />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}

function MiniInfo({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-xl bg-blue-50 p-3">{icon}</div>
      <div>
        <h3 className="font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

function Bubble({ color, icon, pulse, reduce }: { color: string; icon: ReactNode; pulse?: boolean; reduce: boolean | null }) {
  return (
    <motion.div
      animate={pulse && !reduce ? { scale: [1, 1.08, 1] } : undefined}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      whileHover={reduce ? undefined : { scale: 1.12 }}
      className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg ${color}`}
    >
      {icon}
    </motion.div>
  );
}
