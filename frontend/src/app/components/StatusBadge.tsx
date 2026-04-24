const toneByStatus: Record<string, string> = {
  activo: 'bg-green-100 text-green-800',
  confirmada: 'bg-blue-100 text-blue-800',
  completada: 'bg-green-100 text-green-800',
  pendiente_confirmacion: 'bg-yellow-100 text-yellow-800',
  pendiente_documentacion: 'bg-yellow-100 text-yellow-800',
  pendiente_verificacion: 'bg-yellow-100 text-yellow-800',
  documentacion_en_revision: 'bg-orange-100 text-orange-800',
  pendiente_paciente: 'bg-amber-100 text-amber-800',
  aceptada: 'bg-green-100 text-green-800',
  rechazada: 'bg-rose-100 text-rose-800',
  bloqueado: 'bg-red-100 text-red-800',
  rechazado: 'bg-red-100 text-red-800',
  cancelada_por_paciente: 'bg-red-100 text-red-800',
  cancelada_por_medico: 'bg-red-100 text-red-800'
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
