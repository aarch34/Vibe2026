import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="relative min-h-[100svh] h-[100svh] bg-[#060312] text-white overflow-hidden font-sans selection:bg-pink-500 selection:text-white flex flex-col">
      {/* Inline styles for custom subtle animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        .animate-float-subtle { animation: float-subtle 6s ease-in-out infinite; }
        .animate-twinkle { animation: twinkle 4s ease-in-out infinite; }
      `}} />

      {/* Background Environment */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/landing-bg-clean.jpg"
          alt="VIBE Ocean Environment"
          fill
          className="object-cover object-[center_bottom] sm:object-center"
          priority
        />
        {/* Much lighter vignette to preserve the vibrant artwork while ensuring text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#05051e]/50 via-[#05051e]/20 to-transparent" />
      </div>

      {/* Decorative Stars / Particles (Subtle) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-60">
        <div className="absolute top-[15%] left-[12%] w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_#fff] animate-twinkle" />
        <div className="absolute top-[20%] right-[18%] w-1 h-1 bg-pink-400 rounded-full shadow-[0_0_8px_#ec4899] animate-twinkle" style={{ animationDelay: '300ms' }} />
        <div className="absolute top-[35%] left-[85%] w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee] animate-twinkle" style={{ animationDelay: '700ms' }} />
        <div className="absolute top-[50%] left-[20%] w-1 h-1 bg-white rounded-full shadow-[0_0_5px_#fff] animate-twinkle" style={{ animationDelay: '1000ms' }} />
      </div>

      {/* Navigation Layer - Minimal */}
      <nav className="relative z-50 flex items-center justify-between p-4 md:px-8 md:py-6 w-full max-w-[1440px] mx-auto">
        <div className="flex items-center gap-3">
          <span className="text-xl md:text-2xl font-black tracking-widest text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            VIBE 2026
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm font-bold tracking-widest uppercase">
          <Link href="/sign-in" className="hover:text-pink-400 transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
            Sign In
          </Link>
          <Link 
            href="/register" 
            className="hidden md:inline-block px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-sm hover:bg-white/20 hover:shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all drop-shadow-md"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Main Interactive Hero Content */}
      <main className="relative z-10 flex flex-col flex-1 w-full max-w-[1440px] mx-auto px-4 justify-center md:justify-start">
        
        {/* Desktop & Mobile Layout Container */}
        <div className="w-full flex flex-col items-center pt-2 md:pt-12 relative z-30">
          
          {/* VIBE Logo (Transparent Asset) */}
          <div className="relative group w-[220px] md:w-[450px] aspect-[2/1] flex justify-center items-center">
            {/* Subtle neon glow behind logo */}
            <div className="absolute inset-0 bg-pink-500/10 blur-[40px] rounded-full" />
            <Image 
              src="/vibe-logo-transparent.png" 
              alt="VIBE Logo" 
              fill
              className="object-contain drop-shadow-[0_0_15px_rgba(236,72,153,0.5)] transition-transform duration-500 hover:scale-[1.02]"
              priority
            />
          </div>

          {/* Event Typography */}
          <div className="space-y-2 md:space-y-4 text-center mt-2 md:mt-6 max-w-2xl">
            <h1 className="text-xl md:text-4xl lg:text-[40px] font-black tracking-tight text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] uppercase leading-tight">
              Rotaract Freshers Party
            </h1>
            <p className="text-[10px] md:text-sm lg:text-lg font-bold tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
              Ride the wave. Own the vibe.
            </p>
          </div>

          {/* Interactive Pixel-Style CTA Button */}
          <div className="pt-6 md:pt-10 w-full flex justify-center z-40">
            <Link 
              href="/register"
              className="group relative inline-flex items-center justify-center gap-3 md:gap-4 px-6 py-3 md:px-10 md:py-5 bg-gradient-to-r from-[#ff4da6] to-[#d946ef] rounded-[4px] font-black text-base md:text-xl text-white shadow-[0_0_0_4px_#111,0_0_0_6px_#ff4da6,4px_8px_0_4px_#111] hover:shadow-[0_0_0_4px_#111,0_0_0_6px_#ff4da6,2px_4px_0_4px_#111,0_0_25px_rgba(236,72,153,0.8)] hover:translate-y-[2px] transition-all duration-200 uppercase tracking-widest active:translate-y-2 active:shadow-[0_0_0_4px_#111,0_0_0_6px_#ff4da6,0px_0px_0_4px_#111]"
            >
              <span className="relative z-10 font-mono">GET STARTED</span>
              <svg className="w-5 h-5 relative z-10 group-hover:translate-x-1.5 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>

        </div>

        {/* Desktop ROCCO Mascot - Lower Left */}
        <div className="hidden md:block absolute bottom-[5%] left-4 lg:left-12 z-20 w-[280px] h-[280px] lg:w-[350px] lg:h-[350px] animate-float-subtle">
          <Image 
            src="/rocco-transparent.png" 
            alt="ROCCO Mascot" 
            fill
            className="object-contain object-bottom drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]" 
            priority
          />
        </div>

        {/* Mobile ROCCO Mascot - Bottom Center */}
        <div className="md:hidden absolute bottom-[-5%] left-1/2 -translate-x-1/2 z-20 w-[200px] h-[200px] animate-float-subtle">
          <Image 
            src="/rocco-transparent.png" 
            alt="ROCCO Mascot" 
            fill
            className="object-contain object-bottom drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]" 
            priority
          />
        </div>

      </main>
    </div>
  );
}
