import { motion } from "framer-motion"
import type { SVGMotionProps } from "framer-motion"

export function Logo(props: SVGMotionProps<SVGSVGElement>) {
  return (
    <motion.svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      initial="hidden"
      animate="visible"
      {...props}
    >
      <defs>
        <linearGradient id="q-grad-main" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d8b4fe" /> {/* purple-300 */}
          <stop offset="50%" stopColor="#a855f7" /> {/* purple-500 */}
          <stop offset="100%" stopColor="#7e22ce" /> {/* purple-700 */}
        </linearGradient>
        <linearGradient id="q-grad-tail" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c084fc" /> {/* purple-400 */}
          <stop offset="100%" stopColor="#7e22ce" /> {/* purple-700 */}
        </linearGradient>
        <linearGradient id="cap-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" /> {/* purple-500 */}
          <stop offset="100%" stopColor="#6b21a8" /> {/* purple-800 */}
        </linearGradient>
      </defs>

      <g>
        {/* Q Ring - spins and scales in */}
        <motion.path 
          d="M 45 15 C 22.9 15 5 32.9 5 55 C 5 77.1 22.9 95 45 95 C 62.5 95 77.3 84 83.2 68.6 C 85 63.8 85 58.5 85 55 C 85 32.9 67.1 15 45 15 Z M 45 35 C 56 35 65 44 65 55 C 65 66 56 75 45 75 C 34 75 25 66 25 55 C 25 44 34 35 45 35 Z" 
          fill="url(#q-grad-main)" 
          variants={{
            hidden: { opacity: 0, scale: 0.3, rotate: -90 },
            visible: { opacity: 1, scale: 1, rotate: 0, transition: { type: "spring", duration: 1.5, bounce: 0.5 } }
          }}
          style={{ originX: "45px", originY: "55px" }}
        />
        
        {/* Q Tail - pops out like a spring */}
        <motion.path 
          d="M 50 65 Q 65 75 75 95 Q 85 92 90 85 Q 80 65 65 50 Q 55 58 50 65 Z" 
          fill="url(#q-grad-tail)" 
          variants={{
            hidden: { opacity: 0, scale: 0 },
            visible: { opacity: 1, scale: 1, transition: { type: "spring", delay: 0.3, duration: 1, bounce: 0.6 } }
          }}
          style={{ originX: "65px", originY: "50px" }}
        />
        
        {/* Graduation Cap - drops down and bounces */}
        <motion.g 
          variants={{
            hidden: { opacity: 0, y: -40, scale: 0.8 },
            visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", delay: 0.6, duration: 1.2, bounce: 0.5 } }
          }}
        >
          <g transform="translate(68, 28) rotate(15) scale(1.4) translate(-50, -50)">
            {/* Skull Cap Bowl */}
            <path 
              d="M 32,50 V 55 Q 50,65 68,55 V 50" 
              fill="url(#cap-grad)" 
              stroke="white" 
              strokeWidth="3" 
              strokeLinejoin="round" 
              strokeLinecap="round"
            />
            {/* Top Diamond Board */}
            <polygon 
              points="50,38 72,46 50,54 28,46" 
              fill="url(#cap-grad)" 
              stroke="white" 
              strokeWidth="3" 
              strokeLinejoin="round" 
            />
            
            {/* Tassel Group - swings like a pendulum */}
            <motion.g
              variants={{
                hidden: { rotate: 45 },
                visible: { rotate: [45, -15, 10, -5, 0], transition: { delay: 0.9, duration: 2, ease: "easeInOut" } }
              }}
              style={{ originX: "50px", originY: "46px" }}
            >
              {/* Tassel String */}
              <path 
                d="M 50,46 Q 70,52 68,70" 
                stroke="white" 
                strokeWidth="2" 
                fill="none" 
                strokeLinecap="round"
              />
              {/* Tassel End */}
              <polygon 
                points="65,70 71,70 73,78 63,78" 
                fill="white" 
                stroke="white"
                strokeWidth="1"
                strokeLinejoin="round"
              />
            </motion.g>
          </g>
        </motion.g>
      </g>
    </motion.svg>
  )
}
