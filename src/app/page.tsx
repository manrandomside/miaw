import { Button } from "@/components/ui/button"
import { Cpu, Wifi, Thermometer, Droplets, Sun, Lightbulb, Settings, ShieldAlert } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-black selection:text-white">
      {/* Top Navigation */}
      <header className="border-b-[4px] border-black bg-white dark:bg-zinc-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#ffde43] border-[3px] border-black p-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Cpu className="size-6 text-black" />
            </div>
            <span className="font-black text-xl tracking-wider uppercase">Miaw // Hub</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 border-[3px] border-black bg-white px-3 py-1 text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:bg-black dark:text-white">
              <span className="inline-block size-2 bg-red-500 rounded-full animate-ping" />
              <span>Offline</span>
            </div>
            <Button variant="outline" size="xs">
              <Settings className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Layout Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 border-[4px] border-black bg-[#ffde43] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between min-h-[320px] dark:bg-zinc-800 dark:text-white">
            <div className="space-y-6">
              <div className="inline-block border-[3px] border-black bg-white text-black px-4 py-1 text-xs font-black uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                ESP32 Ecosystem Control
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-none text-black dark:text-white">
                Miaw Smart Home Hub
              </h1>
              <p className="text-lg font-bold text-black/80 max-w-2xl dark:text-zinc-300">
                Connect securely and seamlessly to the ESP32 smart home ecosystem. Manage sensors, control smart lighting actuators, and interface with the Miaw AI brain.
              </p>
            </div>
            
            <div className="pt-8">
              <Button size="lg" className="w-full sm:w-auto font-black text-lg tracking-wider">
                Connect
              </Button>
            </div>
          </div>

          <div className="border-[4px] border-black bg-[#60a5fa] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black flex flex-col justify-between dark:bg-blue-900 dark:text-white">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-black uppercase tracking-wide text-xs border-[3px] border-black bg-white px-2.5 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black">
                  System Stats
                </span>
                <Wifi className="size-6 text-black dark:text-white" />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tight">Status Monitor</h2>
              <div className="space-y-3 pt-2 font-bold text-sm">
                <div className="flex justify-between border-b-[2px] border-black/20 pb-1">
                  <span>Connection Mode:</span>
                  <span>Local HTTP</span>
                </div>
                <div className="flex justify-between border-b-[2px] border-black/20 pb-1">
                  <span>Module IP:</span>
                  <span>Not Connected</span>
                </div>
                <div className="flex justify-between border-b-[2px] border-black/20 pb-1">
                  <span>Firmware:</span>
                  <span>v1.0.0-beta</span>
                </div>
              </div>
            </div>

            <div className="bg-white border-[3px] border-black p-4 mt-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:bg-black">
              <div className="flex items-center gap-3">
                <ShieldAlert className="size-5 shrink-0 text-black dark:text-white" />
                <span className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
                  Authorization key required for control.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Grid (Mockup/Placeholders for ESP32 Modules) */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black uppercase tracking-wider border-b-[4px] border-black pb-2">
            Local ESP32 Modules
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Temperature & Humidity */}
            <div className="border-[4px] border-black bg-[#a78bfa] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:bg-purple-900 dark:text-white">
              <div className="flex items-center justify-between border-b-[3px] border-black pb-3 mb-4">
                <h3 className="font-black uppercase text-lg tracking-tight">DHT11 Climate</h3>
                <Thermometer className="size-6 text-black dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="border-[3px] border-black bg-white p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:bg-zinc-800">
                  <div className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-400">Temp</div>
                  <div className="text-3xl font-black">-- &deg;C</div>
                </div>
                <div className="border-[3px] border-black bg-white p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:bg-zinc-800">
                  <div className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-400">Humidity</div>
                  <div className="text-3xl font-black">-- %</div>
                </div>
              </div>
            </div>

            {/* Light Sensor */}
            <div className="border-[4px] border-black bg-[#4ade80] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:bg-green-900 dark:text-white">
              <div className="flex items-center justify-between border-b-[3px] border-black pb-3 mb-4">
                <h3 className="font-black uppercase text-lg tracking-tight">LDR Ambient</h3>
                <Sun className="size-6 text-black dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="border-[3px] border-black bg-white p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:bg-zinc-800">
                  <div className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-400">Intensity</div>
                  <div className="text-3xl font-black">-- lx</div>
                </div>
                <div className="border-[3px] border-black bg-white p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:bg-zinc-800">
                  <div className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-400">Auto Mode</div>
                  <div className="text-xl font-black uppercase pt-1 text-red-500">Disabled</div>
                </div>
              </div>
            </div>

            {/* Actuators */}
            <div className="border-[4px] border-black bg-[#f472b6] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:bg-pink-900 dark:text-white">
              <div className="flex items-center justify-between border-b-[3px] border-black pb-3 mb-4">
                <h3 className="font-black uppercase text-lg tracking-tight">Smart Lamps</h3>
                <Lightbulb className="size-6 text-black dark:text-white" />
              </div>
              <div className="space-y-3 font-bold text-sm">
                <div className="flex justify-between items-center border-[3px] border-black bg-white px-3 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:bg-zinc-800">
                  <span>Lamp 1 (Living Room)</span>
                  <span className="text-xs font-black uppercase bg-red-200 border-[2px] border-black px-2 py-0.5 dark:bg-red-950 dark:text-red-300">Off</span>
                </div>
                <div className="flex justify-between items-center border-[3px] border-black bg-white px-3 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:bg-zinc-800">
                  <span>Lamp 2 (Bedroom)</span>
                  <span className="text-xs font-black uppercase bg-red-200 border-[2px] border-black px-2 py-0.5 dark:bg-red-950 dark:text-red-300">Off</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t-[4px] border-black bg-white dark:bg-zinc-900 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-bold text-sm">
          <span>&copy; 2026 Miaw Smart Home Hub.</span>
          <span className="uppercase text-xs tracking-widest font-black border-[2px] border-black px-2.5 py-1 bg-[#ffde43] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black">
            Endless Evolution Mode
          </span>
        </div>
      </footer>
    </div>
  )
}
