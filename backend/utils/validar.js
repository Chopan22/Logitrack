// Validaciones de entrada reutilizables para los controladores.
// Cada funcion retorna null si el valor es valido, o un mensaje de error.

// Patente chilena: formato antiguo (AB1234) o nuevo (ABCD12).
const PATENTE_ANTIGUA = /^[A-Z]{2}\d{4}$/;
const PATENTE_NUEVA = /^[A-Z]{4}\d{2}$/;

const validarPatente = (patente) => {
    if (!patente || typeof patente !== 'string') {
        return 'La patente es requerida';
    }
    const limpia = patente.trim().toUpperCase();
    if (!PATENTE_ANTIGUA.test(limpia) && !PATENTE_NUEVA.test(limpia)) {
        return 'Formato de patente inválido (se espera AB1234 o ABCD12)';
    }
    return null;
};

// Telefono: opcional "+" inicial y entre 7 y 15 digitos (se ignoran espacios).
const validarTelefono = (telefono) => {
    if (telefono == null || telefono === '') return null; // es opcional
    const limpio = String(telefono).replace(/\s/g, '');
    if (!/^\+?\d{7,15}$/.test(limpio)) {
        return 'Formato de teléfono inválido (se esperan 7 a 15 dígitos, ej: +56912345678)';
    }
    return null;
};

// Texto requerido con largo minimo/maximo razonable.
const validarTexto = (valor, campo, { min = 1, max = 100 } = {}) => {
    if (valor == null || String(valor).trim().length < min) {
        return `${campo} es requerido (mínimo ${min} caracteres)`;
    }
    if (String(valor).trim().length > max) {
        return `${campo} supera el largo máximo (${max} caracteres)`;
    }
    return null;
};

// Booleano estricto (para campos como "activo").
const validarBooleano = (valor, campo) => {
    if (valor == null) return null; // opcional
    if (typeof valor !== 'boolean') {
        return `${campo} debe ser true o false`;
    }
    return null;
};

module.exports = { validarPatente, validarTelefono, validarTexto, validarBooleano };
