"use client"

import { useEffect, useRef } from "react"
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion"

function Tile({ x, y, width, height, tone, delay }: { x: number; y: number; width: number; height: number; tone: "teal" | "coral" | "ink"; delay: number }) {
  const faces = tone === "teal" ? { top: "#72c8bb", left: "#3ea99a", right: "#168879" } : tone === "coral" ? { top: "#f0b19d", left: "#dc8b73", right: "#bd6854" } : { top: "#526978", left: "#354c5a", right: "#233845" }
  return <motion.g initial={{ opacity: 0, y: 35 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay, duration: 0.6, type: "spring", stiffness: 110, damping: 18 }}>
    <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 3.8 + delay, repeat: Infinity, ease: "easeInOut", delay }}>
      <path d={`M${x} ${y} L${x + width} ${y - width / 2} L${x + width * 2} ${y} L${x + width} ${y + width / 2} Z`} fill={faces.top} stroke="#d5e4e4" strokeWidth="1" />
      <path d={`M${x} ${y} L${x} ${y + height} L${x + width} ${y + height + width / 2} L${x + width} ${y + width / 2} Z`} fill={faces.left} stroke="#d5e4e4" strokeWidth="1" />
      <path d={`M${x + width} ${y + width / 2} L${x + width} ${y + height + width / 2} L${x + width * 2} ${y + height} L${x + width * 2} ${y} Z`} fill={faces.right} stroke="#d5e4e4" strokeWidth="1" />
      {Array.from({ length: Math.max(1, Math.floor(height / 22)) }).map((_, index) => <rect key={index} x={x + 9} y={y + 15 + index * 22} width={width - 18} height="7" rx="2" fill="#ffffff" opacity="0.5" />)}
    </motion.g>
  </motion.g>
}

function DataLine({ d, delay }: { d: string; delay: number }) {
  return <>
    <motion.path d={d} fill="none" stroke="#18a999" strokeWidth="3" strokeLinecap="round" initial={{ pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: 1 }} viewport={{ once: true }} transition={{ delay, duration: 0.9 }} />
    <motion.circle r="4" fill="#f0a185" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0], offsetDistance: ["0%", "100%"] }} transition={{ delay: delay + 0.8, duration: 2.4, repeat: Infinity, ease: "linear" }} style={{ offsetPath: `path("${d}")` }} />
  </>
}

export function IsometricScene() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const springX = useSpring(pointerX, { damping: 28, stiffness: 115 })
  const springY = useSpring(pointerY, { damping: 28, stiffness: 115 })
  const rotateX = useTransform(springY, [-300, 300], [5, -5])
  const rotateY = useTransform(springX, [-300, 300], [-6, 6])

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      if (!ref.current) return
      const bounds = ref.current.getBoundingClientRect()
      pointerX.set(event.clientX - (bounds.left + bounds.width / 2))
      pointerY.set(event.clientY - (bounds.top + bounds.height / 2))
    }
    window.addEventListener("mousemove", onMove)
    return () => window.removeEventListener("mousemove", onMove)
  }, [pointerX, pointerY])

  return <div ref={ref} className="isometric-scene"><motion.svg width="520" height="430" viewBox="0 0 520 430" role="img" aria-label="Datasets moving through a permission layer" style={{ rotateX, rotateY }}>
    <ellipse cx="280" cy="350" rx="190" ry="30" fill="#102333" opacity="0.08" />
    <path d="M95 260 L280 168 L465 260 L280 353 Z" fill="#102333" />
    <path d="M95 260 L95 278 L280 372 L280 353 Z" fill="#1c3544" />
    <path d="M280 353 L280 372 L465 278 L465 260 Z" fill="#294755" />
    <path d="M130 260 L280 185 L430 260 L280 334 Z" fill="#173140" stroke="#2f5d67" strokeWidth="1" />
    <path d="M160 260 L280 200 L400 260 L280 320 Z" fill="none" stroke="#2f5d67" strokeWidth="1" strokeDasharray="4 7" />
    <DataLine d="M146 238 Q220 190 280 190" delay={0.2} />
    <DataLine d="M280 190 Q350 190 418 235" delay={0.4} />
    <DataLine d="M140 275 Q220 317 332 313" delay={0.6} />
    <Tile x={175} y={273} width={35} height={70} tone="teal" delay={0.1} />
    <Tile x={240} y={238} width={35} height={102} tone="coral" delay={0.22} />
    <Tile x={305} y={267} width={35} height={72} tone="ink" delay={0.34} />
    <Tile x={370} y={286} width={35} height={50} tone="teal" delay={0.46} />
    <motion.g initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : undefined} transition={{ delay: 0.9, duration: 0.55 }}>
      <rect x="62" y="170" width="82" height="57" rx="7" fill="#ffffff" stroke="#cbdadd" />
      <text x="76" y="190" fontSize="9" fill="#66808b" fontFamily="var(--font-mono)" letterSpacing="1">REQUEST</text>
      <text x="76" y="209" fontSize="12" fill="#102333" fontWeight="700">AI AGENT</text>
      <circle cx="130" cy="194" r="4" fill="#18a999" />
    </motion.g>
    <motion.g initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : undefined} transition={{ delay: 1.05, duration: 0.55 }}>
      <rect x="361" y="104" width="104" height="58" rx="7" fill="#ffffff" stroke="#cbdadd" />
      <text x="376" y="124" fontSize="9" fill="#66808b" fontFamily="var(--font-mono)" letterSpacing="1">PASSPORT</text>
      <text x="376" y="143" fontSize="12" fill="#102333" fontWeight="700">VERIFIED</text>
      <path d="M438 132 l5 5 9-11" fill="none" stroke="#18a999" strokeWidth="2" />
    </motion.g>
    <motion.g initial={{ opacity: 0 }} animate={inView ? { opacity: [0.35, 0.9, 0.35] } : undefined} transition={{ delay: 1.2, duration: 2.6, repeat: Infinity }}>
      <circle cx="235" cy="94" r="4" fill="#f0a185" /><circle cx="329" cy="74" r="3" fill="#18a999" /><circle cx="438" cy="215" r="4" fill="#f0a185" />
    </motion.g>
  </motion.svg></div>
}
