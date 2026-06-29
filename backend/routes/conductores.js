const router = require('express').Router();
const ctrl = require('../controllers/conductores');
const autenticar = require('../middleware/autenticar');

// Todas las rutas de conductores requieren autenticacion.
router.use(autenticar);

router.get('/',       ctrl.listar);
router.post('/',      ctrl.crear);
router.patch('/:id',  ctrl.actualizar);

module.exports = router;
