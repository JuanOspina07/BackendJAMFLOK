const database = require("../utils/database");

class LocationService {
  async getCountries() {
    const [rows] = await database.query("SELECT ID_PAIS, Nombre FROM Pais");
    return rows;
  }

  async getDepartmentsByCountry(idPais) {
    const [rows] = await database.query(
      "SELECT ID_DEPARTAMENTO, Nombre FROM Departamento WHERE ID_PAIS = ?",
      [idPais]
    );
    return rows;
  }

  async getCitiesByDepartment(idDepartamento) {
    const [rows] = await database.query(
      "SELECT ID_CIUDAD, Nombre FROM Ciudad WHERE ID_DEPARTAMENTO = ?",
      [idDepartamento]
    );
    return rows;
  }

  async getDocumentTypes() {
    const [rows] = await database.query("SELECT ID_TIPO_DOCUMENTO, Nombre FROM TipoDocumento");
    return rows;
  }

  async getRoles() {
    const [rows] = await database.query("SELECT ID_ROL, Nombre FROM Roles");
    return rows;
  }
  async getAllCities() {
  const [rows] = await database.query(
    "SELECT ID_CIUDAD, Nombre FROM Ciudad"
  );
  return rows;
}
}

module.exports = new LocationService();