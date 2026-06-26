
import { motion } from "framer-motion";
import { slideUp, fadeIn, staggerContainer } from "../../utils/motionPresets";
import { tokens } from "../../styles/designTokens";

export default function HeroHeader({ 
  title, 
  description, 
  stats = [], 
  actions, 
  className = "" 
}) {
  return (
    <motion.div 
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className={`w-full mb-8 flex flex-col md:flex-row gap-6 md:items-end justify-between ${className}`}
    >
      <div className="flex-1">
        <motion.h1 variants={slideUp} className={`${tokens.typography.h1} text-white mb-2`}>
          {title}
        </motion.h1>
        {description && (
          <motion.p variants={slideUp} className={`${tokens.typography.body} text-textdim max-w-2xl`}>
            {description}
          </motion.p>
        )}
        
        {stats && stats.length > 0 && (
          <motion.div variants={fadeIn} className="flex gap-6 mt-6">
            {stats.map((stat, idx) => (
              <div key={idx} className="flex flex-col gap-1">
                <span className={`${tokens.typography.caption} text-textmuted uppercase tracking-widest`}>
                  {stat.label}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className={`${tokens.typography.h2} text-white`}>
                    {stat.value}
                  </span>
                  {stat.trend && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      stat.trendType === 'positive' ? 'bg-success/10 text-success' : 
                      stat.trendType === 'negative' ? 'bg-danger/10 text-danger' : 
                      'bg-surfaceElevated text-textdim'
                    }`}>
                      {stat.trend}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {actions && (
        <motion.div variants={slideUp} className="flex items-center gap-3 shrink-0">
          {actions}
        </motion.div>
      )}
    </motion.div>
  );
}
