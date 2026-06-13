import { motion } from "motion/react";
import { Loader2 } from "lucide-react";

export function LoadingOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-xl flex flex-col items-center justify-center p-6 select-none"
    >
      <div className="relative flex flex-col items-center">
        {/* Holographic Background Glow */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            rotate: [0, 90, 180, 270, 360]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-gradient-to-tr from-indigo-500 via-rose-500 to-amber-500 rounded-full blur-[100px] -z-10 opacity-30"
        />

        <div className="relative h-24 w-24 flex items-center justify-center">
          {/* Rotating Outer Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 border-[3px] border-white/5 border-t-indigo-500 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)]"
          />
          {/* Counter Rotating Inner Ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-3 border-[2px] border-white/5 border-b-rose-500 rounded-full opacity-60"
          />
          {/* Pulsing Core */}
          <motion.div
            animate={{ 
              scale: [0.8, 1.1, 0.8],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="h-10 w-10 bg-white rounded-2xl flex items-center justify-center shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-rose-600" />
            <Loader2 className="h-5 w-5 text-white animate-spin relative z-10" />
          </motion.div>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", damping: 20 }}
          className="mt-12 flex flex-col items-center text-center"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-white/20" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.6em] text-white/80">
              System Synchronizing
            </h2>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-white/20" />
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
            Mempersiapkan Workspace & Keamanan Cloud
          </p>
          
          <div className="mt-8 flex gap-2 pt-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -6, 0],
                  opacity: [0.3, 1, 0.3],
                  backgroundColor: ['#475569', '#6366f1', '#475569'],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
                className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.4)]"
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
