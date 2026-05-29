import React from 'react';
import { Gamepad2, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export function GamingOverlay() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <motion.div 
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        className="bg-white dark:bg-zinc-900 border-[4px] border-black p-8 max-w-lg w-full text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden"
      >
        {/* Striped background accent common in Neo-brutalism */}
        <div className="absolute top-0 left-0 w-full h-4 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_20px)]" />
        
        <div className="mt-4 flex justify-center mb-6">
          <div className="bg-[#ffde43] border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Gamepad2 className="w-12 h-12 text-black" />
          </div>
        </div>
        
        <h2 className="text-3xl font-black text-black dark:text-white uppercase tracking-widest border-b-[4px] border-black pb-4 mb-6">
          System Locked
        </h2>
        
        <div className="bg-[#bfdbfe] border-[3px] border-black p-4 text-left shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-6 h-6 text-black" />
            <span className="font-black text-black uppercase tracking-wider">Console Mode Active</span>
          </div>
          <p className="text-black font-medium leading-relaxed">
            Miaw is currently playing <span className="bg-[#ffde43] px-1 font-bold">Space Defender</span> on the physical device. 
          </p>
        </div>

        <div className="animate-bounce">
          <span className="inline-block bg-[#ffde43] text-black border-[3px] border-black px-6 py-3 font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Press BLUE button on ESP32 to unlock
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
