const AppError = require('../../utils/AppError');
const colombiaLocations = require('./colombiaLocations.data');

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const DANE_TIMEOUT_MS = 10000;
const departmentsCache = {
  data: null,
  expiresAt: 0
};
const municipalitiesCache = {
  data: null,
  expiresAt: 0
};

const DANE_DEPARTMENTS_QUERY_URL =
  'https://geoportal.dane.gov.co/mparcgis/rest/services/Territoriales_DANE/Serv_Territoriales_DANE_2025/MapServer/1/query?where=1%3D1&outFields=DPTO_CCDGO%2CDPTO_CNMBR&returnGeometry=false&orderByFields=DPTO_CNMBR%20ASC&f=json';

function buildMunicipalitiesQueryUrl(departmentCode) {
  const normalizedDepartmentCode = encodeURIComponent(departmentCode);
  return `https://geoportal.dane.gov.co/mparcgis/rest/services/Divipola/Serv_DIVIPOLA_MGN_2025/MapServer/317/query?where=DPTO_CCDGO%3D%27${normalizedDepartmentCode}%27&outFields=DPTO_CCDGO%2CDPTO_CNMBRE%2CMPIO_CCDGO%2CMPIO_CDPMP%2CMPIO_CNMBRE&returnGeometry=false&orderByFields=MPIO_CNMBRE%20ASC&f=json`;
}

function firstDefined(attributes, keys) {
  for (const key of keys) {
    if (attributes[key] !== undefined && attributes[key] !== null) {
      return attributes[key];
    }
  }

  return '';
}

function normalizeName(value) {
  return String(value || '').trim();
}

function normalizeCode(value) {
  return String(value || '').trim();
}

async function fetchDaneData(url, message) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DANE_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json'
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new AppError(message, 503);
    }

    const payload = await response.json();

    if (!Array.isArray(payload.features)) {
      throw new AppError(message, 503);
    }

    return payload.features;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(message, 503);
  } finally {
    clearTimeout(timeout);
  }
}

async function listDepartments() {
  if (departmentsCache.data && departmentsCache.expiresAt > Date.now()) {
    return departmentsCache.data;
  }

  let features;

  try {
    features = await fetchDaneData(
      DANE_DEPARTMENTS_QUERY_URL,
      'Could not retrieve departments from the DANE official source'
    );
  } catch (error) {
    departmentsCache.data = colombiaLocations.departments;
    departmentsCache.expiresAt = Date.now() + CACHE_TTL_MS;
    return departmentsCache.data;
  }

  const departments = Array.from(
    features.reduce((accumulator, feature) => {
      const attributes = feature.attributes || {};
      const code = normalizeCode(firstDefined(attributes, ['DPTO_CCDGO', 'dpto_ccdgo']));
      const name = normalizeName(firstDefined(attributes, ['DPTO_CNMBR', 'dpto_cnmbr', 'DPTO_CNMBRE', 'dpto_cnmbre']));

      if (code && name && !accumulator.has(code)) {
        accumulator.set(code, { code, name });
      }

      return accumulator;
    }, new Map()).values()
  ).sort((left, right) => left.name.localeCompare(right.name, 'es'));

  departmentsCache.data = departments;
  departmentsCache.expiresAt = Date.now() + CACHE_TTL_MS;

  return departments;
}

async function listMunicipalities(departmentCode) {
  if (!departmentCode) {
    throw new AppError('departmentCode is required', 400);
  }

  if (!municipalitiesCache.data) {
    municipalitiesCache.data = new Map();
  }

  const cachedMunicipalities = municipalitiesCache.data.get(departmentCode);
  if (cachedMunicipalities && municipalitiesCache.expiresAt > Date.now()) {
    return cachedMunicipalities;
  }

  let features;

  try {
    features = await fetchDaneData(
      buildMunicipalitiesQueryUrl(departmentCode),
      'Could not retrieve municipalities from the DANE official source'
    );
  } catch (error) {
    const fallbackMunicipalities = colombiaLocations.municipalities
      .filter((municipality) => municipality.departmentCode === departmentCode)
      .sort((left, right) => left.name.localeCompare(right.name, 'es'));

    municipalitiesCache.data.set(departmentCode, fallbackMunicipalities);
    municipalitiesCache.expiresAt = Date.now() + CACHE_TTL_MS;

    return fallbackMunicipalities;
  }

  const municipalities = Array.from(
    features.reduce((accumulator, feature) => {
      const attributes = feature.attributes || {};
      const code = normalizeCode(firstDefined(attributes, ['MPIO_CDPMP', 'mpio_cdpmp', 'MPIO_CCDGO', 'mpio_ccdgo']));
      const name = normalizeName(firstDefined(attributes, ['MPIO_CNMBRE', 'mpio_cnmbre', 'MPIO_CNMBR', 'mpio_cnmbr']));
      const currentDepartmentCode = normalizeCode(firstDefined(attributes, ['DPTO_CCDGO', 'dpto_ccdgo']));
      const departmentName = normalizeName(firstDefined(attributes, ['DPTO_CNMBRE', 'dpto_cnmbre', 'DPTO_CNMBR', 'dpto_cnmbr']));

      if (code && name && currentDepartmentCode && !accumulator.has(code)) {
        accumulator.set(code, {
          code,
          name,
          departmentCode: currentDepartmentCode,
          departmentName
        });
      }

      return accumulator;
    }, new Map()).values()
  ).sort((left, right) => left.name.localeCompare(right.name, 'es'));

  municipalitiesCache.data.set(departmentCode, municipalities);
  municipalitiesCache.expiresAt = Date.now() + CACHE_TTL_MS;

  return municipalities;
}

module.exports = {
  listDepartments,
  listMunicipalities
};
