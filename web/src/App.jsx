import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Emblem from './components/Emblem.jsx'
import miembros from './data/miembros.json'

/* ---------------------------------------------------------------
   El frontend NO guarda votos en el navegador: todo pasa por la API
   (MongoDB). La sesión de login se cambia por un JWT de votante en
   /api/auth/session-token y con ese token se vota en /api/votar.
---------------------------------------------------------------- */

let TOKEN = null

async function pedirToken() {
  const r = await fetch('/api/auth/session-token', { method: 'POST' })
  if (!r.ok) return null
  const d = await r.json()
  TOKEN = d.token
  return d
}

async function api(ruta, opciones = {}, reintento = true) {
  const r = await fetch(ruta, {
    ...opciones,
    headers: { ...(opciones.headers || {}), Authorization: 'Bearer ' + TOKEN },
  })
  // Token vencido: pedimos uno nuevo y reintentamos una sola vez
  if (r.status === 401 && TOKEN && reintento) {
    const nuevo = await pedirToken()
    if (nuevo) return api(ruta, opciones, false)
  }
  return r
}

// De la forma que viene la API a la forma que usa la UI
function aUI(c) {
  const r = {
    id: c.id,
    nombre: c.nombre,
    tipo: c.tipo === 'ambos' ? 'imagen' : c.tipo,
    mencion: c.mencion,
    votable: c.permite_votar !== false,
    poster_url: c.poster_url || null,
    nominados: c.opciones.map((o) => ({
      id: o.id,
      nombre: o.nombre,
      descripcion: o.descripcion,
      media: o.video_url || o.imagen_url,
      mediaTipo: o.video_url ? 'video' : 'imagen',
      poster: o.poster_url || o.imagen_url,
      // portada: la FOTO que se ve en el círculo de la home y en el espacio del nominado
      portada: o.imagen_url || o.poster_url || o.video_url || null,
      story: o.story || [],
    })),
  }
  // La foto del círculo de la terna en la home: la de la terna si tiene, si no la del primer nominado
  r.portada = r.poster_url || r.nominados.find((n) => n.portada)?.portada || null
  return r
}

export default function App() {
  const [estado, setEstado] = useState('cargando') // cargando | error | ok | sin-login
  const [categorias, setCategorias] = useState([])
  const [votos, setVotos] = useState({}) // { categoriaId: opcionId }
  const [usuario, setUsuario] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [cat, setCat] = useState(null) // categoría abierta
  const [openMedia, setOpenMedia] = useState(null) // nominado abierto en modal
  const [confirm, setConfirm] = useState(null) // {catId, nom}
  const [hecho, setHecho] = useState(null) // {catId, nom}
  const [tab, setTab] = useState('ternas') // pestaña: ternas | achuras
  const [achuraOpen, setAchuraOpen] = useState(null) // índice del modal de integrante
  const [sinFoto, setSinFoto] = useState({}) // fotos que no cargaron → mostramos el emblema

  const marcarSinFoto = (src) => setSinFoto((f) => ({ ...f, [src]: true }))

  const cargar = useCallback(async () => {
    setEstado('cargando')
    const sesion = await pedirToken()
    if (!sesion) return setEstado('sin-login')
    setUsuario(sesion.usuario)

    const r = await api('/api/categorias')
    if (!r.ok) return setEstado('error')
    const d = await r.json()
    const lista = (d.data || []).map(aUI)
    const votosServer = {}
    ;(d.data || []).forEach((c) => { if (c.ya_voto && c.opcion_elegida) votosServer[c.id] = c.opcion_elegida })
    setCategorias(lista)
    setVotos(votosServer)
    setEstado('ok')
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const votadas = Object.keys(votos).length
  const total = categorias.filter((c) => c.votable).length
  const todas = total > 0 && votadas === total

  const cerrarSesion = async () => {
    await fetch('/logout', { method: 'POST' })
    location.href = '/login'
  }

  const confirmarVoto = async (catId, nom) => {
    setAviso(null)
    const r = await api('/api/votar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoria_id: catId, opcion_id: nom.id }),
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) {
      setConfirm(null)
      setAviso(d.error || 'No se pudo registrar el voto')
      if (String(d.error || '').toLowerCase().includes('ya has votado')) cargar()
      return
    }
    setVotos((v) => ({ ...v, [catId]: nom.id }))
    setHecho({ catId, nom })
    setConfirm(null)
  }

  if (estado === 'cargando') {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/60">
        <p className="font-serif tracking-[.3em] uppercase animate-pulse">Cargando ternas…</p>
      </div>
    )
  }

  if (estado === 'sin-login') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-serif text-3xl">ACHURA AWARDS</h1>
        <p className="text-white/70">Iniciá sesión para votar.</p>
        <a href="/login" className="bg-gold text-black px-6 py-3 rounded-full font-semibold">Ingresar</a>
      </div>
    )
  }

  if (estado === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-serif text-3xl">No se pudieron cargar las ternas</h1>
        <p className="text-white/70">Revisá la conexión con el servidor e intentá de nuevo.</p>
        <button onClick={cargar} className="bg-gold text-black px-6 py-3 rounded-full font-semibold">Reintentar</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen font-sans">
      {/* Barra de progreso */}
      <div className="sticky top-0 z-20 backdrop-blur bg-black/50 border-b border-white/10 px-4 py-2 flex justify-between items-center text-xs text-white/70">
        <span>ACHURA AWARDS{usuario ? ` · ${usuario.nombre}` : ''}</span>
        <span className="flex items-center gap-4">
          <span>{votadas}/{total} categorías votadas</span>
          <button onClick={cerrarSesion} className="underline hover:text-white">Salir</button>
        </span>
      </div>

      {aviso && (
        <div className="max-w-xl mx-auto mt-4 px-4">
          <p className="bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm text-center">{aviso}</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {todas ? (
          <motion.div key="fin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto text-center py-24 px-6">
            <h1 className="font-serif text-4xl mb-4">¡Gracias por votar!</h1>
            <p className="text-white/70">Completaste las {total} ternas. Los luchos de oro…</p>
            <button className="mt-8 border border-white/40 px-6 py-3 rounded" onClick={() => { setCat(null) }}>Volver a las ternas</button>
          </motion.div>
        ) : !cat ? (
          <motion.div key="home" initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <header className="text-center py-14">
              <h1 className="font-serif text-5xl tracking-[.2em]">ACHURA AWARDS</h1>
              <p className="font-serif tracking-[.4em] text-gold mt-2">TERNAS</p>
              <p className="text-white/60 mt-2 italic">Los luchos de oro…</p>
            </header>
            <nav className="flex justify-center gap-6 text-xs tracking-[.2em] uppercase text-white/60 mb-6">
              {['ternas', 'achuras'].map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`pb-1 border-b ${tab === t ? 'text-gold border-gold' : 'border-transparent hover:text-white'}`}>{t === 'ternas' ? 'Ternas' : 'Achura FC'}</button>
              ))}
            </nav>

            {tab === 'ternas' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 max-w-6xl mx-auto px-6 pb-20">
                {categorias.map((c) => (
                  <button key={c.id} onClick={() => setCat(c)} className="group flex flex-col items-center gap-3 text-center focus:outline-none" aria-label={`Abrir ${c.nombre}`}>
                    <span className="relative w-[130px] h-[130px] rounded-full overflow-hidden border-2 border-white/20 group-hover:border-gold transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-[0_0_18px_rgba(212,175,55,.5)] bg-white/5">
                      {c.portada && !sinFoto[c.portada] ? (
                        <img src={c.portada} alt={c.nombre} loading="lazy" className="w-full h-full object-cover" onError={() => marcarSinFoto(c.portada)} />
                      ) : (
                        <span className="flex items-center justify-center w-full h-full"><Emblem size={100} /></span>
                      )}
                    </span>
                    <span className="font-serif text-sm tracking-widest uppercase">{c.nombre}</span>
                    {votos[c.id] && <span className="text-gold text-xs">✓ Votado</span>}
                    {!c.votable && <span className="text-white/50 text-xs">▶ Solo video</span>}
                  </button>
                ))}
              </div>
            )}

            {tab === 'achuras' && (
              <div className="max-w-6xl mx-auto px-6 pb-20">
                <h2 className="font-serif text-2xl tracking-[.2em] text-center mb-8 uppercase">Achura FC</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                  {miembros.map((m, i) => (
                    <button key={i} onClick={() => setAchuraOpen(i)} className="group flex flex-col bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:border-gold/50 transition">
                      <img src={m.imagen} alt={m.nombre} loading="lazy" className="rounded-lg w-full aspect-[4/5] object-cover border-2 border-white/20 group-hover:border-gold transition" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                      <span className="mt-3 font-serif text-sm font-semibold text-gold">{m.nombre}</span>
                      <div className="mt-2 flex flex-wrap gap-1 justify-center">
                        {m.apodos.slice(0, 3).map((a, j) => (
                          <span key={j} className="border border-white/20 rounded-full px-2 py-0.5 text-[10px] text-white/60 uppercase">{a}</span>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-white/70 italic">{m.descripcion}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </motion.div>
        ) : (
          <motion.div key={cat.id} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-5xl mx-auto px-6 py-12">
            <button onClick={() => setCat(null)} className="mb-8 text-white/70 underline">← Volver a las ternas</button>
            <div className="flex items-center gap-4 mb-10">
              <Emblem size={70} />
              <h2 className="font-serif text-3xl uppercase tracking-widest">{cat.nombre}</h2>
            </div>

            {votos[cat.id] ? (
              <p className="text-gold">✓ Ya votaste en esta terna.</p>
            ) : (
              <div className={`grid gap-6 ${cat.nominados.length === 1 ? 'grid-cols-1 max-w-md mx-auto' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
                {cat.nominados.map((n) => (
                  <div key={n.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-3">
                    <button onClick={() => setOpenMedia({ cat, nom: n })} aria-label={`Ver ${n.mediaTipo === 'video' ? 'video' : 'foto'} de ${n.nombre}`} className="relative w-full group/foto">
                      {n.portada && !sinFoto[n.portada] ? (
                        <img src={n.portada} alt={n.nombre} loading="lazy" className="rounded-lg w-full h-40 object-cover transition group-hover/foto:opacity-80" onError={() => marcarSinFoto(n.portada)} />
                      ) : (
                        <span className="rounded-lg w-full h-40 bg-white/5 flex items-center justify-center text-3xl">📷</span>
                      )}
                      {(cat.tipo === 'video' || n.mediaTipo === 'video') && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="bg-black/60 text-white rounded-full w-10 h-10 flex items-center justify-center text-sm">▶</span>
                        </span>
                      )}
                      {cat.tipo === 'story' && (
                        <span className="absolute bottom-2 right-2 bg-black/70 text-white rounded-full px-2 py-0.5 text-[10px] uppercase">📖 Historia</span>
                      )}
                    </button>
                    <h3 className="font-semibold text-center">{n.nombre}</h3>
                    <p className="text-xs text-white/60 text-center line-clamp-2">{n.descripcion}</p>
                    {!cat.votable || (cat.nominados.length === 1 && cat.tipo === 'video') ? (
                      <button onClick={() => setOpenMedia({ cat, nom: n })} className="mt-auto bg-white/10 border border-white/30 text-white px-5 py-2 rounded-full font-semibold">▶ Reproducir</button>
                    ) : null}
                    {cat.votable && (
                      <button onClick={() => setConfirm({ catId: cat.id, nom: n })} className="mt-auto bg-gold text-black px-5 py-2 rounded-full font-semibold">VOTAR</button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Mención honorífica de la terna */}
            <div className="mt-10 bg-white/5 border border-gold/40 rounded-xl p-5 max-w-3xl mx-auto">
              <h3 className="font-serif text-lg text-gold text-center">🎖 Mención honorífica</h3>
              <p className="text-sm text-white/70 mt-2 text-center">{cat.mencion || 'No hay mención honorífica cargada para esta terna.'}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal media */}
      <AnimatePresence>
        {openMedia && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpenMedia(null)} className="fixed inset-0 z-30 bg-black/90 flex items-center justify-center p-6">
            <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
              <button className="absolute top-4 right-6 text-2xl" onClick={() => setOpenMedia(null)}>✕</button>
              {openMedia.cat.tipo === 'video' && <video src={openMedia.nom.media} poster={openMedia.nom.poster} controls autoPlay className="w-full rounded-xl" />}
              {openMedia.cat.tipo === 'imagen' && (openMedia.nom.mediaTipo === 'video'
                ? <video src={openMedia.nom.media} poster={openMedia.nom.poster} controls autoPlay className="w-full rounded-xl" />
                : <img src={openMedia.nom.media} alt={openMedia.nom.nombre} className="w-full rounded-xl" />)}
              {openMedia.cat.tipo === 'story' && (
                <div className="text-white/90 space-y-4 max-h-[70vh] overflow-auto">
                  <h3 className="font-serif text-2xl">{openMedia.nom.nombre}</h3>
                  {openMedia.nom.story?.map((b, i) => <p key={i}>{b.contenido}</p>)}
                </div>
              )}
              {openMedia.cat.votable && <button onClick={() => { setConfirm({ catId: openMedia.cat.id, nom: openMedia.nom }); setOpenMedia(null) }} className="mt-4 bg-gold text-black px-6 py-3 rounded-full font-semibold">VOTAR</button>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal integrante */}
      <AnimatePresence>
        {achuraOpen !== null && miembros[achuraOpen] && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAchuraOpen(null)} className="fixed inset-0 z-30 bg-black/90 flex items-center justify-center p-6">
            <div className="bg-black/80 border border-white/20 rounded-2xl p-8 max-w-lg w-full text-center" onClick={(e) => e.stopPropagation()}>
              <button className="absolute top-4 right-6 text-2xl" onClick={() => setAchuraOpen(null)}>✕</button>
              <img src={miembros[achuraOpen].imagen} alt={miembros[achuraOpen].nombre} className="w-full max-h-80 object-cover rounded-xl" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              <h3 className="font-serif text-2xl mt-4">{miembros[achuraOpen].nombre}</h3>
              <div className="flex flex-wrap gap-2 justify-center mt-3">
                {miembros[achuraOpen].apodos.map((a, j) => <span key={j} className="border border-gold/50 text-gold rounded-full px-3 py-1 text-xs uppercase">{a}</span>)}
              </div>
              <p className="mt-4 text-white/80">{miembros[achuraOpen].descripcion}</p>
              <div className="mt-6 flex justify-between">
                <button className="border border-white/30 px-4 py-2 rounded" onClick={() => setAchuraOpen((i) => (i - 1 + miembros.length) % miembros.length)}>← Anterior</button>
                <button className="border border-white/30 px-4 py-2 rounded" onClick={() => setAchuraOpen((i) => (i + 1) % miembros.length)}>Siguiente →</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmación */}
      <AnimatePresence>
        {confirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-6">
            <div className="bg-teal2 border border-white/20 rounded-2xl p-8 max-w-md text-center">
              <p className="text-lg">¿Confirmás tu voto por <b>{confirm.nom.nombre}</b>?</p>
              <div className="mt-6 flex justify-center gap-4">
                <button className="px-6 py-3 rounded border border-white/30" onClick={() => setConfirm(null)}>Cancelar</button>
                <button className="px-6 py-3 rounded bg-gold text-black font-semibold" onClick={() => confirmarVoto(confirm.catId, confirm.nom)}>Confirmar</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Éxito */}
      <AnimatePresence>
        {hecho && (
          <motion.div initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-6" onClick={() => setHecho(null)}>
            <div className="bg-teal2 border border-gold rounded-2xl p-10 text-center max-w-md">
              <p className="font-serif text-3xl mb-2">✨ Tu voto fue registrado</p>
              <p className="text-white/70">Gracias por participar.</p>
              <button className="mt-6 bg-gold text-black px-6 py-3 rounded-full font-semibold" onClick={() => { setHecho(null); setCat(null) }}>Volver a las ternas</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
