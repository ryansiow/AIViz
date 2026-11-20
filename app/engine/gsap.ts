import { gsap } from 'gsap'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'

let registered = false

/** GSAP with the plugins this app uses, registered once (client only). */
export function getGsap() {
  if (!registered && import.meta.client) {
    gsap.registerPlugin(DrawSVGPlugin)
    gsap.defaults({ ease: 'power2.out' })
    registered = true
  }
  return gsap
}
