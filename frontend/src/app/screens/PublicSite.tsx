import { useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  FileText,
  MessageCircle,
  MonitorPlay,
  ShieldCheck,
  Stethoscope,
  UsersRound,
  Wallet
} from 'lucide-react';

type PublicSiteProps = {
  onLogin: () => void;
  onRegister: () => void;
};

type SectionKey = 'home' | 'specialists' | 'how-it-works';

const specialists = [
  { name: 'Dra. Valentina Rojas', specialty: 'Cardiologia', city: 'Bogota', experience: '12 anos', fee: '$140.000', badge: 'Top valorada' },
  { name: 'Dr. Samuel Torres', specialty: 'Dermatologia', city: 'Medellin', experience: '9 anos', fee: '$120.000', badge: 'Consulta rapida' },
  { name: 'Dra. Laura Cardenas', specialty: 'Pediatria', city: 'Cali', experience: '11 anos', fee: '$110.000', badge: 'Atencion integral' },
  { name: 'Dr. Mateo Herrera', specialty: 'Medicina interna', city: 'Barranquilla', experience: '15 anos', fee: '$150.000', badge: 'Alta demanda' }
];

const highlights = [
  { icon: Calendar, title: 'Agenda en linea', description: 'Reserva tus citas de forma rapida, clara y sin friccion.' },
  { icon: MonitorPlay, title: 'Telemedicina', description: 'Consultas virtuales coordinadas desde cualquier lugar.' },
  { icon: FileText, title: 'Historia clinica', description: 'Acceso basico a informacion medica y seguimiento.' },
  { icon: MessageCircle, title: 'Mensajeria segura', description: 'Interacciones ordenadas antes y despues de la consulta.' },
  { icon: ShieldCheck, title: 'Privacidad y seguridad', description: 'Flujos disenados para proteger datos y operaciones.' }
];

export function PublicSite({ onLogin, onRegister }: PublicSiteProps) {
  const [activeSection, setActiveSection] = useState<SectionKey>('home');
  const homeRef = useRef<HTMLElement | null>(null);
  const specialistsRef = useRef<HTMLElement | null>(null);
  const howItWorksRef = useRef<HTMLElement | null>(null);

  const sectionMap = useMemo(
    () => ({
      home: homeRef,
      specialists: specialistsRef,
      'how-it-works': howItWorksRef
    }),
    []
  );

  function goToSection(section: SectionKey) {
    setActiveSection(section);
    sectionMap[section].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.15),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(96,165,250,0.16),_transparent_30%),linear-gradient(180deg,_#f8fbff_0%,_#ffffff_52%,_#f4f8ff_100%)] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 md:px-8 lg:px-10">
        <header className="sticky top-3 z-30 rounded-[28px] border border-white/70 bg-white/82 px-4 py-4 shadow-[0_24px_80px_rgba(37,99,235,0.08)] backdrop-blur md:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <button onClick={() => goToSection('home')} className="flex items-center gap-3 text-left">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-[0_18px_40px_rgba(37,99,235,0.28)]">
                <Activity className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-[2rem] font-black tracking-[-0.04em] text-slate-950 md:text-[2.35rem]">
                  Medi<span className="text-blue-600">Connect</span>
                </h1>
                <p className="-mt-1 text-sm text-slate-500 md:text-base">Atencion medica coordinada</p>
              </div>
            </button>

            <nav className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-700 md:text-base">
              <NavButton active={activeSection === 'home'} onClick={() => goToSection('home')}>Inicio</NavButton>
              <NavButton active={activeSection === 'specialists'} onClick={() => goToSection('specialists')}>Especialistas</NavButton>
              <NavButton active={activeSection === 'how-it-works'} onClick={() => goToSection('how-it-works')}>Como funciona</NavButton>
              <span className="rounded-full px-4 py-2 text-slate-500">Planes</span>
              <span className="flex items-center gap-1 rounded-full px-4 py-2 text-slate-500">
                Recursos
                <ChevronDown className="h-4 w-4" />
              </span>
            </nav>

            <div className="flex flex-wrap gap-3">
              <button onClick={onLogin} className="min-w-[172px] rounded-2xl border border-slate-200 bg-slate-50 px-6 py-3 text-center font-semibold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                Iniciar sesion
              </button>
              <button onClick={onRegister} className="min-w-[172px] rounded-2xl bg-blue-600 px-6 py-3 text-center font-semibold text-white shadow-[0_16px_40px_rgba(37,99,235,0.25)] transition hover:bg-blue-700">
                Registrarse
              </button>
            </div>
          </div>
        </header>

        <section ref={homeRef} className="grid scroll-mt-32 items-center gap-12 pb-14 pt-12 lg:grid-cols-[1.02fr_0.98fr] lg:pt-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 shadow-sm md:text-lg">
              <ShieldCheck className="h-4 w-4 md:h-5 md:w-5" />
              Plataforma health-tech multirol
            </div>

            <div className="mt-8 max-w-3xl">
              <h2 className="text-5xl font-black leading-[0.96] tracking-[-0.05em] text-slate-950 md:text-7xl">
                Tu salud, conectada
                <br />
                con los mejores
                <br />
                <span className="text-blue-600">especialistas</span>
              </h2>
              <p className="mt-7 max-w-2xl text-lg leading-9 text-slate-600 md:text-2xl">
                Agenda consultas, accede a tu historia clinica, realiza telemedicina y conoce una experiencia pensada para convertir confianza en accion.
              </p>
            </div>

            <div className="mt-9 flex flex-wrap gap-4">
              <button onClick={onRegister} className="group flex items-center gap-3 rounded-3xl bg-blue-600 px-8 py-5 text-lg font-semibold text-white shadow-[0_22px_60px_rgba(37,99,235,0.28)] transition hover:bg-blue-700">
                <Calendar className="h-5 w-5" />
                Agendar cita
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </button>
              <button onClick={() => goToSection('specialists')} className="group flex items-center gap-3 rounded-3xl border border-blue-100 bg-white px-8 py-5 text-lg font-semibold text-slate-900 shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition hover:border-blue-300 hover:text-blue-700">
                <UsersRound className="h-5 w-5" />
                Explorar especialistas
              </button>
            </div>

            <div className="mt-8 flex items-center gap-3 text-base text-slate-600">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Con la confianza de pacientes, medicos y aliados que buscan una atencion coordinada.
            </div>
          </div>

          <HeroIllustration />
        </section>

        <section className="rounded-[40px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)] md:p-8">
          <div className="grid gap-4 lg:grid-cols-5">
            {highlights.map((item) => (
              <FeatureCard key={item.title} icon={item.icon} title={item.title} description={item.description} />
            ))}
          </div>
        </section>

        <section ref={specialistsRef} className="mt-16 scroll-mt-32 space-y-8">
          <SectionHeading
            title="Especialistas que inspiran confianza"
            description="Explora especialistas, conoce sus perfiles y entiende como funciona la plataforma sin compromiso. MediConnect te permite tomar decisiones informadas desde el primer momento, con acceso claro a la oferta medica, disponibilidad y experiencia de cada profesional.

Visualiza como sera tu atencion, compara opciones y encuentra el especialista ideal segun tu necesidad. Todo en un entorno confiable, disenado para brindarte claridad, seguridad y control sobre tu salud.

Cuando estes listo, agenda tu cita en segundos."
          />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {specialists.map((specialist) => (
              <article key={specialist.name} className="rounded-[32px] border border-blue-100 bg-white p-6 shadow-[0_20px_60px_rgba(37,99,235,0.08)]">
                <div className="flex items-center justify-between">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,_#2563eb,_#60a5fa)] text-xl font-bold text-white">
                    {specialist.name.split(' ')[1]?.charAt(0) || 'M'}
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{specialist.badge}</span>
                </div>
                <h3 className="mt-5 text-xl font-bold text-slate-950">{specialist.name}</h3>
                <p className="mt-1 font-medium text-blue-600">{specialist.specialty}</p>
                <div className="mt-5 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between"><span>Ciudad</span><strong className="text-slate-900">{specialist.city}</strong></div>
                  <div className="flex items-center justify-between"><span>Experiencia</span><strong className="text-slate-900">{specialist.experience}</strong></div>
                  <div className="flex items-center justify-between"><span>Consulta desde</span><strong className="text-slate-900">{specialist.fee}</strong></div>
                </div>
                <p className="mt-5 text-sm leading-7 text-slate-500">
                  Perfil pensado para comunicar cercania, criterio clinico y una experiencia segura desde el primer contacto.
                </p>
                <button onClick={onRegister} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 font-semibold text-blue-700 transition hover:bg-blue-100">
                  Agendar con este especialista
                  <ArrowRight className="h-4 w-4" />
                </button>
              </article>
            ))}
          </div>
        </section>

        <section ref={howItWorksRef} className="mt-16 scroll-mt-32 space-y-8">
          <SectionHeading
            title="Como funciona MediConnect"
            description="MediConnect te conecta con medicos verificados de forma rapida y segura. Puedes explorar especialistas, comparar opciones y agendar tu cita en minutos.

Al registrarte, accedes a tu historial clinico, seguimiento de citas, recetas digitales y comunicacion directa con tu medico en un solo lugar.

Nuestro modelo de comisiones es transparente: los medicos y referidores solo pagan cuando se concreta una cita, lo que asegura que la plataforma siempre este enfocada en darte atencion real y de calidad."
          />
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[34px] border border-blue-100 bg-white p-7 shadow-[0_20px_60px_rgba(37,99,235,0.08)]">
              <div className="grid gap-5">
                <StepCard number="01" title="Descubre y registrate" text="La persona navega, entiende la propuesta y crea su cuenta para activar una experiencia medica ordenada." />
                <StepCard number="02" title="Busca y agenda" text="Desde la cuenta se exploran medicos, horarios disponibles y se reserva una consulta con menos friccion." />
                <StepCard number="03" title="Consulta y seguimiento" text="Despues de la consulta se habilitan historia clinica basica, recetas y continuidad del proceso." />
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[34px] border border-emerald-100 bg-[linear-gradient(180deg,_#f5fffb,_#ffffff)] p-7 shadow-[0_20px_60px_rgba(16,185,129,0.08)]">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-950">Beneficios por comisiones</h3>
                </div>
                <p className="mt-4 text-base leading-8 text-slate-600">
                  MediConnect contempla beneficios derivados de referidos y comisiones. Un paciente puede generar un codigo de referido, y un gestor puede participar en el crecimiento del sistema mediante acompanamiento y captacion.
                </p>
              </div>

              <div className="rounded-[34px] border border-slate-200 bg-white p-7 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                    <Stethoscope className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-950">Una experiencia coherente</h3>
                </div>
                <p className="mt-4 text-base leading-8 text-slate-600">
                  "Empieza hoy y gestiona tu salud de forma clara, simple y en un solo lugar."
                </p>
                <button onClick={onRegister} className="mt-6 rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700">
                  Crear cuenta ahora
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function HeroIllustration() {
  return (
    <div className="relative">
      <div className="absolute inset-0 -z-10 rounded-[56px] bg-[radial-gradient(circle_at_top_left,_rgba(147,197,253,0.8),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(96,165,250,0.35),_transparent_40%)] blur-2xl" />
      <div className="relative mx-auto max-w-[720px] rounded-[48px] border border-white/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.94),_rgba(235,244,255,0.96))] p-5 shadow-[0_30px_100px_rgba(37,99,235,0.18)] md:p-6">
        <div className="overflow-hidden rounded-[36px] border border-blue-100/70 bg-white shadow-[0_26px_80px_rgba(37,99,235,0.14)]">
          <img
            src="/images/imagen-principal.png"
            alt="Escena principal de MediConnect con atencion medica digital"
            className="h-auto w-full object-cover"
          />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <MetricCard
            icon={MonitorPlay}
            title="Atencion conectada"
            text="Explora la experiencia completa antes de registrarte y conoce como sera tu proceso."
          />
          <MetricCard
            icon={Wallet}
            title="Modelo transparente"
            text="La plataforma muestra valor real para pacientes, medicos y referidores cuando la cita se concreta."
          />
          <MetricCard
            icon={MessageCircle}
            title="Acompañamiento claro"
            text="Todo se presenta con continuidad visual para que navegar, entender y avanzar se sienta natural."
          />
        </div>
      </div>
    </div>
  );
}

function NavButton({ active, children, onClick }: { active: boolean; children: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`rounded-full px-4 py-2 transition ${active ? 'text-blue-700' : 'text-slate-700 hover:text-blue-600'}`}>
      <span className="relative inline-block">
        {children}
        {active && <span className="absolute -bottom-3 left-0 h-[3px] w-full rounded-full bg-blue-700" />}
      </span>
    </button>
  );
}

function MetricCard({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <div className="rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="inline-flex rounded-2xl bg-blue-50 p-3 text-blue-700">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-[1.05rem] font-bold leading-7 text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-600">{text}</p>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="rounded-[28px] border border-slate-100 bg-white p-5 transition hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(37,99,235,0.08)]">
      <div className="inline-flex rounded-2xl bg-blue-50 p-4 text-blue-700">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-xl font-bold text-slate-950">{title}</h3>
      <p className="mt-2 text-base leading-8 text-slate-600">{description}</p>
    </div>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="max-w-3xl">
      <h2 className="text-4xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">{title}</h2>
      <p className="mt-4 text-lg leading-8 text-slate-600">{description}</p>
    </div>
  );
}

function StepCard({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="rounded-[28px] border border-slate-100 bg-[linear-gradient(180deg,_#ffffff,_#f8fbff)] p-6">
      <div className="text-sm font-black tracking-[0.2em] text-blue-600">{number}</div>
      <h3 className="mt-3 text-2xl font-bold text-slate-950">{title}</h3>
      <p className="mt-3 text-base leading-8 text-slate-600">{text}</p>
    </div>
  );
}
