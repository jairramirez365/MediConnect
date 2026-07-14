import { useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, type Variants } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  Award,
  Calendar,
  CheckCircle2,
  FileText,
  HeartPulse,
  Handshake,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  MonitorPlay,
  Phone,
  ShieldCheck,
  Stethoscope,
  UsersRound,
  Wallet,
  X
} from 'lucide-react';

type PublicSiteProps = {
  onLogin: () => void;
  onRegister: () => void;
};

type SectionKey = 'home' | 'specialists' | 'roles' | 'how-it-works';

const specialists = [
  { name: 'Dra. Valentina Rojas', specialty: 'Cardiología', city: 'Bogotá', experience: '12 años', fee: '$140.000', badge: 'Top valorada' },
  { name: 'Dr. Samuel Torres', specialty: 'Dermatología', city: 'Medellín', experience: '9 años', fee: '$120.000', badge: 'Consulta rápida' },
  { name: 'Dra. Laura Cárdenas', specialty: 'Pediatría', city: 'Cali', experience: '11 años', fee: '$110.000', badge: 'Atención integral' },
  { name: 'Dr. Mateo Herrera', specialty: 'Medicina interna', city: 'Barranquilla', experience: '15 años', fee: '$150.000', badge: 'Alta demanda' }
];

const highlights = [
  { icon: Calendar, title: 'Agenda en línea', description: 'Reserva tus citas de forma rápida, clara y sin fricción.' },
  { icon: MonitorPlay, title: 'Telemedicina', description: 'Consultas virtuales coordinadas desde cualquier lugar.' },
  { icon: FileText, title: 'Historia clínica', description: 'Acceso básico a tu información médica y seguimiento.' },
  { icon: MessageCircle, title: 'Mensajería segura', description: 'Interacciones ordenadas antes y después de la consulta.' },
  { icon: ShieldCheck, title: 'Privacidad y seguridad', description: 'Flujos diseñados para proteger datos y operaciones.' }
];

const featureSpans = [
  'sm:col-span-2 lg:col-span-3',
  'lg:col-span-3',
  'lg:col-span-2',
  'lg:col-span-2',
  'lg:col-span-2'
];

// Deep cool-family gradients for the (non-featured) feature cards.
// Endpoints are dark enough that white body text clears 4.5:1 contrast.
const featureGradients = [
  'from-sky-600 to-blue-700',
  'from-cyan-700 to-teal-700',
  'from-indigo-600 to-blue-700',
  'from-blue-600 to-indigo-700'
];

const roles = [
  {
    icon: HeartPulse,
    title: 'Pacientes',
    description: 'Encuentra al especialista indicado y gestiona tu salud en un solo lugar.',
    points: ['Busca y compara médicos verificados', 'Agenda, paga y asiste por video', 'Consulta historia clínica y recetas']
  },
  {
    icon: Stethoscope,
    title: 'Médicos',
    description: 'Publica tu perfil, define tu agenda y atiende sin tareas administrativas de más.',
    points: ['Disponibilidad y citas en tiempo real', 'Notas clínicas y recetas digitales', 'Pagos y liquidación transparentes']
  },
  {
    icon: Handshake,
    title: 'Comisionistas',
    description: 'Acompaña pacientes y crece junto a la plataforma con un modelo claro.',
    points: ['Genera y comparte códigos de referido', 'Acompaña el agendamiento del paciente', 'Comisiones solo cuando la cita se concreta']
  }
];

const steps = [
  { number: '01', title: 'Descubre y regístrate', text: 'Navega, entiende la propuesta y crea tu cuenta para activar una experiencia médica ordenada.' },
  { number: '02', title: 'Busca y agenda', text: 'Explora médicos, revisa horarios disponibles y reserva una consulta con menos fricción.' },
  { number: '03', title: 'Consulta y seguimiento', text: 'Después de la consulta se habilitan historia clínica básica, recetas y continuidad del proceso.' }
];

// Cohesive cool-family gradients (brand blue + sky/cyan/indigo) for per-card color.
const accentGradients = [
  'from-blue-600 to-indigo-500',
  'from-sky-500 to-blue-600',
  'from-cyan-500 to-blue-600',
  'from-indigo-500 to-blue-600'
];

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } }
};

const fadeRight: Variants = {
  hidden: { opacity: 0, x: -28 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE } }
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 16 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.55, ease: EASE } }
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.06 } }
};

export function PublicSite({ onLogin, onRegister }: PublicSiteProps) {
  const [activeSection, setActiveSection] = useState<SectionKey>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const reduce = useReducedMotion();
  const homeRef = useRef<HTMLElement | null>(null);
  const specialistsRef = useRef<HTMLElement | null>(null);
  const rolesRef = useRef<HTMLElement | null>(null);
  const howItWorksRef = useRef<HTMLElement | null>(null);

  const { scrollYProgress } = useScroll();
  const progressScaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.2 });

  const sectionMap = useMemo(
    () => ({
      home: homeRef,
      specialists: specialistsRef,
      roles: rolesRef,
      'how-it-works': howItWorksRef
    }),
    []
  );

  function goToSection(section: SectionKey) {
    setActiveSection(section);
    setMobileMenuOpen(false);
    sectionMap[section].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleLogin() {
    setMobileMenuOpen(false);
    onLogin();
  }

  function handleRegister() {
    setMobileMenuOpen(false);
    onRegister();
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.15),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(96,165,250,0.16),_transparent_30%),linear-gradient(180deg,_#f8fbff_0%,_#ffffff_52%,_#f4f8ff_100%)] text-slate-900">
      <motion.div
        style={{ scaleX: progressScaleX }}
        className="fixed inset-x-0 top-0 z-50 h-1 origin-left bg-gradient-to-r from-blue-600 to-blue-400"
      />

      <AmbientBackground reduce={reduce} />

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-6 md:px-8 lg:px-10">
        <header className="sticky top-3 z-30 rounded-[28px] border border-white/70 bg-white/82 px-4 py-3 shadow-[0_24px_80px_rgba(37,99,235,0.08)] backdrop-blur md:px-6 md:py-4">
          <div className="flex items-center justify-between gap-4">
            <button onClick={() => goToSection('home')} className="flex shrink-0 items-center gap-3 text-left">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-[0_18px_40px_rgba(37,99,235,0.28)] md:h-14 md:w-14">
                <Activity className="h-6 w-6 text-white md:h-7 md:w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-[-0.04em] text-slate-950 md:text-[2.1rem]">
                  Medi<span className="text-blue-600">Connect</span>
                </h1>
                <p className="-mt-1 hidden text-sm text-slate-500 sm:block md:text-base">Atención médica coordinada</p>
              </div>
            </button>

            <nav className="hidden items-center gap-1 text-sm font-medium text-slate-700 xl:flex xl:gap-2 xl:text-base">
              <NavButton active={activeSection === 'home'} onClick={() => goToSection('home')}>Inicio</NavButton>
              <NavButton active={activeSection === 'specialists'} onClick={() => goToSection('specialists')}>Especialistas</NavButton>
              <NavButton active={activeSection === 'roles'} onClick={() => goToSection('roles')}>¿Para quién?</NavButton>
              <NavButton active={activeSection === 'how-it-works'} onClick={() => goToSection('how-it-works')}>¿Cómo funciona?</NavButton>
            </nav>

            <div className="hidden shrink-0 items-center gap-3 xl:flex">
              <button onClick={handleLogin} className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-center font-semibold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 2xl:px-6 2xl:py-3">
                Iniciar sesión
              </button>
              <button onClick={handleRegister} className="rounded-2xl bg-blue-600 px-5 py-2.5 text-center font-semibold text-white shadow-[0_16px_40px_rgba(37,99,235,0.25)] transition hover:bg-blue-700 hover:shadow-[0_20px_50px_rgba(37,99,235,0.35)] 2xl:px-6 2xl:py-3">
                Registrarse
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-blue-200 hover:text-blue-700 xl:hidden"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          <div
            id="mobile-menu"
            className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out xl:hidden motion-reduce:transition-none ${
              mobileMenuOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            }`}
          >
            <div className="min-h-0 overflow-hidden">
              <nav className="mt-3 flex flex-col gap-1 border-t border-slate-100 pt-3 text-base font-medium">
                <MobileNavLink active={activeSection === 'home'} onClick={() => goToSection('home')}>Inicio</MobileNavLink>
                <MobileNavLink active={activeSection === 'specialists'} onClick={() => goToSection('specialists')}>Especialistas</MobileNavLink>
                <MobileNavLink active={activeSection === 'roles'} onClick={() => goToSection('roles')}>¿Para quién?</MobileNavLink>
                <MobileNavLink active={activeSection === 'how-it-works'} onClick={() => goToSection('how-it-works')}>¿Cómo funciona?</MobileNavLink>
              </nav>
              <div className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3">
                <button onClick={handleLogin} className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-3 text-center font-semibold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                  Iniciar sesión
                </button>
                <button onClick={handleRegister} className="rounded-2xl bg-blue-600 px-6 py-3 text-center font-semibold text-white shadow-[0_16px_40px_rgba(37,99,235,0.25)] transition hover:bg-blue-700">
                  Registrarse
                </button>
              </div>
            </div>
          </div>
        </header>

        <motion.section
          ref={homeRef}
          variants={stagger}
          initial={reduce ? false : 'hidden'}
          animate="show"
          className="grid scroll-mt-32 items-center gap-10 pb-12 pt-10 md:gap-12 md:pb-14 lg:grid-cols-[1.02fr_0.98fr] lg:pt-16"
        >
          <div className="relative flex flex-col items-center text-center lg:items-start lg:text-left">
            <div aria-hidden className="pointer-events-none absolute -inset-x-8 -inset-y-10 -z-0 lg:-inset-x-16 lg:-inset-y-16">
              <div className="absolute left-1/2 top-4 h-72 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(37,99,235,0.26),_transparent_72%)] blur-3xl lg:left-0 lg:h-80 lg:w-80 lg:translate-x-0" />
              <div className="absolute -left-4 top-1/3 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(6,182,212,0.32),_transparent_72%)] blur-3xl lg:h-80 lg:w-80" />
              <div className="absolute -right-4 top-1/2 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(124,58,237,0.28),_transparent_72%)] blur-3xl lg:right-1/4 lg:h-80 lg:w-80" />
              <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-[radial-gradient(circle,_rgba(37,99,235,0.20),_transparent_72%)] blur-3xl lg:h-72 lg:w-72" />
            </div>
            <div className="relative z-10 flex w-full flex-col items-center lg:items-start">
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm md:py-3 md:text-lg"
            >
              <ShieldCheck className="h-4 w-4 md:h-5 md:w-5" />
              Plataforma Health-Tech Multirol
            </motion.div>

            <div className="mx-auto mt-6 max-w-3xl md:mt-8 lg:mx-0">
              <h2 className="text-balance text-[2.5rem] font-black leading-[1.02] tracking-[-0.04em] text-slate-950 sm:text-5xl sm:leading-[0.98] md:text-7xl md:tracking-[-0.05em]">
                <motion.span variants={fadeUp} className="inline-block">Tu salud, conectada</motion.span>{' '}
                <motion.span variants={fadeUp} className="inline-block">con los mejores</motion.span>{' '}
                <motion.span variants={fadeUp} className="inline-block text-blue-600">especialistas</motion.span>
              </h2>
              <motion.p
                variants={fadeUp}
                className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-8 text-slate-600 sm:text-lg sm:leading-9 md:mt-7 md:text-2xl lg:mx-0"
              >
                Agenda consultas, accede a tu historia clínica y realiza telemedicina en una experiencia pensada para convertir confianza en acción.
              </motion.p>
            </div>

            <motion.div variants={fadeUp} className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4 md:mt-9 lg:justify-start">
              <motion.button
                onClick={onRegister}
                whileHover={reduce ? undefined : { scale: 1.03 }}
                whileTap={reduce ? undefined : { scale: 0.97 }}
                className="group flex items-center justify-center gap-3 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-4 text-base font-semibold text-white shadow-[0_22px_60px_rgba(37,99,235,0.30)] transition hover:from-blue-700 hover:to-indigo-700 sm:px-8 sm:py-5 sm:text-lg"
              >
                <Calendar className="h-5 w-5" />
                Agendar cita
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </motion.button>
              <motion.button
                onClick={() => goToSection('specialists')}
                whileHover={reduce ? undefined : { scale: 1.03 }}
                whileTap={reduce ? undefined : { scale: 0.97 }}
                className="group flex items-center justify-center gap-3 rounded-3xl border border-blue-100 bg-white px-7 py-4 text-base font-semibold text-slate-900 shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition hover:border-blue-300 hover:text-blue-700 sm:px-8 sm:py-5 sm:text-lg"
              >
                <UsersRound className="h-5 w-5" />
                Explorar especialistas
              </motion.button>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-7 flex max-w-md items-start justify-center gap-3 text-sm text-slate-600 sm:text-base md:mt-8 lg:justify-start">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
              Con la confianza de pacientes, médicos y aliados que buscan una atención coordinada.
            </motion.div>
            </div>
          </div>

          <HeroIllustration reduce={reduce} />
        </motion.section>

        <motion.section
          variants={stagger}
          initial={reduce ? false : 'hidden'}
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6"
        >
          {highlights.map((item, index) => (
            <FeatureCard
              key={item.title}
              icon={item.icon}
              title={item.title}
              description={item.description}
              featured={index === 0}
              gradient={featureGradients[(index - 1 + featureGradients.length) % featureGradients.length]}
              reduce={reduce}
              className={featureSpans[index]}
            />
          ))}
        </motion.section>

        <section ref={specialistsRef} className="mt-20 scroll-mt-32 space-y-8">
          <Reveal reduce={reduce}>
            <SectionHeading
              title="Especialistas que inspiran confianza"
              highlight="confianza"
              description="Explora perfiles, compara experiencia y disponibilidad, y elige al profesional ideal sin compromiso. Cuando estés listo, agenda tu cita en segundos."
            />
          </Reveal>
          <motion.div
            variants={stagger}
            initial={reduce ? false : 'hidden'}
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            className="grid gap-6 md:grid-cols-2 xl:grid-cols-4"
          >
            {specialists.map((specialist, index) => {
              const grad = accentGradients[index % accentGradients.length];
              return (
                <motion.article
                  key={specialist.name}
                  variants={fadeUp}
                  whileHover={reduce ? undefined : { y: -8 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="flex flex-col overflow-hidden rounded-[32px] border border-blue-100 bg-white text-center shadow-[0_20px_60px_rgba(37,99,235,0.10)] hover:shadow-[0_34px_84px_rgba(37,99,235,0.22)]"
                >
                  <div className={`relative h-24 bg-gradient-to-br ${grad}`}>
                    <div aria-hidden className="absolute inset-0 [background:radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.55),transparent_45%),radial-gradient(circle_at_90%_90%,rgba(255,255,255,0.18),transparent_40%)]" />
                    <span className="absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white ring-1 ring-white/40 backdrop-blur-sm">
                      {specialist.badge}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col px-6 pb-6">
                    <div className="relative z-10 -mt-10 mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-2xl font-black text-blue-700 shadow-[0_16px_36px_rgba(15,23,42,0.20)] ring-4 ring-white">
                      {specialist.name.split(' ')[1]?.charAt(0) || 'M'}
                    </div>
                    <h3 className="mt-4 text-xl font-bold text-slate-950">{specialist.name}</h3>
                    <p className="mt-1 font-semibold text-blue-600">{specialist.specialty}</p>

                    <div className="mt-5 space-y-1.5 rounded-2xl border border-blue-100/70 bg-blue-50/60 p-4 text-sm">
                      <MetaRow icon={MapPin} label="Ciudad" value={specialist.city} />
                      <MetaRow icon={Award} label="Experiencia" value={specialist.experience} />
                      <MetaRow icon={Wallet} label="Consulta desde" value={specialist.fee} highlight />
                    </div>

                    <button onClick={onRegister} className={`group/btn mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${grad} px-4 py-3 font-semibold text-white shadow-[0_14px_34px_rgba(37,99,235,0.30)] transition hover:brightness-110`}>
                      Agendar con este especialista
                      <ArrowRight className="h-4 w-4 transition group-hover/btn:translate-x-1" />
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        </section>

        <section ref={rolesRef} className="mt-20 scroll-mt-32">
          <div className="relative overflow-hidden rounded-[40px] bg-[linear-gradient(150deg,_#0b1220_0%,_#0f1e3d_45%,_#1e3a8a_100%)] px-6 py-12 shadow-[0_40px_120px_rgba(15,23,42,0.35)] md:px-12 md:py-16">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />

            <Reveal reduce={reduce}>
              <SectionHeading
                tone="dark"
                title="Pensado para cada rol"
                highlight="cada rol"
                description="MediConnect conecta a las personas que hacen posible la atención. Cada perfil entra a una experiencia hecha a su medida."
              />
            </Reveal>

            <motion.div
              variants={stagger}
              initial={reduce ? false : 'hidden'}
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="relative mt-10 grid gap-6 lg:grid-cols-3"
            >
              {roles.map((role) => (
                <RoleCard key={role.title} icon={role.icon} title={role.title} description={role.description} points={role.points} reduce={reduce} />
              ))}
            </motion.div>
          </div>
        </section>

        <section ref={howItWorksRef} className="mt-20 scroll-mt-32 space-y-8">
          <Reveal reduce={reduce}>
            <SectionHeading
              title="Cómo funciona MediConnect"
              highlight="MediConnect"
              description="Te conectamos con médicos verificados de forma rápida y segura: explora, compara y agenda en minutos. Al registrarte accedes a historia clínica, recetas digitales y seguimiento, todo en un solo lugar."
            />
          </Reveal>
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Timeline reduce={reduce} />

            <div className="space-y-6">
              <Reveal reduce={reduce} variants={scaleIn}>
                <div className="rounded-[34px] border border-emerald-100 bg-[linear-gradient(180deg,_#f5fffb,_#ffffff)] p-7 shadow-[0_20px_60px_rgba(16,185,129,0.08)]">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                      <Wallet className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-950">Beneficios por Comisiones</h3>
                  </div>
                  <p className="mt-4 text-base leading-8 text-slate-600">
                    Un paciente puede generar un código de referido y un gestor puede participar en el crecimiento del sistema mediante acompañamiento y captación. Las comisiones se generan solo cuando la cita se concreta.
                  </p>
                </div>
              </Reveal>

              <Reveal reduce={reduce} variants={scaleIn}>
                <div className="rounded-[34px] border border-slate-200 bg-white p-7 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                      <Stethoscope className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-950">Una Experiencia Coherente</h3>
                  </div>
                  <p className="mt-4 text-base leading-8 text-slate-600">
                    Empieza hoy y gestiona tu salud de forma clara, simple y en un solo lugar.
                  </p>
                  <motion.button
                    onClick={onRegister}
                    whileHover={reduce ? undefined : { scale: 1.03 }}
                    whileTap={reduce ? undefined : { scale: 0.97 }}
                    className="mt-6 rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
                  >
                    Crear cuenta ahora
                  </motion.button>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <Reveal reduce={reduce} variants={scaleIn} className="mt-20">
          <section className="relative overflow-hidden rounded-[40px] border border-blue-400/40 bg-[linear-gradient(135deg,_#1d4ed8_0%,_#2563eb_45%,_#3b82f6_100%)] px-7 py-12 text-white shadow-[0_30px_90px_rgba(37,99,235,0.30)] md:px-12 md:py-16">
            <motion.div
              aria-hidden
              animate={reduce ? undefined : { y: [0, -18, 0], rotate: [0, 8, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
              className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-[40px] bg-white/10"
            />
            <motion.div
              aria-hidden
              animate={reduce ? undefined : { y: [0, 16, 0], rotate: [0, -6, 0] }}
              transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
              className="pointer-events-none absolute -bottom-12 left-1/3 h-40 w-40 rounded-full bg-white/10"
            />
            <div className="relative flex flex-col items-center gap-8 text-center">
              <div className="max-w-2xl">
                <h2 className="text-balance text-4xl font-black tracking-[-0.04em] md:text-5xl">
                  Da el primer paso hacia una atención mejor coordinada
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-pretty text-lg leading-8 text-blue-50">
                  Crea tu cuenta gratis y agenda tu primera consulta en minutos, sin trámites complicados.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <motion.button
                  onClick={onRegister}
                  whileHover={reduce ? undefined : { scale: 1.04 }}
                  whileTap={reduce ? undefined : { scale: 0.97 }}
                  className="group flex items-center justify-center gap-3 rounded-2xl bg-white px-8 py-4 text-lg font-semibold text-blue-700 shadow-[0_18px_50px_rgba(15,23,42,0.18)] transition hover:bg-blue-50"
                >
                  Crear cuenta
                  <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                </motion.button>
                <motion.button
                  onClick={onLogin}
                  whileHover={reduce ? undefined : { scale: 1.04 }}
                  whileTap={reduce ? undefined : { scale: 0.97 }}
                  className="rounded-2xl border border-white/60 bg-white/10 px-8 py-4 text-lg font-semibold text-white transition hover:bg-white/20"
                >
                  Ya tengo cuenta
                </motion.button>
              </div>
            </div>
          </section>
        </Reveal>
      </div>

      <SiteFooter reduce={reduce} />
    </div>
  );
}

function AmbientBackground({ reduce }: { reduce: boolean | null }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
      <motion.div
        animate={reduce ? undefined : { y: [0, 40, 0], x: [0, 20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -left-24 top-24 h-96 w-96 rounded-full bg-blue-400/20 blur-[120px]"
      />
      <motion.div
        animate={reduce ? undefined : { y: [0, -50, 0], x: [0, -24, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute right-[-10%] top-[40%] h-[28rem] w-[28rem] rounded-full bg-blue-300/20 blur-[140px]"
      />
    </div>
  );
}

function HeroIllustration({ reduce }: { reduce: boolean | null }) {
  return (
    <motion.div variants={fadeUp} className="relative">
      <div className="absolute inset-0 -z-10 rounded-[56px] bg-[radial-gradient(circle_at_top_left,_rgba(147,197,253,0.8),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(96,165,250,0.35),_transparent_40%)] blur-2xl" />
      <motion.div
        animate={reduce ? undefined : { y: [0, -14, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="relative mx-auto max-w-[720px] rounded-[48px] border border-white/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.94),_rgba(235,244,255,0.96))] p-5 shadow-[0_30px_100px_rgba(37,99,235,0.18)] md:p-6"
      >
        <div className="relative overflow-visible">
          <FloatingChip reduce={reduce} className="-left-5 top-6 hidden md:flex" delay={0.2} icon={Calendar} />
          <FloatingChip reduce={reduce} className="-right-5 top-1/3 hidden md:flex" delay={0.8} icon={HeartPulse} />
          <FloatingChip reduce={reduce} className="-left-4 bottom-6 hidden md:flex" delay={1.3} icon={ShieldCheck} />

          <div className="overflow-hidden rounded-[36px] border border-blue-100/70 bg-white shadow-[0_26px_80px_rgba(37,99,235,0.14)]">
            <img
              src="/images/imagen-principal.png"
              alt="Escena principal de MediConnect con atención médica digital"
              className="h-auto w-full object-cover"
            />
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          <MetricCard
            icon={MonitorPlay}
            title="Atención conectada"
            text="Explora la experiencia completa antes de registrarte y conoce cómo será tu proceso."
            tone="blue"
            reduce={reduce}
          />
          <MetricCard
            icon={Wallet}
            title="Modelo transparente"
            text="La plataforma muestra valor real para pacientes, médicos y referidores cuando la cita se concreta."
            tone="violet"
            reduce={reduce}
          />
          <MetricCard
            icon={MessageCircle}
            title="Acompañamiento claro"
            text="Todo se presenta con continuidad visual para que navegar, entender y avanzar se sienta natural."
            tone="cyan"
            reduce={reduce}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

function FloatingChip({ icon: Icon, className, delay, reduce }: { icon: any; className?: string; delay: number; reduce: boolean | null }) {
  return (
    <motion.div
      aria-hidden
      animate={reduce ? undefined : { y: [0, -10, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay }}
      className={`absolute z-10 items-center justify-center rounded-2xl border border-blue-100 bg-white p-3 text-blue-600 shadow-[0_16px_40px_rgba(37,99,235,0.22)] ${className || ''}`}
    >
      <Icon className="h-6 w-6" />
    </motion.div>
  );
}

function Reveal({
  children,
  className,
  variants = fadeUp,
  reduce
}: {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
  reduce: boolean | null;
}) {
  return (
    <motion.div
      className={className}
      variants={variants}
      initial={reduce ? false : 'hidden'}
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
    >
      {children}
    </motion.div>
  );
}

function NavButton({ active, children, onClick }: { active: boolean; children: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`whitespace-nowrap rounded-full px-3 py-2 transition xl:px-4 ${active ? 'text-blue-700' : 'text-slate-700 hover:text-blue-600'}`}>
      <span className="relative inline-block">
        {children}
        {active && <span className="absolute -bottom-3 left-0 h-[3px] w-full rounded-full bg-blue-700" />}
      </span>
    </button>
  );
}

function MobileNavLink({ active, children, onClick }: { active: boolean; children: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between rounded-2xl px-4 py-3 text-left transition ${
        active ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
      }`}
    >
      {children}
      <ArrowRight className={`h-4 w-4 transition ${active ? 'text-blue-600' : 'text-slate-400'}`} />
    </button>
  );
}

const metricTones: Record<string, { chip: string; surface: string; border: string; glow: string }> = {
  blue: { chip: 'from-blue-500 to-indigo-600', surface: 'from-white to-blue-50/60', border: 'border-blue-100/80', glow: 'hover:shadow-[0_24px_55px_rgba(37,99,235,0.16)]' },
  violet: { chip: 'from-violet-500 to-fuchsia-600', surface: 'from-white to-fuchsia-50/50', border: 'border-violet-100/80', glow: 'hover:shadow-[0_24px_55px_rgba(139,92,246,0.16)]' },
  cyan: { chip: 'from-cyan-500 to-blue-600', surface: 'from-white to-cyan-50/60', border: 'border-cyan-100/80', glow: 'hover:shadow-[0_24px_55px_rgba(6,182,212,0.16)]' }
};

function MetricCard({ icon: Icon, title, text, tone = 'blue', reduce }: { icon: any; title: string; text: string; tone?: string; reduce: boolean | null }) {
  const t = metricTones[tone] || metricTones.blue;
  return (
    <motion.div
      whileHover={reduce ? undefined : { y: -3 }}
      transition={{ duration: 0.3, ease: EASE }}
      className={`group flex items-start gap-4 rounded-[24px] border ${t.border} bg-gradient-to-br ${t.surface} p-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition ${t.glow}`}
    >
      <div className={`inline-flex shrink-0 rounded-2xl bg-gradient-to-br ${t.chip} p-3 text-white shadow-[0_12px_26px_rgba(37,99,235,0.28)] ring-1 ring-white/40 transition duration-300 group-hover:scale-110`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h3 className="text-[1.05rem] font-bold leading-7 text-slate-950">{title}</h3>
        <p className="mt-1 text-sm leading-7 text-slate-600">{text}</p>
      </div>
    </motion.div>
  );
}

function MetaRow({ icon: Icon, label, value, highlight }: { icon: any; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 whitespace-nowrap text-slate-500">
        <Icon className="h-4 w-4 shrink-0 text-blue-500" />
        {label}
      </span>
      <strong className={`shrink-0 ${highlight ? 'text-base font-bold text-blue-700' : 'font-bold text-slate-900'}`}>{value}</strong>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  featured,
  className,
  gradient,
  reduce
}: {
  icon: any;
  title: string;
  description: string;
  featured?: boolean;
  className?: string;
  gradient?: string;
  reduce: boolean | null;
}) {
  if (featured) {
    return (
      <motion.div
        variants={scaleIn}
        whileHover={reduce ? undefined : { y: -6 }}
        className={`group flex flex-col items-center justify-center gap-2 rounded-[32px] bg-[linear-gradient(135deg,_#1d4ed8,_#3b82f6)] p-8 text-center text-white shadow-[0_26px_70px_rgba(37,99,235,0.32)] ${className || ''}`}
      >
        <div className="inline-flex rounded-2xl bg-white/20 p-4 text-white ring-1 ring-white/30 backdrop-blur-sm transition duration-300 group-hover:scale-110">
          <Icon className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-2xl font-bold">{title}</h3>
        <p className="mt-1 max-w-md text-base leading-8 text-blue-50">{description}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={scaleIn}
      whileHover={reduce ? undefined : { y: -6 }}
      className={`group flex flex-col items-center rounded-[28px] border border-blue-100 bg-white p-6 text-center shadow-[0_12px_34px_rgba(37,99,235,0.07)] transition hover:border-blue-200 hover:shadow-[0_26px_60px_rgba(37,99,235,0.16)] ${className || ''}`}
    >
      <div className={`inline-flex rounded-2xl bg-gradient-to-br ${gradient} p-3.5 text-white shadow-[0_12px_28px_rgba(37,99,235,0.30)] ring-1 ring-white/40 transition duration-300 group-hover:scale-110`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-5 text-xl font-bold text-slate-950">{title}</h3>
      <p className="mt-2 text-base leading-8 text-slate-600">{description}</p>
    </motion.div>
  );
}

function RoleCard({
  icon: Icon,
  title,
  description,
  points,
  reduce
}: {
  icon: any;
  title: string;
  description: string;
  points: string[];
  reduce: boolean | null;
}) {
  return (
    <motion.article
      variants={scaleIn}
      whileHover={reduce ? undefined : { y: -8 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="group flex h-full flex-col items-center rounded-[32px] border border-white/10 bg-white/[0.06] p-7 text-center shadow-[0_20px_60px_rgba(2,6,23,0.35)] transition hover:border-blue-300/40 hover:bg-white/[0.1]"
    >
      <div className="inline-flex rounded-2xl bg-gradient-to-br from-blue-500 to-blue-400 p-4 text-white shadow-[0_14px_30px_rgba(37,99,235,0.45)] transition group-hover:scale-105">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-5 text-2xl font-bold text-white">{title}</h3>
      <p className="mt-2 text-base leading-8 text-blue-100/80">{description}</p>
      <ul className="mx-auto mt-6 w-fit space-y-3 text-left text-base text-blue-50/90">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </motion.article>
  );
}

function Timeline({ reduce }: { reduce: boolean | null }) {
  const lineGrow: Variants = {
    hidden: { scaleY: 0 },
    show: { scaleY: 1, transition: { duration: 0.6, ease: EASE } }
  };
  const badgeStyles = [
    'bg-blue-600 shadow-[0_12px_30px_rgba(37,99,235,0.4)]',
    'bg-gradient-to-br from-blue-500 to-teal-500 shadow-[0_12px_30px_rgba(20,184,166,0.4)]',
    'bg-emerald-500 shadow-[0_12px_30px_rgba(16,185,129,0.45)]'
  ];
  const connectorStyles = [
    'bg-gradient-to-b from-blue-600 to-teal-500',
    'bg-gradient-to-b from-teal-500 to-emerald-500'
  ];

  return (
    <motion.div
      variants={stagger}
      initial={reduce ? false : 'hidden'}
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      className="flex h-full flex-col justify-between rounded-[34px] border border-blue-100 bg-white p-7 shadow-[0_20px_60px_rgba(37,99,235,0.08)]"
    >
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <motion.div
            key={step.number}
            variants={fadeRight}
            className={`grid grid-cols-[3rem_1fr] gap-5 md:grid-cols-[4rem_1fr] ${isLast ? '' : 'flex-1'}`}
          >
            <div className="flex flex-col items-center">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black tracking-[0.1em] text-white md:h-16 md:w-16 md:text-base ${badgeStyles[index]}`}>
                {step.number}
              </div>
              {!isLast && (
                <motion.div
                  variants={lineGrow}
                  style={{ originY: 0 }}
                  className={`my-3 w-1.5 flex-1 rounded-full ${connectorStyles[index]}`}
                />
              )}
            </div>
            <div className="pt-1">
              <h3 className="text-2xl font-bold text-slate-950">{step.title}</h3>
              <p className="mt-2 text-base leading-8 text-slate-600">{step.text}</p>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

function SectionHeading({
  title,
  description,
  tone = 'light',
  highlight
}: {
  title: string;
  description: string;
  tone?: 'light' | 'dark';
  highlight?: string;
}) {
  const isDark = tone === 'dark';
  const parts = highlight && title.includes(highlight) ? title.split(highlight) : null;
  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="mb-5 flex items-center justify-center gap-3">
        <span className={`h-1.5 w-12 rounded-full bg-gradient-to-r ${isDark ? 'from-blue-400 to-teal-300' : 'from-blue-600 to-teal-400'}`} />
        <span className={`h-1.5 w-1.5 rounded-full ${isDark ? 'bg-teal-300' : 'bg-teal-400'}`} />
      </div>
      <h2 className={`text-balance text-4xl font-black leading-[1.04] tracking-[-0.04em] md:text-5xl ${isDark ? 'text-white' : 'text-slate-950'}`}>
        {parts ? (
          <>
            {parts[0]}
            <span className={isDark ? 'text-blue-300' : 'text-blue-600'}>{highlight}</span>
            {parts[1]}
          </>
        ) : (
          title
        )}
      </h2>
      <p className={`mt-4 text-pretty text-lg leading-8 ${isDark ? 'text-blue-100/80' : 'text-slate-600'}`}>{description}</p>
    </div>
  );
}

function SiteFooter({ reduce }: { reduce: boolean | null }) {
  return (
    <footer className="relative bg-[linear-gradient(180deg,_transparent_0%,_rgba(255,255,255,0.5)_22%,_rgba(238,244,255,0.92)_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 lg:px-10">
        <Reveal reduce={reduce}>
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-[0_12px_28px_rgba(37,99,235,0.25)]">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-black tracking-[-0.03em] text-slate-950">
                  Medi<span className="text-blue-600">Connect</span>
                </span>
              </div>
              <p className="mt-4 max-w-sm text-base leading-8 text-slate-600">
                Plataforma health-tech que coordina la atención entre pacientes, médicos y aliados en Colombia.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">Plataforma</h4>
              <ul className="mt-4 space-y-3 text-base text-slate-600">
                <li>Especialistas</li>
                <li>Telemedicina</li>
                <li>Historia clínica</li>
                <li>Pagos y comisiones</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">Contacto</h4>
              <ul className="mt-4 space-y-3 text-base text-slate-600">
                <li className="flex items-center gap-3"><Mail className="h-5 w-5 text-blue-600" /> hola@mediconnect.co</li>
                <li className="flex items-center gap-3"><Phone className="h-5 w-5 text-blue-600" /> +57 300 000 0000</li>
                <li className="flex items-center gap-3"><MapPin className="h-5 w-5 text-blue-600" /> Bogotá, Colombia</li>
              </ul>
            </div>
          </div>
        </Reveal>

        <div className="mt-10 flex flex-col items-center gap-2 border-t border-slate-200/70 pt-6 text-center text-sm text-slate-500">
          <span>© {new Date().getFullYear()} MediConnect. Todos los derechos reservados.</span>
          <span>Hecho para una atención médica coordinada.</span>
        </div>
      </div>
    </footer>
  );
}
