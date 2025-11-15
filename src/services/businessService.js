const database = require("../utils/database");

class BusinessService {
  async getBusinessesByUser(idUsuario) {
  const [rows] = await database.query(
    `SELECT 
        n.ID_NEGOCIOS, 
        n.NombreNegocio, 
        n.Descripcion, 
        c.Nombre AS Ciudad,
        n.Direccion, 
        n.Horario, 
        n.NumTelefono AS Telefono, 
        n.RUT,
        n.Imagen,
        n.Logo,
        
        -- Categoría
        n.ID_CATEGORIA,
        cat.NombreCategoria AS Categorias

     FROM negocios n
     JOIN ciudad c ON n.ID_CIUDAD = c.ID_CIUDAD
     JOIN categorias cat ON n.ID_CATEGORIA = cat.ID_CATEGORIAS

     WHERE n.ID_USUARIOS = ?`,
    [idUsuario]
  );

  if (rows.length === 0) {
    throw new Error("No se encontraron negocios para este usuario");
  }

  return rows;
}


  async getAllBusinesses() {
    const [rows] = await database.query(`
      SELECT 
        ID_NEGOCIOS,
        ID_USUARIOS,
        ID_CATEGORIA,
        ID_CIUDAD,
        NombreNegocio,
        RUT,
        Descripcion,
        Direccion,
        NumTelefono,
        Horario,
        Imagen,
        Logo
      FROM Negocios
    `);
    return rows;
  }

  async getBusinessById(id) {
    const [rows] = await database.query(
      "SELECT * FROM negocios WHERE ID_NEGOCIOS = ?",
      [id]
    );

    if (rows.length === 0) {
      throw new Error("Negocio no encontrado");
    }

    return rows[0];
  }

  async getBusinessDetails(id) {
    const [rows] = await database.execute(
      `
      SELECT n.*, c.Nombre AS Ciudad
      FROM Negocios n
      JOIN Ciudad c ON n.ID_CIUDAD = c.ID_CIUDAD
      WHERE n.ID_NEGOCIOS = ?
    `,
      [id]
    );

    if (rows.length === 0) {
      throw new Error("Negocio no encontrado");
    }

    return rows[0];
  }

  async createBusiness(businessData) {
    const {
      ID_USUARIOS,
      ID_CATEGORIA,
      ID_CIUDAD,
      NombreNegocio,
      RUT,
      Descripcion,
      Direccion,
      NumTelefono,
      Horario,
      Imagen,
    } = businessData;

    if (!ID_USUARIOS || !ID_CATEGORIA || !ID_CIUDAD || !NombreNegocio) {
      throw new Error("Faltan campos obligatorios");
    }

    const [result] = await database.execute(
      `INSERT INTO Negocios 
        (ID_USUARIOS, ID_CATEGORIA, ID_CIUDAD, NombreNegocio, RUT, Descripcion, Direccion, NumTelefono, Horario, Imagen)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ID_USUARIOS,
        ID_CATEGORIA,
        ID_CIUDAD,
        NombreNegocio,
        RUT,
        Descripcion,
        Direccion,
        NumTelefono,
        Horario,
        Imagen,
      ]
    );

    return {
      success: true,
      message: "Negocio guardado exitosamente",
      id: result.insertId,
    };
  }

  async getCategories() {
    const [filas] = await database.execute(
      "SELECT ID_CATEGORIAS, NombreCategoria FROM categorias"
    );
    return filas;
  }
}

module.exports = new BusinessService();
