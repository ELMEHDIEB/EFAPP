
import { motion } from "framer-motion";
import { scaleIn } from "../../utils/motionPresets";
import { tokens } from "../../styles/designTokens";

const variantStyles = {
  empty: {
    iconBg: "bg-surfaceElevated text-textdim",
    border: "border-border",
    titleColor: "text-white"
  },
  warning: {
    iconBg: "bg-warn/10 text-warn",
    border: "border-warn/20",
    titleColor: "text-warn"
  },
  success: {
    iconBg: "bg-success/10 text-success",
    border: "border-success/20",
    titleColor: "text-success"
  },
  danger: {
    iconBg: "bg-danger/10 text-danger",
    border: "border-danger/20",
    titleColor: "text-danger"
  }
};

export default function EmptyState({ 
  variant = "empty", 
  icon, 
  title, 
  description, 
  action, 
  className = "" 
}) {
  const styles = variantStyles[variant] || variantStyles.empty;

  return (
    <motion.div 
      variants={scaleIn}
      initial="initial"
      animate="animate"
      className={`flex flex-col items-center justify-center p-12 text-center border ${styles.border} ${tokens.surfaces.surface} ${tokens.radius.lg} ${className}`}
    >
      <div className={`w-16 h-16 mb-6 ${tokens.radius.full} ${styles.iconBg} flex items-center justify-center`}>
        {icon ? icon : (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
      </div>
      <h3 className={`${tokens.typography.h2} ${styles.titleColor} mb-2`}>{title}</h3>
      <p className={`${tokens.typography.body} text-textdim max-w-sm mx-auto mb-6`}>{description}</p>
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </motion.div>
  );
}
