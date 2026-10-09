const Categoria = require('../models/Categoria');
const Opcion = require('../models/Opcion');

async function asignarImagenesTernas() {
  try {
    console.log('🔍 Buscando ternas para asignar imágenes...');

    // "Achura más Gay del Año" - primera opción (siempre actualizar)
    const catGay = await Categoria.findOne({ nombre: 'Achura más Gay del Año' });
    if (catGay) {
      const opcionGay = await Opcion.findOne({ categoria: catGay._id }).sort({ posicion: 1 });
      if (opcionGay) {
        opcionGay.imagen_url = '/img/achura-mas-gay.jpg';
        await opcionGay.save();
        console.log('✅ Imagen asignada a "Achura más Gay del Año":', opcionGay.nombre);
      } else {
        const nuevaOpcion = await Opcion.create({
          categoria: catGay._id,
          nombre: 'Candidato 1',
          posicion: 1,
          imagen_url: '/img/achura-mas-gay.jpg'
        });
        console.log('✅ Opción creada con imagen en "Achura más Gay del Año"');
      }
    }

    // "Mejores momentos pad" - crear si no existe o actualizar primera opción
    let catMomentos = await Categoria.findOne({ 
      nombre: { $regex: /momentos? pad/i } 
    });
    
    if (!catMomentos) {
      catMomentos = await Categoria.create({ 
        nombre: 'Mejores momentos pad', 
        posicion: 18 
      });
      console.log('✅ Categoría creada: "Mejores momentos pad"');
    }

    const opcionMomentos = await Opcion.findOne({ categoria: catMomentos._id }).sort({ posicion: 1 });
    if (opcionMomentos) {
      opcionMomentos.imagen_url = '/img/mejores-momentos-pad.jpg';
      await opcionMomentos.save();
      console.log('✅ Imagen asignada a "Mejores momentos pad":', opcionMomentos.nombre);
    } else {
      const nuevaOpcion = await Opcion.create({
        categoria: catMomentos._id,
        nombre: 'Momento épico',
        posicion: 1,
        imagen_url: '/img/mejores-momentos-pad.jpg'
      });
      console.log('✅ Opción creada con imagen en "Mejores momentos pad"');
    }

    console.log('🎉 Migración de imágenes completada');
  } catch (error) {
    console.error('❌ Error en migración de imágenes:', error);
  }
}

module.exports = asignarImagenesTernas;
