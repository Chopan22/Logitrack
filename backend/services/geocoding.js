/**
 * Servicio de geocodificacion: convierte una direccion de texto en
 * coordenadas (lat/lng).
 *
 * Usa Google Geocoding API si existe GOOGLE_MAPS_API_KEY en el entorno
 * (mejor precision en Chile, interpola numeros de casa). Si no hay key,
 * o si Google no encuentra el lugar, cae a Nominatim (OpenStreetMap, gratis).
 */

const PAIS = 'cl'; // Acota la busqueda a Chile.

// ---------- Google Geocoding API ----------
async function geocodeGoogle(direccion) {
    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) return null;

    const params = new URLSearchParams({
        address: direccion,
        key,
        region: PAIS,
        components: `country:${PAIS.toUpperCase()}`,
        language: 'es',
    });

    try {
        const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`
        );
        if (!res.ok) return null;

        const data = await res.json();
        if (data.status !== 'OK' || !data.results?.length) {
            if (data.status && data.status !== 'ZERO_RESULTS') {
                console.warn(`⚠️  Google geocoding: ${data.status} ${data.error_message ?? ''}`);
            }
            return null;
        }

        const r = data.results[0];
        const loc = r.geometry.location;
        // location_type: ROOFTOP (exacto) > RANGE_INTERPOLATED > GEOMETRIC_CENTER > APPROXIMATE
        console.log(
            `📍 Google: "${r.formatted_address}" (${r.geometry.location_type})`
        );
        return { lat: loc.lat, lng: loc.lng };
    } catch (err) {
        console.error('🔴 Error en Google geocoding:', err.message);
        return null;
    }
}

// ---------- Nominatim (OpenStreetMap) ----------
async function geocodeNominatim(direccion) {
    const params = new URLSearchParams({
        q: direccion,
        format: 'json',
        limit: '1',
        countrycodes: PAIS,
        addressdetails: '0',
    });

    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?${params.toString()}`,
            {
                headers: {
                    'User-Agent': 'LogiTrack/1.0 (proyecto universitario UTFSM)',
                    'Accept-Language': 'es',
                },
            }
        );
        if (!res.ok) {
            console.warn(`⚠️  Nominatim: respuesta ${res.status} para "${direccion}"`);
            return null;
        }

        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
            console.warn(`⚠️  Nominatim: sin resultados para "${direccion}"`);
            return null;
        }
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } catch (err) {
        console.error('🔴 Error en Nominatim:', err.message);
        return null;
    }
}

// ---------- Orquestador ----------
async function geocodificar(direccion) {
    if (!direccion) return null;

    // 1) Google (si hay key)
    const google = await geocodeGoogle(direccion);
    if (google) return google;

    // 2) Fallback a Nominatim
    return geocodeNominatim(direccion);
}

module.exports = { geocodificar };
