import { useEffect, useState } from 'react';
import { api } from '../../services/api';

type LocationOption = {
  code: string;
  name: string;
};

type ColombiaLocationFieldsProps = {
  departmentCode: string;
  departmentName: string;
  municipality: string;
  onDepartmentChange: (value: { code: string; name: string }) => void;
  onMunicipalityChange: (value: string) => void;
  required?: boolean;
};

export function ColombiaLocationFields({
  departmentCode,
  departmentName,
  municipality,
  onDepartmentChange,
  onMunicipalityChange,
  required = false
}: ColombiaLocationFieldsProps) {
  const [departments, setDepartments] = useState<LocationOption[]>([]);
  const [municipalities, setMunicipalities] = useState<LocationOption[]>([]);

  useEffect(() => {
    let cancelled = false;

    api.departments()
      .then((response) => {
        if (!cancelled) {
          const nextDepartments = response.data || [];
          setDepartments(nextDepartments);

          if (!departmentCode && departmentName) {
            const currentDepartment = nextDepartments.find((option: LocationOption) => option.name === departmentName);
            if (currentDepartment) {
              onDepartmentChange(currentDepartment);
            }
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDepartments([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [departmentCode, departmentName]);

  useEffect(() => {
    let cancelled = false;

    if (!departmentCode) {
      setMunicipalities([]);
      return () => {
        cancelled = true;
      };
    }

    api.municipalities(departmentCode)
      .then((response) => {
        if (cancelled) return;

        const nextMunicipalities = response.data || [];
        setMunicipalities(nextMunicipalities);

        if (municipality && !nextMunicipalities.some((option: LocationOption) => option.name === municipality)) {
          onMunicipalityChange('');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMunicipalities([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [departmentCode, municipality]);

  return (
    <>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Departamento</span>
        <select
          value={departmentCode}
          onChange={(event) => {
            const nextDepartment = departments.find((option) => option.code === event.target.value);
            onDepartmentChange({
              code: nextDepartment?.code || '',
              name: nextDepartment?.name || ''
            });
          }}
          className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3.5 text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          required={required}
        >
          <option value="">Selecciona un departamento</option>
          {departments.map((option) => (
            <option key={option.code} value={option.code}>
              {option.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Municipio</span>
        <select
          value={municipality}
          onChange={(event) => onMunicipalityChange(event.target.value)}
          className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3.5 text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={!departmentCode}
          required={required}
        >
          <option value="">{departmentCode ? 'Selecciona un municipio' : 'Primero elige un departamento'}</option>
          {municipalities.map((option) => (
            <option key={option.code} value={option.name}>
              {option.name}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
