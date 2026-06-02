const router = require('express').Router();
const ctrl = require('../controllers/pedidos');
const autenticar = require('../middleware/autenticar');

router.use(autenticar);

router.get('/',                ctrl.listar);
router.post('/',               ctrl.crear);
router.patch('/:id',           ctrl.actualizar);
router.patch('/:id/asignar',   ctrl.asignar);

module.exports = router;
