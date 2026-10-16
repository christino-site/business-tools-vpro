"use strict";

const WORKER_URL = 'https://business-tools-licence.serviceschristino.workers.dev';
const STORAGE_KEY = 'btProLicense';
const LAST_CHECK_KEY = 'btProLicenseLastCheck';
const CHECK_INTERVAL = 24 * 60 * 60 * 1000;

let licenseState = {
  valid: false,
  type: null,
  expires_at: null,
  device_limit: 2,
  features: []
};

async function validateLicense(key) {
  try {
    const response = await fetch(`${WORKER_URL}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key })
    });
    const data = await response.json();
    if (data.status === 'success') {
      licenseState = data.license;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(licenseState));
      localStorage.setItem(LAST_CHECK_KEY, Date.now().toString());
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erreur validation licence:', error);
    return false;
  }
}

function isLicenseValid() {
  return licenseState && licenseState.valid;
}

function hasProFeature(feature) {
  return isLicenseValid() && licenseState.features && licenseState.features.includes(feature);
}

function initLicense() {
  const stored = localStorage.getItem(STORAGE_KEY);
  const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
  if (stored) {
    licenseState = JSON.parse(stored);
  }
  if (lastCheck && Date.now() - parseInt(lastCheck) > CHECK_INTERVAL) {
    licenseState.valid = false;
    localStorage.removeItem(STORAGE_KEY);
  }
}

function resetLicense() {
  licenseState = { valid: false, type: null, expires_at: null, device_limit: 2, features: [] };
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LAST_CHECK_KEY);
}

initLicense();
