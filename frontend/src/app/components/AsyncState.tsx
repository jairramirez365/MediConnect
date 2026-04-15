import { Activity, AlertCircle, Inbox } from 'lucide-react';

export function LoadingState({ label = 'Cargando información...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-10 text-gray-600">
      <Activity className="mr-3 h-5 w-5 animate-spin text-blue-600" />
      {label}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
      <div className="flex items-center gap-2 font-medium">
        <AlertCircle className="h-5 w-5" />
        No pudimos cargar esta sección
      </div>
      <p className="mt-2 text-sm">{message}</p>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
      <Inbox className="mx-auto h-10 w-10 text-gray-400" />
      <h3 className="mt-4 font-bold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </div>
  );
}
