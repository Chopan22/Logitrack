const router = require('express').Router();
const ctrl = require('../controllers/pedidos');
const autenticar = require('../middleware/autenticar');

// Ruta PUBLICA (sin login): seguimiento del pedido por el cliente final.
router.get('/:id/tracking', ctrl.tracking);

// A partir de aqui, todo requiere autenticacion.
router.use(autenticar);

router.get('/',                ctrl.listar);
router.post('/',               ctrl.crear);
router.patch('/:id',           ctrl.actualizar);
router.patch('/:id/asignar',   ctrl.asignar);
router.patch('/:id/confirmar-entrega', ctrl.confirmarEntrega);

module.exports = router;
