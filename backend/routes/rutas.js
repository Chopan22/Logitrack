const router = require('express').Router();
const ctrl = require('../controllers/rutas');

router.get('/',           ctrl.listar);
router.post('/',          ctrl.iniciar);
router.patch('/:id/cerrar', ctrl.cerrar);

module.exports = router;
