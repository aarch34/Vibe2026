import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a14] flex flex-col items-center justify-center p-0 sm:p-4 overflow-x-hidden">
      <div className="relative w-full max-w-[1400px] shadow-[0_0_50px_rgba(0,0,0,0.8)] mx-auto overflow-hidden sm:rounded-xl ring-4 ring-[#1f2038]">
        {/* Base Image */}
        <Image 
          src="/landing-bg.jpg" 
          alt="VIBE Retro UI" 
          width={1400} 
          height={933} 
          className="w-full h-auto block select-none" 
          priority 
        />

        {/* 
          --- INTERACTIVE HOTSPOTS ---
          Percentages are mapped to the provided mockup image. 
        */}

        {/* TOP NAV BAR */}
        <Link 
          href="/" 
          className="absolute top-[6%] left-[24%] w-[5%] h-[5%] hover:bg-white/10 rounded transition-colors" 
          title="Home"
          aria-label="Home" 
        />
        <Link 
          href="/app/games" 
          className="absolute top-[6%] left-[31.5%] w-[5.5%] h-[5%] hover:bg-white/10 rounded transition-colors" 
          title="Events"
          aria-label="Events" 
        />
        <Link 
          href="/app/leaderboard" 
          className="absolute top-[6%] left-[40%] w-[9%] h-[5%] hover:bg-white/10 rounded transition-colors" 
          title="Leaderboard"
          aria-label="Leaderboard" 
        />
        <Link 
          href="/privacy" 
          className="absolute top-[6%] left-[51.5%] w-[5%] h-[5%] hover:bg-white/10 rounded transition-colors" 
          title="About / Privacy"
          aria-label="About" 
        />

        {/* Login / Sign Up */}
        <Link 
          href="/sign-in" 
          className="absolute top-[5%] right-[2.5%] w-[17%] h-[6.5%] hover:bg-white/20 rounded-md transition-colors" 
          title="Login / Sign Up"
          aria-label="Login / Sign Up" 
        />

        {/* GET STARTED BUTTON */}
        <Link 
          href="/register" 
          className="absolute top-[60.5%] left-[17.5%] w-[21%] h-[7%] hover:bg-white/20 rounded-full transition-colors active:scale-[0.98]" 
          title="Get Started"
          aria-label="Get Started" 
        />

        {/* LET'S GO BUTTON (WELCOME.EXE) */}
        <Link 
          href="/app" 
          className="absolute bottom-[8.5%] left-[12.5%] w-[11.5%] h-[4.5%] hover:bg-black/20 rounded-sm transition-colors active:scale-[0.98]" 
          title="Let's Go!"
          aria-label="Let's Go" 
        />

        {/* VIBE.MP3 CONTROLS */}
        <Link 
          href="/app"
          className="absolute top-[23%] right-[7%] w-[8%] h-[5%] hover:bg-black/10 rounded transition-colors cursor-pointer" 
          title="Play VIBE.MP3"
          aria-label="Play/Pause" 
        />

        {/* SIDE DESKTOP ICONS */}
        <Link 
          href="/app/discover" 
          className="absolute top-[34%] right-[2.5%] w-[4%] h-[5%] hover:bg-white/20 rounded-md transition-colors" 
          title="Files / Discover"
          aria-label="Files" 
        />
        <Link 
          href="/app" 
          className="absolute top-[40.5%] right-[2.5%] w-[4%] h-[4%] hover:bg-white/20 rounded-full transition-colors" 
          title="Favorites / Feed"
          aria-label="Favorites" 
        />
        <Link 
          href="/app/games" 
          className="absolute top-[45.5%] right-[2.5%] w-[4%] h-[4%] hover:bg-white/20 rounded-md transition-colors" 
          title="Games"
          aria-label="Games" 
        />
      </div>
    </div>
  );
}
