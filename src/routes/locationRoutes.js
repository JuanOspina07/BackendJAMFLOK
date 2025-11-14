const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

router.get('/paises', locationController.getCountries);
router.get('/departamentos/:idPais', locationController.getDepartments);
router.get('/ciudades/:idDepartamento', locationController.getCities);
router.get('/tipos-documento', locationController.getDocumentTypes);
router.get('/rol', locationController.getRoles);

module.exports = router;