import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Emblem from './components/Emblem.jsx'
import categories from './data/categories.json'
import miembros from './data/miembros.json'

const STORAGE = 'achura_votos_v1'
const getVotos = () => { try { return JSON.parse(localStorage.getItem(STORAGE)) || {} } catch { return {} } }
const saveVoto = (catId, nomId) => localStorage.setItem(STORAGE, JSON.stringify({ ...getVotos(), [catId]: nomId }))

export default function App() {
  const [votos, setVotos] = useState(getVotos())
  const [cat, setCat] = useState(null) // categoría abierta
  const [openMedia, setOpenMedia] = useState(null) // nominado abierto en modal
  const [confirm, setConfirm] = useState(null) // {catId, nom}
  const [hecho, setHecho] = useState(null) // {catId, nom}
  const [tab, setTab] = useState('ternas') // pestaña: ternas | achuras | menciones
  const [achuraOpen, setAchuraOpen] = useState(null) // índice del modal de integrante

  const votadas = Object.keys(votos).length
  const total = categories.length
  const todas = votadas === total

  const confirmarVoto = (catId, nomId) => {
    saveVoto(catId, nomId)
    setVotos(getVotos())
    setHecho({ catId, nomId })
    setConfirm(null)
  }

  return (
    <div className="min-h-screen font-sans">
      {/* Barra de progreso */}
      <div className="sticky top-0 z-20 backdrop-blur bg-black/50 border-b border-white/10 px-4 py-2 flex justify-between text-xs text-white/70">
        <span>ACHURA AWARDS</span>
        <span>{votadas}/{total} categorías votadas</span>
      </div>

      <AnimatePresence mode="wait">
        {todas ? (
          <motion.div key="fin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto text-center py-24 px-6">
            <h1 className="font-serif text-4xl mb-4">¡Gracias por votar!</h1>
            <p className="text-white/70">Completaste las {total} ternas. Los luchos de oro…</p>
            <button className="mt-8 border border-white/40 px-6 py-3 rounded" onClick={() => { localStorage.removeItem(STORAGE); setVotos({}); setCat(null) }}>Reiniciar votos</button>
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
              {categories.map((c) => (
                <button key={c.id} onClick={() => setCat(c)} className="group flex flex-col items-center gap-3 text-center focus:outline-none" aria-label={`Abrir ${c.nombre}`}>
                  <span className="transition-transform duration-300 group-hover:scale-105 group-hover:drop-shadow-[0_0_18px_rgba(212,175,55,.5)]">
                    <Emblem size={130} />
                  </span>
                  <span className="font-serif text-sm tracking-widest uppercase">{c.nombre}</span>
                  {votos[c.id] && <span className="text-gold text-xs">✓ Votado</span>}
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
                    <button onClick={() => setOpenMedia({ cat, nom: n })} aria-label={`Ver ${cat.tipo} de ${n.nombre}`}>
                      {cat.tipo === 'imagen' && <img src={n.media} alt={n.nombre} className="rounded-lg w-full h-40 object-cover" />}
                      {cat.tipo === 'video' && <video src={n.media} poster={n.poster} muted loop playsInline className="rounded-lg w-full h-40 object-cover hover:opacity-80 transition" onMouseEnter={(e) => e.currentTarget.play()} onMouseLeave={(e) => e.currentTarget.pause()} />}
                      {cat.tipo === 'story' && <div className="rounded-lg w-full h-40 bg-white/5 flex items-center p-4 text-left text-sm text-white/80 overflow-hidden">{n.story?.[0]?.contenido || 'Historia sin registrar'}</div>}
                    </button>
                    <h3 className="font-semibold">{n.nombre}</h3>
                    <p className="text-xs text-white/60 text-center">{n.descripcion}</p>
                    {cat.tipo === 'story' && <button className="text-xs underline text-white/70" onClick={() => setOpenMedia({ cat, nom: n })}>Ver historia</button>}
                    {cat.nominados.length === 1 && cat.tipo === 'video' ? (
                      <button onClick={() => setOpenMedia({ cat, nom: n })} className="mt-auto bg-gold text-black px-5 py-2 rounded-full font-semibold">▶ Reproducir</button>
                    ) : (
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
              {openMedia.cat.tipo === 'video' && <video src={openMedia.nom.media} controls autoPlay className="w-full rounded-xl" />}
              {openMedia.cat.tipo === 'imagen' && <img src={openMedia.nom.media} alt={openMedia.nom.nombre} className="w-full rounded-xl" />}
              {openMedia.cat.tipo === 'story' && (
                <div className="text-white/90 space-y-4 max-h-[70vh] overflow-auto">
                  <h3 className="font-serif text-2xl">{openMedia.nom.nombre}</h3>
                  {openMedia.nom.story?.map((b, i) => <p key={i}>{b.contenido}</p>)}
                </div>
              )}
              {openMedia.cat.nominados.length === 1 && openMedia.cat.tipo === 'video' ? null : <button onClick={() => { setConfirm({ catId: openMedia.cat.id, nom: openMedia.nom }); setOpenMedia(null) }} className="mt-4 bg-gold text-black px-6 py-3 rounded-full font-semibold">VOTAR</button>}
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
                <button className="px-6 py-3 rounded bg-gold text-black font-semibold" onClick={() => confirmarVoto(confirm.catId, confirm.nom.id)}>Confirmar</button>
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
