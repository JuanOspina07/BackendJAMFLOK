const locationService = require('../services/locationService');

class LocationController {
  async getCountries(req, res) {
    try {
      const countries = await locationService.getCountries();
      res.json(countries);
    } catch (error) {
      console.error("Error al obtener los países:", error);
      res.status(500).json({ error: "Error al obtener los países" });
    }
  }

  async getDepartments(req, res) {
    try {
      const { idPais } = req.params;
      const departments = await locationService.getDepartmentsByCountry(idPais);
      res.json(departments);
    } catch (error) {
      console.error("Error al obtener los departamentos:", error);
      res.status(500).json({ error: "Error al obtener los departamentos" });
    }
  }

  async getCities(req, res) {
    try {
      const { idDepartamento } = req.params;
      const cities = await locationService.getCitiesByDepartment(idDepartamento);
      res.json(cities);
    } catch (error) {
      console.error("Error al obtener las ciudades:", error);
      res.status(500).json({ error: "Error al obtener las ciudades" });
    }
  }
  async getAllCities(req, res) {
    try {
      const cities = await locationService.getAllCities();
      res.json(cities);
    } catch (error) {
      console.error("Error al obtener todas las ciudades:", error);
      res.status(500).json({ error: "Error al obtener todas las ciudades" });
    }
  }

  async getDocumentTypes(req, res) {
    try {
      const documentTypes = await locationService.getDocumentTypes();
      res.json(documentTypes);
    } catch (error) {
      console.error("Error al obtener los tipos de documento:", error);
      res.status(500).json({ error: "Error al obtener los tipos de documento" });
    }
  }

  async getRoles(req, res) {
    try {
      const roles = await locationService.getRoles();
      const rolesFiltrados = roles.filter(
        (rol) => rol.Nombre !== "Admin"
      );
      res.json(rolesFiltrados);
    } catch (error) {
      console.error("Error al obtener los Roles:", error);
      res.status(500).json({ error: "Error al obtener los Roles" });
    }
  }
}

module.exports = new LocationController();