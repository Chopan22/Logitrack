const router = require('express').Router();
const ctrl = require('../controllers/rutas');
const autenticar = require('../middleware/autenticar');

// Todas las rutas requieren autenticacion.
router.use(autenticar);

router.get('/',           ctrl.listar);
router.post('/',          ctrl.iniciar);
router.patch('/:id/cerrar', ctrl.cerrar);
router.get('/:id/ubicaciones', ctrl.ubicaciones);
router.get('/:id',        ctrl.detalle);

module.exports = router;
