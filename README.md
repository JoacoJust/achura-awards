# 🏆 Achura Awards

Sistema de votaciones online tipo "Coscu Army Awards".

## Stack

- Node.js 20+, Express 4, Mongoose 8 (MongoDB)
- JWT (votante y admin), bcrypt, Nodemailer, express-rate-limit, multer (uploads locales)

## Cómo levantar

```bash
npm install
copy .env.example .env
npm run seed    # crea admin + 17 categorías con 3 opciones placeholder
npm start       # http://localhost:3002
```

- Votación: http://localhost:3002
- Admin: http://localhost:3002/admin.html — `admin@achura.com` / `achura2026`

## Modo dev del email

Si no configurás SMTP en `.env`, el código de 6 dígitos aparece en la consola y también en la respuesta de `/api/auth/enviar-codigo` como `codigo_dev`. Con SMTP configurado se envía de verdad por email.

## API (resumen)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/enviar-codigo` | Enviar código al email |
| POST | `/api/auth/verificar-codigo` | Verificar y obtener JWT |
| GET | `/api/categorias` | Categorías con opciones (token votante) |
| GET | `/api/puede-votar/:categoria_id` | ¿Puede votar? |
| POST | `/api/votar` | Registrar voto (único por categoría) |
| POST | `/api/admin/login` | Login admin |
| GET | `/api/admin/dashboard` | Métricas |
| GET | `/api/admin/resultados` | Resultados por categoría |
| GET | `/api/admin/votantes?page=&limit=` | Votantes paginados |
| POST | `/api/admin/categorias` | Crear categoría |
| POST | `/api/admin/opciones` | Crear opción |
| PUT | `/api/admin/categorias/:id/toggle` | Activar/desactivar |
| POST | `/api/admin/upload-media` | Subir imagen/video (multipart, campo `file`) |
| GET | `/api/admin/reporte` | Descargar CSV |

## Reglas anti-fraude

- Un voto por usuario por categoría (índice único en `Voto`).
- Email = identidad única, código válido 15 minutos.
- IP y user-agent registrados en usuarios y votos.
- Rate limiting en envío/verificación de código y global.

## Para cargar las ternas reales

Cuando me pases las ternas: edito `src/seed.js` o las cargás desde el admin (crear opción + subir media). Los archivos se guardan en `public/uploads`.

## Nota

La versión simple anterior quedó en la raíz del proyecto (`server.js`, `public/` de la raíz). Esta es la versión completa según el spec (`PROMPT_COMPLETO_DEVELOPER.md`). Cuando confirmes que funciona, borramos la vieja.
