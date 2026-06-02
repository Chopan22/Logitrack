const router = require('express').Router();
const ctrl = require('../controllers/conductores');

router.get('/',       ctrl.listar);
router.post('/',      ctrl.crear);
router.patch('/:id',  ctrl.actualizar);

module.exports = router;
