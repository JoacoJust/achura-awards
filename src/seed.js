require('dotenv').config();
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const Categoria = require('./models/Categoria');
const Opcion = require('./models/Opcion');
const Admin = require('./models/Admin');

// Fuente de verdad del contenido: el mismo categories.json que usa el frontend React
const CATEGORIES_JSON = path.join(__dirname, '../web/src/data/categories.json');

(async () => {
  await connectDB();
  const categoriasJson = require(CATEGORIES_JSON);

  // ---------- Admin ----------
  const email = (process.env.ADMIN_EMAIL || 'admin@achura.com').toLowerCase();
  if (!(await Admin.findOne({ email }))) {
    await Admin.create({
      email,
      password_hash: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'achura2026', 10),
      nombre: 'Admin Achura',
    });
    console.log(`👤 Admin creado: ${email}`);
  }

  // ---------- Categorías + opciones desde categories.json ----------
  const idsWeb = [];
  for (let i = 0; i < categoriasJson.length; i++) {
    const c = categoriasJson[i];
    idsWeb.push(c.id);

    let cat = await Categoria.findOne({ id_web: c.id });
    if (!cat) cat = await Categoria.findOne({ nombre: c.nombre });
    if (!cat) cat = new Categoria({ id_web: c.id, posicion: i + 1 });

    // Se actualiza el contenido, pero nunca se tocan votos/contadores
    cat.id_web = c.id;
    cat.nombre = c.nombre;
    cat.descripcion = c.descripcion || '';
    cat.tipo_media = c.tipo || 'imagen';
    cat.mencion = c.mencion || '';
    cat.permite_votar = c.permite_votar !== false;
    cat.poster_url = c.poster || null;
    cat.posicion = i + 1;
    cat.activa = true;
    await cat.save();

    for (let j = 0; j < (c.nominados || []).length; j++) {
      const n = c.nominados[j];
      let op = await Opcion.findOne({ categoria: cat._id, id_web: n.id });
      if (!op) op = new Opcion({ categoria: cat._id, id_web: n.id, posicion: j + 1 });

      op.nombre = n.nombre;
      op.descripcion = n.descripcion || '';
      // El tipo real de cada opción se decide por el archivo, no por la terna:
      // si el media es un video de verdad se guarda como video; si es una foto, como imagen.
      // (El placeholder .mp4 no cuenta como video: así las fotos no se muestran con ▶)
      const media = n.media || '';
      const esVideo = /\.(mp4|webm|mov|m4v|ogv)$/i.test(media) && !/placeholder/i.test(media);
      const esImagen = /\.(jpe?g|png|webp|gif|avif)$/i.test(media);
      op.imagen_url = esVideo ? n.poster || null : esImagen ? media : n.poster || media || null;
      op.video_url = esVideo ? media : null;
      op.poster_url = n.poster || null;
      op.story = (n.story || []).map((b) => ({ tipo: b.tipo || 'texto', contenido: b.contenido || '' }));
      op.posicion = j + 1;
      await op.save();
    }
    // Las opciones que ya no están en el JSON se borran (salvo que ya tengan votos)
    const idsOpciones = (c.nominados || []).map((n) => n.id);
    const sobrantes = await Opcion.find({ categoria: cat._id, id_web: { $nin: idsOpciones } });
    for (const s of sobrantes) {
      if (s.votos > 0) {
        console.log(`  ⚠ ${c.nombre}: "${s.nombre}" ya no está en el JSON pero tiene ${s.votos} voto(s); no se borra`);
      } else {
        await Opcion.deleteOne({ _id: s._id });
        console.log(`  🗑 Borrada opción que ya no está en el JSON: ${c.nombre} / ${s.nombre}`);
      }
    }
    console.log(`  ✔ ${c.nombre} (${(c.nominados || []).length} nominados)`);
  }

  // ---------- Las categorías viejas que ya no están en el JSON se desactivan ----------
  const viejas = await Categoria.find({ activa: true, id_web: { $nin: idsWeb } });
  for (const v of viejas) {
    v.activa = false;
    await v.save();
    console.log(`  ⏻ Desactivada (ya no está en categories.json): ${v.nombre}`);
  }

  console.log(`✅ Seed completado: ${categoriasJson.length} categorías`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
