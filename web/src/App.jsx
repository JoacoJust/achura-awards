import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Emblem from './components/Emblem.jsx'
import categories from './data/categories.json'

const STORAGE = 'achura_votos_v1'
const getVotos = () => { try { return JSON.parse(localStorage.getItem(STORAGE)) || {} } catch { return {} } }
const saveVoto = (catId, nomId) => localStorage.setItem(STORAGE, JSON.stringify({ ...getVotos(), [catId]: nomId }))

export default function App() {
  const [votos, setVotos] = useState(getVotos())
  const [cat, setCat] = useState(null) // categoría abierta
  const [openMedia, setOpenMedia] = useState(null) // nominado abierto en modal
  const [confirm, setConfirm] = useState(null) // {catId, nom}
  const [hecho, setHecho] = useState(null) // {catId, nom}

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
            <p className="text-white/70">Completaste las {total} ternas. Los premios más picantes… 🚬</p>
            <button className="mt-8 border border-white/40 px-6 py-3 rounded" onClick={() => { localStorage.removeItem(STORAGE); setVotos({}); setCat(null) }}>Reiniciar votos</button>
          </motion.div>
        ) : !cat ? (
          <motion.div key="home" initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <header className="text-center py-14">
              <h1 className="font-serif text-5xl tracking-[.2em]">ACHURA AWARDS</h1>
              <p className="font-serif tracking-[.4em] text-gold mt-2">TERNAS</p>
              <p className="text-white/60 mt-2 italic">Los premios más <em className="font-serif">Picantes</em>…</p>
            </header>
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
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {cat.nominados.map((n) => (
                  <div key={n.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-3">
                    <button onClick={() => setOpenMedia({ cat, nom: n })} aria-label={`Ver ${cat.tipo} de ${n.nombre}`}>
                      {cat.tipo === 'imagen' ? (
                        <img src={n.media} alt={n.nombre} className="rounded-lg w-full h-40 object-cover" />
                      ) : (
                        <video src={n.media} poster={n.poster} muted loop playsInline className="rounded-lg w-full h-40 object-cover hover:opacity-80 transition" onMouseEnter={(e) => e.currentTarget.play()} onMouseLeave={(e) => e.currentTarget.pause()} />
                      )}
                    </button>
                    <h3 className="font-semibold">{n.nombre}</h3>
                    <p className="text-xs text-white/60 text-center">{n.descripcion}</p>
                    {cat.tipo === 'story' && <button className="text-xs underline text-white/70" onClick={() => setOpenMedia({ cat, nom: n })}>Ver historia</button>}
                    <button onClick={() => setConfirm({ catId: cat.id, nom: n })} className="mt-auto bg-gold text-black px-5 py-2 rounded-full font-semibold">VOTAR</button>
                  </div>
                ))}
              </div>
            )}
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
              <button onClick={() => { setConfirm({ catId: openMedia.cat.id, nom: openMedia.nom }); setOpenMedia(null) }} className="mt-4 bg-gold text-black px-6 py-3 rounded-full font-semibold">VOTAR</button>
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
