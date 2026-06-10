const toneByStatus: Record<string, string> = {
  activo: 'bg-green-100 text-green-800',
  confirmada: 'bg-blue-100 text-blue-800',
  completada: 'bg-green-100 text-green-800',
  pendiente_pago: 'bg-amber-100 text-amber-800',
  pendiente_confirmacion: 'bg-yellow-100 text-yellow-800',
  pendiente_documentacion: 'bg-yellow-100 text-yellow-800',
  pendiente_verificacion: 'bg-yellow-100 text-yellow-800',
  documentacion_en_revision: 'bg-orange-100 text-orange-800',
  pendiente_paciente: 'bg-amber-100 text-amber-800',
  aceptada: 'bg-green-100 text-green-800',
  rechazada: 'bg-rose-100 text-rose-800',
  pagado: 'bg-green-100 text-green-800',
  pendiente: 'bg-amber-100 text-amber-800',
  autorizado: 'bg-blue-100 text-blue-800',
  reembolsado: 'bg-sky-100 text-sky-800',
  fallido: 'bg-red-100 text-red-800',
  cancelado: 'bg-slate-100 text-slate-700',
  penalidad_cobrada: 'bg-orange-100 text-orange-800',
  liquidada: 'bg-emerald-100 text-emerald-800',
  calculada: 'bg-indigo-100 text-indigo-800',
  pendiente_liquidacion: 'bg-yellow-100 text-yellow-800',
  pse: 'bg-cyan-100 text-cyan-800',
  tarjeta: 'bg-fuchsia-100 text-fuchsia-800',
  dummy: 'bg-slate-100 text-slate-700',
  dummy_card: 'bg-slate-100 text-slate-700',
  bloqueado: 'bg-red-100 text-red-800',
  rechazado: 'bg-red-100 text-red-800',
  cancelada_por_paciente: 'bg-red-100 text-red-800',
  cancelada_por_medico: 'bg-red-100 text-red-800',
  expirada_por_no_pago: 'bg-slate-200 text-slate-800',
  ready: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-rose-100 text-rose-800',
  expired: 'bg-slate-200 text-slate-800',
  failed: 'bg-red-100 text-red-800'
};

export function StatusBadge({ status }: { status?: string }) {
  const label = (status || 'sin_estado').replaceAll('_', ' ');
  const tone = toneByStatus[status || ''] || 'bg-gray-100 text-gray-700';

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${tone}`}>
      {label}
    </span>
  );
}
