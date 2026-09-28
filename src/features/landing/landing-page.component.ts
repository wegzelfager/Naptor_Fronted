import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  NgZone,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

// â”€â”€â”€ Declare globals for CDN-loaded GSAP (loaded via script tag) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
declare const gsap: any;
declare const ScrollTrigger: any;

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Particle class
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  size: number;
  color: string;
  alpha: number;
  vx = 0;
  vy = 0;
  isAmbient = false;
  ambientVx = (Math.random() - 0.5) * 0.25;
  ambientVy = (Math.random() - 0.5) * 0.25;

  constructor(originX: number, originY: number, color: string, size: number, alpha = 0.7) {
    this.originX = originX;
    this.originY = originY;
    // Initial particle position (starts scattered, then smoothly lerps into origin)
    this.x = originX + (Math.random() - 0.5) * 280;
    this.y = originY + (Math.random() - 0.5) * 280;
    this.color = color;
    this.size = size;
    this.alpha = alpha;
  }

  update(mx: number, my: number, radius: number): void {
    if (this.isAmbient) {
      this.originX += this.ambientVx;
      this.originY += this.ambientVy;
      this.x = this.originX;
      this.y = this.originY;
      return;
    }

    // 1. On mousemove: scatter nearby particles away from cursor
    const dx = mx - this.x;
    const dy = my - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < radius && dist > 0) {
      const force = (radius - dist) / radius;
      const angle = Math.atan2(dy, dx);
      // Kinetic scatter impulse
      this.vx -= Math.cos(angle) * force * 16;
      this.vy -= Math.sin(angle) * force * 16;
    }

    // Velocity friction damping
    this.vx *= 0.86;
    this.vy *= 0.86;
    this.x += this.vx;
    this.y += this.vy;

    // 2. On frame: lerp particles back to origin
    this.x += (this.originX - this.x) * 0.1;
    this.y += (this.originY - this.y) * 0.1;
  }

  wrap(w: number, h: number): void {
    if (this.isAmbient) {
      if (this.originX < -20) this.originX = w + 20;
      else if (this.originX > w + 20) this.originX = -20;
      if (this.originY < -20) this.originY = h + 20;
      else if (this.originY > h + 20) this.originY = -20;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 4;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Simulated live metric counters
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface MetricPoint { label: string; value: number; unit: string; color: string; icon: string; trend: string; }

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./landing-page.component.scss'],
  template: `
<!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
<!-- ROOT WRAPPER                                                             -->
<!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
<div class="min-h-screen bg-slate-950 text-white overflow-x-hidden font-sans" #rootEl>

  <!-- ══ PAGE CURTAIN REVEAL OVERLAY ══════════════════════════════════════ -->
  <div class="curtain-panel curtain-left fixed inset-y-0 left-0 w-1/2 z-[9999] flex items-center justify-end pr-10"
       style="background: linear-gradient(135deg,#0b0a1a 0%,#1e1b4b 50%,#0f0c29 100%);">
    <!-- Decorative concentric rings on curtain -->
    <svg width="180" height="180" viewBox="0 0 180 180" fill="none" class="opacity-20 pointer-events-none">
      <circle cx="90" cy="90" r="75" stroke="#818cf8" stroke-width="1"/>
      <circle cx="90" cy="90" r="52" stroke="#6366f1" stroke-width="1"/>
      <circle cx="90" cy="90" r="30" stroke="#38bdf8" stroke-width="1"/>
      <circle cx="90" cy="90" r="8"  fill="#818cf8" opacity="0.5"/>
    </svg>
  </div>
  <div class="curtain-panel curtain-right fixed inset-y-0 right-0 w-1/2 z-[9999] flex items-center justify-start pl-10"
       style="background: linear-gradient(225deg,#0b0a1a 0%,#1e1b4b 50%,#0f0c29 100%);">
    <svg width="180" height="180" viewBox="0 0 180 180" fill="none" class="opacity-20 pointer-events-none">
      <circle cx="90" cy="90" r="75" stroke="#818cf8" stroke-width="1"/>
      <circle cx="90" cy="90" r="52" stroke="#6366f1" stroke-width="1"/>
      <circle cx="90" cy="90" r="30" stroke="#38bdf8" stroke-width="1"/>
      <circle cx="90" cy="90" r="8"  fill="#818cf8" opacity="0.5"/>
    </svg>
  </div>


  <!-- ──────────── NAVBAR ──────────── -->
  <nav class="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 sm:px-6 md:px-12 py-3 sm:py-4
              bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60">
    <div class="flex items-center gap-2 sm:gap-3">
      <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500
                  flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
        <i class="fa-solid fa-wave-square text-white text-xs sm:text-sm"></i>
      </div>
      <span class="text-base sm:text-lg font-extrabold tracking-tight">
        Naptor<span class="text-indigo-400">Signal</span>
      </span>
    </div>
    <ul class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
      <li><a href="#features" class="hover:text-white transition-colors">Features</a></li>
      <li><a href="#monitoring" class="hover:text-white transition-colors">Monitoring</a></li>
      <li><a href="#pricing" class="hover:text-white transition-colors">Pricing</a></li>
    </ul>
    <div class="flex items-center gap-1.5 sm:gap-3">
      <a routerLink="/login"
         class="hidden sm:inline-block text-sm font-semibold text-slate-300 hover:text-white transition-colors px-4 py-2">
        Sign In
      </a>
      <a routerLink="/register"
         class="text-xs sm:text-sm font-semibold text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl
                bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500
                shadow-lg shadow-indigo-500/25 transition-all duration-200 active:scale-95 whitespace-nowrap">
        <span class="hidden sm:inline">Get Started Free</span>
        <span class="sm:hidden">Get Started</span>
      </a>
    </div>
  </nav>

  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <!-- HERO SECTION                                                         -->
  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <section class="relative min-h-screen flex flex-col items-center justify-center pt-20 overflow-hidden" #heroSection>

    <!-- Interactive Constellation Particle Canvas (Pure Background Layer) -->
    <canvas #particleCanvas class="hero-canvas absolute inset-0 w-full h-full pointer-events-none z-0"></canvas>

    <!-- Dark ambient background vignette (ensures hero text area is high-contrast while letting particle text shine) -->
    <div class="absolute inset-0 pointer-events-none z-0"
         style="background: radial-gradient(ellipse 75% 65% at 50% 45%, rgba(2, 6, 23, 0.25) 0%, rgba(2, 6, 23, 0.80) 70%, #020617 100%);"></div>

    <!-- Ambient background glow blobs -->
    <div class="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
                w-[750px] h-[500px] bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none z-0"></div>
    <div class="absolute bottom-12 right-1/4 w-[500px] h-[400px]
                bg-cyan-500/8 rounded-full blur-[140px] pointer-events-none z-0"></div>

    <!-- Wave layers (animated by GSAP) -->
    <div class="wave-layer z-0 pointer-events-none" #wavesContainer>
      <svg class="hero-wave wave-svg absolute w-full opacity-20 pointer-events-none" style="bottom:-20px;left:0;" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="rgba(99,102,241,0.6)" d="M0,128L48,144C96,160,192,192,288,197.3C384,203,480,181,576,160C672,139,768,117,864,122.7C960,128,1056,160,1152,165.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L0,320Z"/>
      </svg>
      <svg class="hero-wave wave-svg absolute w-full opacity-15 pointer-events-none" style="bottom:-40px;left:0;" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="rgba(129,140,248,0.5)" d="M0,224L60,213.3C120,203,240,181,360,181.3C480,181,600,203,720,208C840,213,960,203,1080,186.7C1200,171,1320,149,1380,138.7L1440,128L1440,320L0,320Z"/>
      </svg>
      <svg class="hero-wave wave-svg absolute w-full opacity-10 pointer-events-none" style="bottom:-60px;left:0;" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="rgba(56,189,248,0.4)" d="M0,256L80,240C160,224,320,192,480,192C640,192,800,224,960,229.3C1120,235,1280,213,1360,202.7L1440,192L1440,320L0,320Z"/>
      </svg>
    </div>

    <!-- Hero content (Clean, crisp DOM layout, relative z-10 above canvas) -->
    <div class="inner-layer relative z-10 flex flex-col items-center text-center px-6 space-y-8 max-w-5xl mx-auto py-12">

      <!-- Status badge -->
      <div class="hero-chip inline-flex items-center gap-2.5 px-4 py-2 rounded-full
                  bg-slate-900/90 border border-emerald-500/30 backdrop-blur-md
                  text-xs font-semibold text-emerald-400 shadow-lg shadow-emerald-500/10">
        <span class="relative flex h-2.5 w-2.5">
          <span class="pulse-ring" style="color:#34d399; width:10px; height:10px; top:-2px; left:-2px;"></span>
          <span class="relative w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
        </span>
        All Systems Operational &nbsp;·&nbsp; 99.99% Uptime SLA
      </div>

      <!-- Main headline: dynamic letter entrance with 3D cascading letters -->
      <h1 #heroHeading class="hero-heading text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.08] select-none">
        <span class="text-indigo-400 drop-shadow-[0_4px_24px_rgba(99,102,241,0.4)]">Infrastructure</span><br>
        <span class="text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">Monitoring,</span><br>
        <span class="text-cyan-400 drop-shadow-[0_4px_28px_rgba(56,189,248,0.35)]">Perfected.</span>
      </h1>

      <!-- Underline sweep -->
      <div class="w-full flex justify-center py-1">
        <div class="hero-line h-[3px] rounded-full bg-gradient-to-r from-transparent via-indigo-500 to-cyan-400 shadow-[0_0_16px_rgba(99,102,241,0.8)]" style="width: 0%; max-width: 480px;"></div>
      </div>

      <!-- Sub-headline -->
      <p class="hero-sub text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl leading-relaxed drop-shadow">
        Real-time TCP, HTTP, SSL, and heartbeat monitoring across your entire infrastructure.
        Get alerted in seconds, not minutes.
      </p>

      <!-- CTA buttons -->
      <div class="hero-cta flex flex-col sm:flex-row gap-4">
        <a routerLink="/register"
           class="group relative flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-white
                  bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500
                  shadow-2xl shadow-indigo-600/40 transition-all duration-200 active:scale-95">
          <span class="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></span>
          <i class="fa-solid fa-rocket-launch"></i>
          Start Monitoring Free
        </a>
        <a href="#monitoring"
           class="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-semibold text-slate-200
                  bg-slate-900/80 border border-slate-700/70 hover:border-indigo-500/50 hover:text-white
                  backdrop-blur-md transition-all duration-200">
          <i class="fa-solid fa-circle-play text-indigo-400"></i>
          Live Demo
        </a>
      </div>

      <!-- Trust badges -->
      <div class="hero-badges flex flex-wrap justify-center gap-3 sm:gap-6 pt-4">
        <div *ngFor="let badge of trustBadges" class="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
          <i [class]="badge.icon + ' text-indigo-400'"></i>
          <span>{{ badge.label }}</span>
        </div>
      </div>
    </div>

    <!-- Scroll indicator -->
    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2
                text-slate-500 text-xs animate-float z-10 pointer-events-none">
      <span>Scroll to explore</span>
      <i class="fa-solid fa-chevron-down animate-bounce"></i>
    </div>
  </section>

  <!-- Live status ticker -->
  <div class="relative py-3 bg-slate-900/70 border-y border-slate-800/50 backdrop-blur-sm overflow-hidden">
    <div class="ticker-wrapper">
      <div class="ticker-track">
        <span *ngFor="let t of tickerItems.concat(tickerItems)" class="inline-flex items-center gap-3 px-8 text-xs text-slate-400">
          <i [class]="t.icon + ' text-indigo-400'"></i>
          <span class="font-medium text-slate-300">{{ t.label }}</span>
          <span [style.color]="t.valueColor" class="font-mono font-bold">{{ t.value }}</span>
          <span class="text-slate-700 px-2">·</span>
        </span>
      </div>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <!-- LIVE MONITORING SHOWCASE                                             -->
  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <section id="monitoring" class="relative py-16 sm:py-24 lg:py-28 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto">
    <div class="glow-line mb-16 mx-auto" style="max-width:400px"></div>

    <div class="text-center space-y-4 mb-16">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs font-semibold text-indigo-400">
        <i class="fa-solid fa-chart-mixed"></i> Live Dashboard Preview
      </div>
      <h2 class="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
        Monitor Everything.<br>
        <span class="text-indigo-400">Miss Nothing.</span>
      </h2>
      <p class="text-slate-400 max-w-2xl mx-auto">
        Watch your infrastructure health in real-time with sub-second precision across TCP, HTTP/S, SSL, DNS, and Heartbeat monitors.
      </p>
    </div>

    <!-- Metrics grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div *ngFor="let m of liveMetrics()" class="card glass-card rounded-2xl p-5 space-y-3 animate-border-glow" style="animation-delay:{{m.delay}}s">
        <div class="flex items-center justify-between">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center" [style.background]="m.bgColor">
            <i [class]="m.icon" [style.color]="m.color"></i>
          </div>
          <span class="text-xs font-semibold px-2 py-1 rounded-full" [style.color]="m.trendColor" [style.background]="m.trendBg">
            {{ m.trend }}
          </span>
        </div>
        <div>
          <div class="text-2xl font-black font-mono" [style.color]="m.color">{{ m.value }}<span class="text-sm font-semibold text-slate-500 ml-1">{{ m.unit }}</span></div>
          <div class="text-xs text-slate-500 mt-0.5">{{ m.label }}</div>
        </div>
      </div>
    </div>

    <!-- Main monitor dashboard card -->
    <div class="glass-card rounded-3xl p-6 md:p-8 space-y-6">
      <!-- Top bar -->
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div class="flex items-center gap-3">
          <div class="w-3 h-3 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50"></div>
          <span class="text-sm font-semibold text-white">api.production.naptor.io</span>
          <span class="text-xs px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">OPERATIONAL</span>
        </div>
        <div class="flex items-center gap-4 text-xs text-slate-400">
          <span><i class="fa-solid fa-clock text-indigo-400 mr-1"></i>Checking every <strong class="text-white">30s</strong></span>
          <span><i class="fa-solid fa-globe text-blue-400 mr-1"></i>6 regions</span>
        </div>
      </div>

      <!-- Latency graph -->
      <div class="relative h-48 md:h-64 bg-slate-950/60 rounded-2xl overflow-hidden border border-slate-800/60 p-4">
        <div class="absolute top-3 left-4 text-xs text-slate-500 font-semibold uppercase tracking-wider">HTTP Response Time (ms)</div>
        <svg class="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none" #latencyGraph>
          <!-- Grid lines -->
          <line x1="0" y1="50"  x2="800" y2="50"  stroke="rgba(148,163,184,.07)" stroke-width="1"/>
          <line x1="0" y1="100" x2="800" y2="100" stroke="rgba(148,163,184,.07)" stroke-width="1"/>
          <line x1="0" y1="150" x2="800" y2="150" stroke="rgba(148,163,184,.07)" stroke-width="1"/>
          <!-- Gradient fill -->
          <defs>
            <linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stop-color="#6366f1" stop-opacity="0.4"/>
              <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
            </linearGradient>
            <linearGradient id="latLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stop-color="#818cf8"/>
              <stop offset="100%" stop-color="#38bdf8"/>
            </linearGradient>
          </defs>
          <path class="monitor-graph" [attr.d]="latencyArea()" fill="url(#latGrad)"/>
          <path class="monitor-graph" [attr.d]="latencyPath()" fill="none" stroke="url(#latLine)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          <!-- Dots -->
          <circle *ngFor="let pt of graphPoints(); let i=index"
                  [attr.cx]="pt.x" [attr.cy]="pt.y" r="4"
                  fill="#6366f1" stroke="#0f172a" stroke-width="2"
                  class="transition-all duration-500"/>
        </svg>
        <!-- Y-axis labels -->
        <div class="absolute right-4 top-4 space-y-5 text-right">
          <div class="text-xs text-slate-600">200ms</div>
          <div class="text-xs text-slate-600">100ms</div>
          <div class="text-xs text-slate-600">50ms</div>
        </div>
      </div>

      <!-- Status timeline bars -->
      <div class="space-y-2">
        <div class="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>90-day uptime</span>
          <span class="text-emerald-400 font-semibold">99.97%</span>
        </div>
        <div class="flex gap-0.5 h-8 rounded-xl overflow-hidden">
          <div *ngFor="let bar of uptimeBars"
               class="flex-1 rounded-sm transition-all duration-300 hover:opacity-80 cursor-pointer"
               [style.background]="bar === 'up' ? '#10b981' : bar === 'warn' ? '#f59e0b' : '#ef4444'">
          </div>
        </div>
        <div class="flex justify-between text-xs text-slate-600">
          <span>90 days ago</span>
          <span>Today</span>
        </div>
      </div>
    </div>
  </section>

  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <!-- CAPABILITIES SECTION (SVG flow lines)                               -->
  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <section id="features" class="relative py-16 sm:py-24 lg:py-28 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto" #capabilitiesSection>
    <div class="glow-line mb-16 mx-auto" style="max-width:400px"></div>

    <div class="text-center space-y-4 mb-16">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs font-semibold text-indigo-400">
        <i class="fa-solid fa-shield-check"></i> Advanced Capabilities
      </div>
      <h2 class="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
        Every Check.<br>
        <span class="text-indigo-400">Every Protocol.</span>
      </h2>
    </div>

    <!-- SVG connector lines (drawSVG animation via GSAP) -->
    <div class="relative hidden md:block" style="height:4px;margin-bottom:2.5rem;">
      <svg class="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 800 4">
        <path #svgFlowLine class="line" d="M100,2 Q400,2 700,2"
              stroke="url(#flowGrad)" stroke-width="2" fill="none"
              stroke-linecap="round" stroke-dasharray="600" stroke-dashoffset="600"/>
        <defs>
          <linearGradient id="flowGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stop-color="#6366f1" stop-opacity="0"/>
            <stop offset="30%"  stop-color="#818cf8"/>
            <stop offset="70%"  stop-color="#38bdf8"/>
            <stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/>
          </linearGradient>
        </defs>
      </svg>
    </div>

    <!-- Capability cards -->
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <div *ngFor="let cap of capabilities" class="capability-card glass-card rounded-2xl p-6 space-y-4 cursor-default group transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40" style="opacity:1">
        <!-- Icon with animated SVG flow circle -->
        <div class="relative w-14 h-14">
          <svg class="absolute inset-0 w-full h-full" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="25" stroke="rgba(99,102,241,0.2)" stroke-width="1.5" fill="none"/>
            <circle class="svg-flow-line" cx="28" cy="28" r="25" [attr.stroke]="cap.color" stroke-width="1.5" fill="none"
                    stroke-linecap="round" transform="rotate(-90 28 28)"/>
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <i [class]="cap.icon + ' text-xl'" [style.color]="cap.color"></i>
          </div>
        </div>
        <div>
          <h3 class="font-bold text-white text-lg">{{ cap.title }}</h3>
          <p class="text-slate-400 text-sm mt-1.5 leading-relaxed">{{ cap.desc }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <span *ngFor="let tag of cap.tags"
                class="text-xs px-2.5 py-1 rounded-full font-semibold"
                [style.background]="cap.tagBg" [style.color]="cap.color">
            {{ tag }}
          </span>
        </div>
      </div>
    </div>
  </section>

  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <!-- PRICING SECTION                                                      -->
  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <section id="pricing" class="relative py-16 sm:py-24 lg:py-28 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto">
    <div class="glow-line mb-16 mx-auto" style="max-width:400px"></div>

    <div class="text-center space-y-4 mb-16">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs font-semibold text-indigo-400">
        <i class="fa-solid fa-tag"></i> Transparent Pricing
      </div>
      <h2 class="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
        Scale Without<br>
        <span class="text-indigo-400">Breaking the Budget.</span>
      </h2>
      <p class="text-slate-400 max-w-xl mx-auto">Start free, upgrade when you need to. No credit card required.</p>
    </div>

    <div class="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 items-start">
      <div *ngFor="let plan of pricingPlans"
           class="pricing-card rounded-3xl p-8 space-y-7 relative overflow-hidden"
           [class.featured]="plan.featured"
           style="opacity:1">
        <!-- Featured glow blob -->
        <div *ngIf="plan.featured"
             class="absolute -top-16 -right-16 w-48 h-48 bg-indigo-600/25 rounded-full blur-3xl pointer-events-none"></div>

        <div *ngIf="plan.badge"
             class="absolute top-6 right-6 text-xs font-bold px-3 py-1 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/40">
          {{ plan.badge }}
        </div>

        <div>
          <div class="text-sm font-bold uppercase tracking-widest mb-3" [style.color]="plan.color">{{ plan.name }}</div>
          <div class="flex items-end gap-1">
            <span class="text-5xl font-black text-white leading-none">{{ plan.price }}</span>
            <span class="text-slate-400 text-sm mb-1.5">{{ plan.period }}</span>
          </div>
          <p class="text-slate-500 text-sm mt-2">{{ plan.desc }}</p>
        </div>

        <div class="h-px bg-slate-800/70"></div>

        <ul class="space-y-3">
          <li *ngFor="let feat of plan.features" class="flex items-start gap-3 text-sm">
            <i class="fa-solid fa-circle-check mt-0.5 shrink-0" [style.color]="plan.color"></i>
            <span class="text-slate-300">{{ feat }}</span>
          </li>
        </ul>

        <a routerLink="/register"
           class="block w-full text-center py-3.5 px-6 rounded-xl font-bold text-sm transition-all duration-200"
           [style.background]="plan.featured ? 'linear-gradient(135deg,#6366f1,#3b82f6)' : 'rgba(99,102,241,0.12)'"
           [style.color]="plan.featured ? '#fff' : '#818cf8'"
           [style.border]="plan.featured ? 'none' : '1px solid rgba(99,102,241,0.3)'">
          {{ plan.cta }}
        </a>
      </div>
    </div>
  </section>

  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <!-- SIGNAL FLOW SECTION  (DrawSVG + MorphSVG + ScrambleText)           -->
  <!-- ════════════════════════════════════════════════════════════════════ -->
  <section id="signal-flow" class="relative py-28 px-6 md:px-12 max-w-7xl mx-auto overflow-hidden">
    <div class="glow-line mb-16 mx-auto" style="max-width:400px"></div>

    <div class="text-center space-y-4 mb-20">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-semibold text-cyan-400">
        <i class="fa-solid fa-signal-bars"></i> Live Signal Architecture
      </div>
      <h2 class="text-4xl md:text-5xl font-black tracking-tight text-white">
        Data Flows<br>
        <span class="scramble-text text-cyan-400" data-target="Everywhere, Instantly.">Everywhere, Instantly.</span>
      </h2>
      <p class="text-slate-400 max-w-2xl mx-auto">
        Naptor Signal traces every packet, request, and heartbeat across your infrastructure in real time.
      </p>
    </div>

    <!-- SVG Flow diagram — lines drawn by GSAP stroke-dashoffset on scroll -->
    <div class="relative flex items-center justify-center">
      <svg class="signal-flow-svg w-full max-w-4xl" viewBox="0 0 900 320" fill="none"
           xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
        <defs>
          <linearGradient id="sfGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stop-color="#6366f1" stop-opacity="0"/>
            <stop offset="25%"  stop-color="#818cf8"/>
            <stop offset="70%"  stop-color="#38bdf8"/>
            <stop offset="100%" stop-color="#06b6d4" stop-opacity="0"/>
          </linearGradient>
          <filter id="sfGlow">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <!-- Source nodes -->
        <g filter="url(#sfGlow)">
          <rect x="10" y="50"  width="145" height="52" rx="12" fill="rgba(99,102,241,0.12)" stroke="rgba(99,102,241,0.45)" stroke-width="1.5"/>
          <text x="82" y="72"  text-anchor="middle" fill="#c7d2fe" font-size="11" font-weight="700" font-family="system-ui">TCP Monitor</text>
          <text x="82" y="90"  text-anchor="middle" fill="#818cf8" font-size="9"  font-family="system-ui">port :443</text>
          <circle cx="155" cy="76" r="5" fill="#6366f1"/>
          <rect x="10" y="134" width="145" height="52" rx="12" fill="rgba(99,102,241,0.12)" stroke="rgba(99,102,241,0.45)" stroke-width="1.5"/>
          <text x="82" y="156" text-anchor="middle" fill="#c7d2fe" font-size="11" font-weight="700" font-family="system-ui">HTTP Check</text>
          <text x="82" y="174" text-anchor="middle" fill="#818cf8" font-size="9"  font-family="system-ui">GET /health</text>
          <circle cx="155" cy="160" r="5" fill="#6366f1"/>
          <rect x="10" y="218" width="145" height="52" rx="12" fill="rgba(99,102,241,0.12)" stroke="rgba(99,102,241,0.45)" stroke-width="1.5"/>
          <text x="82" y="240" text-anchor="middle" fill="#c7d2fe" font-size="11" font-weight="700" font-family="system-ui">SSL Watch</text>
          <text x="82" y="258" text-anchor="middle" fill="#818cf8" font-size="9"  font-family="system-ui">expires: 67d</text>
          <circle cx="155" cy="244" r="5" fill="#6366f1"/>
        </g>

        <!-- Draw lines — fan-in to hub -->
        <path class="sf-draw-line" data-length="240" fill="none"
              d="M160,76  C290,76  290,160 385,160"
              stroke="url(#sfGrad)" stroke-width="2" stroke-linecap="round"
              stroke-dasharray="240" stroke-dashoffset="240"/>
        <path class="sf-draw-line" data-length="228" fill="none"
              d="M160,160 L385,160"
              stroke="url(#sfGrad)" stroke-width="2" stroke-linecap="round"
              stroke-dasharray="228" stroke-dashoffset="228"/>
        <path class="sf-draw-line" data-length="240" fill="none"
              d="M160,244 C290,244 290,160 385,160"
              stroke="url(#sfGrad)" stroke-width="2" stroke-linecap="round"
              stroke-dasharray="240" stroke-dashoffset="240"/>

        <!-- Central hub (morphing hexagon) -->
        <g transform="translate(450,160)">
          <path class="sf-morph-hex"
                d="M0,-56 L49,-28 L49,28 L0,56 L-49,28 L-49,-28 Z"
                fill="rgba(99,102,241,0.12)" stroke="rgba(99,102,241,0.7)" stroke-width="1.5"/>
          <circle r="32" fill="none" stroke="rgba(56,189,248,0.3)" stroke-width="1"
                  stroke-dasharray="8 5" class="sf-spin-ring"/>
          <circle r="18" fill="rgba(99,102,241,0.22)" stroke="rgba(99,102,241,0.8)" stroke-width="1.5"/>
          <text x="0" y="6" text-anchor="middle" fill="#c7d2fe" font-size="15" font-weight="900" font-family="system-ui">N</text>
          <text x="0" y="80" text-anchor="middle" fill="#6366f1" font-size="8" font-weight="700"
                letter-spacing="2.5" font-family="system-ui">NAPTOR CORE</text>
        </g>

        <!-- Draw lines — fan-out from hub -->
        <path class="sf-draw-line" data-length="240" fill="none"
              d="M515,160 C620,160 620,76  745,76"
              stroke="url(#sfGrad)" stroke-width="2" stroke-linecap="round"
              stroke-dasharray="240" stroke-dashoffset="240"/>
        <path class="sf-draw-line" data-length="232" fill="none"
              d="M515,160 L745,160"
              stroke="url(#sfGrad)" stroke-width="2" stroke-linecap="round"
              stroke-dasharray="232" stroke-dashoffset="232"/>
        <path class="sf-draw-line" data-length="240" fill="none"
              d="M515,160 C620,160 620,244 745,244"
              stroke="url(#sfGrad)" stroke-width="2" stroke-linecap="round"
              stroke-dasharray="240" stroke-dashoffset="240"/>

        <!-- Destination nodes -->
        <g filter="url(#sfGlow)">
          <circle cx="745" cy="76"  r="5" fill="#38bdf8"/>
          <rect x="750" y="50"  width="140" height="52" rx="12" fill="rgba(56,189,248,0.08)" stroke="rgba(56,189,248,0.35)" stroke-width="1.5"/>
          <text x="820" y="72"  text-anchor="middle" fill="#bae6fd" font-size="11" font-weight="700" font-family="system-ui">Slack Alert</text>
          <text x="820" y="90"  text-anchor="middle" fill="#38bdf8" font-size="9"  font-family="system-ui">#incidents</text>
          <circle cx="745" cy="160" r="5" fill="#38bdf8"/>
          <rect x="750" y="134" width="140" height="52" rx="12" fill="rgba(56,189,248,0.08)" stroke="rgba(56,189,248,0.35)" stroke-width="1.5"/>
          <text x="820" y="156" text-anchor="middle" fill="#bae6fd" font-size="11" font-weight="700" font-family="system-ui">PagerDuty</text>
          <text x="820" y="174" text-anchor="middle" fill="#38bdf8" font-size="9"  font-family="system-ui">on-call page</text>
          <circle cx="745" cy="244" r="5" fill="#38bdf8"/>
          <rect x="750" y="218" width="140" height="52" rx="12" fill="rgba(56,189,248,0.08)" stroke="rgba(56,189,248,0.35)" stroke-width="1.5"/>
          <text x="820" y="240" text-anchor="middle" fill="#bae6fd" font-size="11" font-weight="700" font-family="system-ui">Dashboard</text>
          <text x="820" y="258" text-anchor="middle" fill="#38bdf8" font-size="9"  font-family="system-ui">real-time UI</text>
        </g>
      </svg>
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-3 gap-6 mt-16 max-w-xl mx-auto text-center">
      <div class="sf-stat space-y-1" style="opacity:1">
        <div class="text-3xl font-black text-indigo-400 font-mono">15s</div>
        <div class="text-xs text-slate-500 uppercase tracking-widest">Check Interval</div>
      </div>
      <div class="sf-stat space-y-1" style="opacity:1">
        <div class="text-3xl font-black text-cyan-400 font-mono">6</div>
        <div class="text-xs text-slate-500 uppercase tracking-widest">Global Regions</div>
      </div>
      <div class="sf-stat space-y-1" style="opacity:1">
        <div class="text-3xl font-black text-purple-400 font-mono">&lt;2s</div>
        <div class="text-xs text-slate-500 uppercase tracking-widest">Alert Delivery</div>
      </div>
    </div>
  </section>

  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <!-- FINAL CTA                                                            -->
  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <section class="relative py-28 px-6 text-center overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/20 to-transparent pointer-events-none"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
    <div class="relative z-10 space-y-8 max-w-3xl mx-auto">
      <div class="text-5xl md:text-6xl font-black tracking-tight">
        <span class="text-white">Your Infrastructure</span><br>
        <span class="shimmer-text">Deserves Better.</span>
      </div>
      <p class="text-xl text-slate-400">
        Join thousands of engineers who trust Naptor Signal to keep their systems running.
      </p>
      <a routerLink="/register"
         class="inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-lg text-white
                bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500
                shadow-2xl shadow-indigo-600/40 transition-all duration-200 active:scale-95">
        <i class="fa-solid fa-rocket-launch"></i>
        Start Monitoring Free — No Credit Card
      </a>
    </div>
  </section>

  <!-- ─── FOOTER ─── -->
  <footer class="border-t border-slate-800/60 py-10 px-6 md:px-12 bg-slate-950">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center">
          <i class="fa-solid fa-wave-square text-white text-xs"></i>
        </div>
        <span class="font-bold text-sm">Naptor<span class="text-indigo-400">Signal</span></span>
      </div>
      <p class="text-xs text-slate-600 text-center">
        &copy; 2026 Naptor Signal Inc. · Enterprise Uptime &amp; Performance Monitoring
      </p>
      <div class="flex gap-4 text-slate-500 text-sm">
        <a href="#" class="hover:text-slate-300 transition-colors">Privacy</a>
        <a href="#" class="hover:text-slate-300 transition-colors">Terms</a>
        <a href="#" class="hover:text-slate-300 transition-colors">Status</a>
      </div>
    </div>
  </footer>

</div>
  `,
})
export class LandingPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('rootEl')         rootEl!: ElementRef<HTMLElement>;
  @ViewChild('heroSection')    heroSection!: ElementRef<HTMLElement>;
  @ViewChild('heroHeading')    heroHeadingRef?: ElementRef<HTMLHeadingElement>;
  @ViewChild('particleCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('wavesContainer') wavesContainer!: ElementRef<HTMLElement>;
  @ViewChild('latencyGraph')   latencyGraphRef!: ElementRef<SVGElement>;
  @ViewChild('capabilitiesSection') capsSection!: ElementRef<HTMLElement>;
  @ViewChild('svgFlowLine')    svgFlowLineRef!: ElementRef<SVGPathElement>;

  private readonly ngZone = inject(NgZone);

  // ── Canvas sizing ──────────────────────────────────────────────────────────
  canvasW = window.innerWidth;
  canvasH = window.innerHeight;

  // ── Particles ──────────────────────────────────────────────────────────────
  private particles: Particle[] = [];
  private rafId = 0;
  private ctx!: CanvasRenderingContext2D;
  private mouse = { x: -9999, y: -9999 };
  private gsapTimelines: any[] = [];
  private gsapContext?: any;

  // ── Trust badges ───────────────────────────────────────────────────────────
  trustBadges = [
    { icon: 'fa-solid fa-shield-halved', label: 'SOC 2 Compliant' },
    { icon: 'fa-solid fa-lock',          label: 'End-to-End Encrypted' },
    { icon: 'fa-solid fa-globe',         label: '6 Global Regions' },
    { icon: 'fa-solid fa-bolt',          label: '15s Check Intervals' },
  ];

  // ── Status ticker ──────────────────────────────────────────────────────────
  tickerItems = [
    { icon: 'fa-solid fa-tower-broadcast', label: 'Global Uptime',      value: '99.99%',   valueColor: '#34d399' },
    { icon: 'fa-solid fa-gauge-high',      label: 'Avg. Latency',       value: '42ms',     valueColor: '#818cf8' },
    { icon: 'fa-solid fa-server',          label: 'Monitors Active',    value: '128,429',  valueColor: '#38bdf8' },
    { icon: 'fa-solid fa-bell',            label: 'Alerts Sent Today',  value: '3,219',    valueColor: '#fb923c' },
    { icon: 'fa-solid fa-certificate',     label: 'SSL Certs Tracked',  value: '94,102',   valueColor: '#a78bfa' },
    { icon: 'fa-solid fa-heart-pulse',     label: 'Heartbeats / min',   value: '2.1M',     valueColor: '#f472b6' },
  ];

  // ── Live metrics (signals for reactivity) ──────────────────────────────────
  private _liveMetrics = [
    { label: 'HTTP Response',  value: '47',  unit: 'ms',  icon: 'fa-solid fa-globe',          color: '#818cf8', bgColor: 'rgba(129,140,248,0.12)', trend: '↓ -3ms',  trendColor: '#34d399', trendBg: 'rgba(52,211,153,0.1)', delay: 0    },
    { label: 'TCP Ping',       value: '8',   unit: 'ms',  icon: 'fa-solid fa-network-wired',   color: '#38bdf8', bgColor: 'rgba(56,189,248,0.12)',  trend: '↓ -1ms',  trendColor: '#34d399', trendBg: 'rgba(52,211,153,0.1)', delay: 0.1  },
    { label: 'SSL Expiry',     value: '67',  unit: 'd',   icon: 'fa-solid fa-certificate',     color: '#a78bfa', bgColor: 'rgba(167,139,250,0.12)', trend: 'Healthy', trendColor: '#34d399', trendBg: 'rgba(52,211,153,0.1)', delay: 0.2  },
    { label: 'Uptime',         value: '99.98', unit: '%', icon: 'fa-solid fa-arrow-trend-up',  color: '#34d399', bgColor: 'rgba(52,211,153,0.12)',  trend: '↑ 0.01%', trendColor: '#34d399', trendBg: 'rgba(52,211,153,0.1)', delay: 0.3  },
  ];
  liveMetrics = signal(this._liveMetrics);

  // ── Uptime bars ────────────────────────────────────────────────────────────
  uptimeBars: ('up' | 'warn' | 'down')[] = Array.from({ length: 90 }, (_, i) => {
    const r = Math.random();
    if (r > 0.97) return 'down';
    if (r > 0.93) return 'warn';
    return 'up';
  });

  // â”€â”€ Graph data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  private graphData: number[] = Array.from({ length: 20 }, () => 40 + Math.random() * 120);
  private graphUpdateInterval: any;
  private liveMetricInterval: any;
  private scrambleIntervals: any[] = [];

  graphPoints = signal(this.computeGraphPoints());
  latencyPath = signal('');
  latencyArea = signal('');

  // â”€â”€ Capabilities â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  capabilities = [
    {
      title: 'Port Ping Monitor',
      desc:  'Monitor any TCP/UDP port for open/closed state with millisecond-precision latency tracking.',
      icon:  'fa-solid fa-network-wired',
      color: '#38bdf8',
      tagBg: 'rgba(56,189,248,0.1)',
      tags:  ['TCP', 'UDP', 'ICMP'],
    },
    {
      title: 'SSL Certificate Watch',
      desc:  'Track certificate expiry, chain validity, and cipher suites across all your HTTPS endpoints.',
      icon:  'fa-solid fa-certificate',
      color: '#a78bfa',
      tagBg: 'rgba(167,139,250,0.1)',
      tags:  ['TLS 1.3', 'Chain Verify', 'Expiry Alerts'],
    },
    {
      title: 'Heartbeat Cron',
      desc:  'Receive a ping from your cron jobs or schedulers; get alerted if they stop reporting.',
      icon:  'fa-solid fa-heart-pulse',
      color: '#f472b6',
      tagBg: 'rgba(244,114,182,0.1)',
      tags:  ['Cron', 'Scheduler', 'Deadman Switch'],
    },
    {
      title: 'Multi-Step API',
      desc:  'Chain sequential HTTP requests with assertions, variable extraction, and custom headers.',
      icon:  'fa-solid fa-code-branch',
      color: '#34d399',
      tagBg: 'rgba(52,211,153,0.1)',
      tags:  ['REST', 'GraphQL', 'Auth Flows'],
    },
  ];

  // â”€â”€ Pricing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  pricingPlans = [
    {
      name:     'Starter',
      price:    'Free',
      period:   'forever',
      desc:     'Perfect for indie developers and small projects.',
      color:    '#94a3b8',
      featured: false,
      badge:    null,
      cta:      'Get Started Free',
      features: [
        '10 monitors included',
        '5-minute check intervals',
        'Email alerts',
        '7-day data retention',
        'SSL monitoring',
      ],
    },
    {
      name:     'Pro',
      price:    '$19',
      period:   '/ month',
      desc:     'For growing teams that need reliability at scale.',
      color:    '#818cf8',
      featured: true,
      badge:    'Most Popular',
      cta:      'Start Pro Trial',
      features: [
        'Unlimited monitors',
        '30-second check intervals',
        'PagerDuty, Slack, SMS alerts',
        '90-day data retention',
        'Multi-step API checks',
        'Port & heartbeat monitors',
        'Status pages (custom domain)',
      ],
    },
    {
      name:     'Enterprise',
      price:    'Custom',
      period:   'contact us',
      desc:     'Dedicated infrastructure, SLA guarantees, and white-glove onboarding.',
      color:    '#34d399',
      featured: false,
      badge:    null,
      cta:      'Talk to Sales',
      features: [
        'Everything in Pro',
        'Dedicated check nodes',
        '1-year data retention',
        'SSO / SAML 2.0',
        'Custom integrations',
        '99.99% uptime SLA',
        'Dedicated Slack channel',
      ],
    },
  ];

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // LIFECYCLE
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.initCurtainReveal();
      this.initCanvas();
      this.startGraphAnimation();
      this.initGSAP();
      this.initSignalFlowAnimations();
      this.initScrambleText();
    });
    this.startLiveMetricUpdates();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.rafId);
    clearInterval(this.graphUpdateInterval);
    clearInterval(this.liveMetricInterval);
    this.scrambleIntervals.forEach(id => clearInterval(id));
    this.gsapContext?.revert();
    this.gsapTimelines.forEach(t => t.kill?.());
    // Kill all ScrollTriggers
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.getAll().forEach((t: any) => t.kill());
    }
    if (this.heroSection?.nativeElement) {
      const heroEl = this.heroSection.nativeElement;
      heroEl.removeEventListener('mousemove', this.onMouseMove);
      heroEl.removeEventListener('mouseleave', this.onMouseLeave);
    }
    window.removeEventListener('resize', this.onResize);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CANVAS / INTERACTIVE PARTICLES & CONSTELLATION
  // ──────────────────────────────────────────────────────────────────────────
  private initCanvas(): void {
    if (!this.canvasRef?.nativeElement || !this.heroSection?.nativeElement) return;
    const heroEl = this.heroSection.nativeElement;

    heroEl.addEventListener('mousemove', this.onMouseMove, { passive: true });
    heroEl.addEventListener('mouseleave', this.onMouseLeave, { passive: true });
    window.addEventListener('resize', this.onResize, { passive: true });

    if ((document as any).fonts?.ready) {
      (document as any).fonts.ready.then(() => this.onResize());
    }

    this.onResize();
    this.renderLoop();
  }

  private onResize = (): void => {
    if (!this.canvasRef?.nativeElement || !this.heroSection?.nativeElement) return;
    const canvas = this.canvasRef.nativeElement;
    const heroEl = this.heroSection.nativeElement;
    const rect = heroEl.getBoundingClientRect();
    const w = rect.width || window.innerWidth;
    const h = rect.height || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvasW = w;
    this.canvasH = h;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    this.ctx = canvas.getContext('2d')!;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.initParticles(w, h);
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.heroSection?.nativeElement) return;
    const rect = this.heroSection.nativeElement.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;
  };

  private onMouseLeave = (): void => {
    this.mouse.x = -9999;
    this.mouse.y = -9999;
  };

  private initParticles(w: number, h: number): void {
    this.particles = [];

    // 1. Offscreen canvas to render text and extract exact pixel coordinates
    const offCanvas = document.createElement('canvas');
    offCanvas.width = w;
    offCanvas.height = h;
    const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
    if (!offCtx) return;

    // Render "NAPTOR" in bold geometric cyber typography
    const text = 'NAPTOR';
    const fontSize = Math.min(Math.floor(w * 0.19), Math.floor(h * 0.28), 170);
    offCtx.font = `900 ${fontSize}px "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif`;
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.fillStyle = '#ffffff';

    const textX = w / 2;
    const textY = h * 0.38;
    offCtx.fillText(text, textX, textY);

    // 2. Get text pixel data from canvas
    const imageData = offCtx.getImageData(0, 0, w, h);
    const data = imageData.data;

    // Sampling stride (gap) to maintain ~800 to 1,400 crisp, high-performance particles
    const step = Math.max(4, Math.floor(w / 320));
    const textHalfWidth = (text.length * fontSize * 0.52) / 2;

    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const index = (y * w + x) * 4;
        const alpha = data[index + 3];

        // Create particles at text pixel positions where alpha > 128
        if (alpha > 128) {
          // Horizontal gradient ratio across the word (Purple -> Indigo -> Cyan)
          const ratio = (x - (textX - textHalfWidth)) / (textHalfWidth * 2);
          let color = '#818cf8'; // Indigo 400
          if (ratio > 0.65) {
            color = '#38bdf8'; // Cyan 400
          } else if (ratio > 0.35) {
            color = '#6366f1'; // Indigo 500
          } else {
            color = '#a78bfa'; // Purple 400
          }

          const size = 1.4 + Math.random() * 0.7;
          const particleAlpha = 0.55 + Math.random() * 0.35;
          this.particles.push(new Particle(x, y, color, size, particleAlpha));
        }
      }
    }

    // 3. Small set of floating ambient depth stars in periphery
    for (let i = 0; i < 22; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const colors = ['#818cf8', '#38bdf8', '#06b6d4'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const p = new Particle(x, y, color, 1.2, 0.25);
      p.isAmbient = true;
      this.particles.push(p);
    }
  }

  private renderLoop(): void {
    this.rafId = requestAnimationFrame(() => this.renderLoop());
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.clearRect(0, 0, this.canvasW, this.canvasH);

    const particles = this.particles;
    const count = particles.length;
    const w = this.canvasW;
    const h = this.canvasH;
    const mouseRadius = 95;

    // On mousemove: scatter nearby particles
    // On frame: lerp particles back to origin
    for (let i = 0; i < count; i++) {
      const p = particles[i];
      p.update(this.mouse.x, this.mouse.y, mouseRadius);
      p.wrap(w, h);
      p.draw(ctx);
    }
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // GRAPH ANIMATION
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  private computeGraphPoints(): { x: number; y: number }[] {
    const w = 800, h = 200, pad = 20;
    const max = Math.max(...this.graphData);
    const step = (w - pad * 2) / (this.graphData.length - 1);
    return this.graphData.map((v, i) => ({
      x: pad + i * step,
      y: h - pad - ((v / max) * (h - pad * 2)),
    }));
  }

  private computeSvgPath(pts: { x: number; y: number }[]): string {
    if (!pts.length) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1], curr = pts[i];
      const cx = (prev.x + curr.x) / 2;
      d += ` C ${cx} ${prev.y} ${cx} ${curr.y} ${curr.x} ${curr.y}`;
    }
    return d;
  }

  private computeSvgArea(pts: { x: number; y: number }[]): string {
    if (!pts.length) return '';
    const linePath = this.computeSvgPath(pts);
    const last = pts[pts.length - 1];
    return `${linePath} L ${last.x} 200 L ${pts[0].x} 200 Z`;
  }

  private startGraphAnimation(): void {
    const updateGraph = () => {
      // Shift array and push new random point
      this.graphData.shift();
      this.graphData.push(40 + Math.random() * 120);
      const pts = this.computeGraphPoints();
      this.ngZone.run(() => {
        this.graphPoints.set(pts);
        this.latencyPath.set(this.computeSvgPath(pts));
        this.latencyArea.set(this.computeSvgArea(pts));
      });
    };
    updateGraph();
    this.graphUpdateInterval = setInterval(updateGraph, 1800);
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // GSAP ANIMATIONS
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  private initGSAP(): void {
    if (typeof gsap === 'undefined') return;

    const heroEl = this.heroSection?.nativeElement;
    const scopeEl = this.rootEl?.nativeElement ?? heroEl;

    this.gsapContext = gsap.context(() => {
      // 1. Down-page ScrollTriggers (Features, Pricing)
      if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        // SVG flow line draw-on-scroll
        const flowLine = this.svgFlowLineRef?.nativeElement;
        if (flowLine) {
          const svgTl = gsap.timeline({
            scrollTrigger: {
              trigger: '#features',
              start:   'top 75%',
              end:     'top 20%',
              scrub:   1,
            },
          });
          svgTl.to(flowLine, { strokeDashoffset: 0, duration: 2, ease: 'power2.inOut' });
          this.gsapTimelines.push(svgTl);
        }

        // Stagger capabilities cards in
        // Safety: ensure cards are visible before animating (prevents blank sections if trigger misfires)
        gsap.set('.capability-card', { opacity: 1, y: 0 });
        gsap.from('.capability-card', {
          y: 50,
          opacity: 0,
          stagger: 0.1,
          duration: 0.65,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '#features',
            start: 'top 90%',
            once: true,
            toggleActions: 'play none none none',
          },
        });

        // Pricing cards stagger
        gsap.set('.pricing-card', { opacity: 1, y: 0 });
        gsap.from('.pricing-card', {
          y: 50,
          opacity: 0,
          stagger: 0.15,
          duration: 0.75,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '#pricing',
            start: 'top 90%',
            once: true,
            toggleActions: 'play none none none',
          },
        });

        // Second section (.card fan-out effect)
        gsap.set('#monitoring .card', { opacity: 1 });
        gsap.from('#monitoring .card', {
          y: 30,
          opacity: 0,
          stagger: 0.08,
          duration: 0.5,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '#monitoring',
            start: 'top 90%',
            once: true,
          },
        });
        // Fan-out decoration on scroll
        gsap.to('#monitoring .card', {
          x: (i: number) => (i - 2) * 25,
          rotation: (i: number) => (i - 2) * 8,
          duration: 0.5,
          ease: 'back.out(1.4)',
          scrollTrigger: {
            trigger: '#monitoring',
            start: 'top 75%',
            once: true,
          },
        });
      }

      // Card hover depth interaction
      const cards = scopeEl?.querySelectorAll?.('#monitoring .card');
      cards?.forEach?.((card: Element) => {
        card.addEventListener('mouseenter', () => {
          gsap.to(card, { y: -10, scale: 1.04, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
        });
        card.addEventListener('mouseleave', () => {
          gsap.to(card, { y: 0, scale: 1, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
        });
      });

      // 2. Wave Ambient Animation (GSAP timeline)
      const waves = this.wavesContainer?.nativeElement?.querySelectorAll?.('.hero-wave') ?? 
                    document.querySelectorAll('.hero-wave');
      if (waves && waves.length) {
        const waveTl = gsap.timeline({ repeat: -1, yoyo: true });
        waves.forEach((wave: Element, i: number) => {
          waveTl.to(wave, {
            y: -20 + i * 10,
            scaleX: 1.2,
            opacity: 0.4,
            duration: 3 + i,
            ease: 'sine.inOut',
          }, 0);
        });
        this.gsapTimelines.push(waveTl);
      }

      // 3. Dynamic text entrance timeline with 3D cascading letters
      const heading = this.heroHeadingRef?.nativeElement ?? heroEl?.querySelector?.('.hero-heading') ?? document.querySelector('.hero-heading');

      if (heading && !heading.querySelector('.letter')) {
        const html = heading.innerHTML;
        heading.innerHTML = html.replace(/(<[^>]+>)|([^<\s])/g, function(_m: string, tag: string, ch: string) {
          if (tag) return tag;
          return '<span class="letter inline-block">' + ch + '</span>';
        });
      }

      const letters = heading ? heading.querySelectorAll('.letter') : (heroEl?.querySelectorAll?.('.letter') ?? document.querySelectorAll('.letter'));
      const tl = gsap.timeline({ delay: 0 });

      // 1. Badge entrance
      tl.from('.hero-chip', { 
        y: 20, 
        opacity: 0, 
        scale: 0.8, 
        duration: 0.5, 
        ease: 'back.out(1.7)' 
      }, 0);

      // 2. Letters cascade in with 3D rotation
      if (letters && letters.length) {
        tl.from(letters, {
          y: 60, 
          opacity: 0, 
          rotateX: -90, 
          filter: 'blur(8px)',
          duration: 0.9, 
          ease: 'power4.out',
          stagger: { each: 0.03, from: 'start' },
          clearProps: 'filter',
        }, 0.3);
      }

      // 3. Subtitle
      tl.from('.hero-sub', { 
        y: 20, 
        opacity: 0, 
        duration: 0.6, 
        ease: 'power2.out' 
      }, '-=0.4');

      // CTAs & Badges entrance
      tl.from('.hero-cta', {
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out'
      }, '-=0.3');

      tl.from('.hero-badges', {
        y: 15,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.out'
      }, '-=0.2');

      // 4. Underline sweep
      tl.to('.hero-line', { 
        width: '60%', 
        duration: 0.8, 
        ease: 'power3.out' 
      }, '-=0.3');

      tl.to('.hero-line', { 
        opacity: 0.6, 
        duration: 1, 
        ease: 'sine.inOut', 
        yoyo: true, 
        repeat: -1 
      });

      this.gsapTimelines.push(tl);
    }, scopeEl);
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // LIVE METRIC UPDATES
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  private startLiveMetricUpdates(): void {
    this.liveMetricInterval = setInterval(() => {
      const updated = this._liveMetrics.map(m => ({
        ...m,
        value: m.label === 'Uptime'
          ? (99.90 + Math.random() * 0.09).toFixed(2)
          : m.label === 'SSL Expiry'
          ? String(Math.floor(60 + Math.random() * 20))
          : String(Math.floor(Number(m.value) + (Math.random() - 0.5) * 8)),
      }));
      this._liveMetrics = updated as typeof this._liveMetrics;
      this.liveMetrics.set(updated as typeof this._liveMetrics);
    }, 2500);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CURTAIN REVEAL OVERLAY
  // ──────────────────────────────────────────────────────────────────────────
  private initCurtainReveal(): void {
    if (typeof gsap === 'undefined') return;
    const curtainLeft = document.querySelector('.curtain-left');
    const curtainRight = document.querySelector('.curtain-right');
    if (!curtainLeft && !curtainRight) return;

    const curtainTl = gsap.timeline({
      delay: 0.15,
      onComplete: () => {
        gsap.set(['.curtain-left', '.curtain-right'], { display: 'none' });
      },
    });

    curtainTl.to(['.curtain-left', '.curtain-right'], {
      scaleX: 0,
      duration: 1.1,
      ease: 'power4.inOut',
      stagger: 0.04,
    });

    this.gsapTimelines.push(curtainTl);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SIGNAL FLOW SVG ANIMATIONS
  // ──────────────────────────────────────────────────────────────────────────
  private initSignalFlowAnimations(): void {
    if (typeof gsap === 'undefined') return;

    // 1. Continuous rotation for the central hub ring
    const spinRing = document.querySelector('.sf-spin-ring');
    if (spinRing) {
      const spinTl = gsap.to(spinRing, {
        rotation: 360,
        transformOrigin: 'center center',
        duration: 22,
        repeat: -1,
        ease: 'none',
      });
      this.gsapTimelines.push(spinTl);
    }

    // 2. Subtle breathing pulse for the central hexagon
    const morphHex = document.querySelector('.sf-morph-hex');
    if (morphHex) {
      const pulseTl = gsap.to(morphHex, {
        scale: 1.06,
        transformOrigin: 'center center',
        duration: 2.2,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      });
      this.gsapTimelines.push(pulseTl);
    }

    // 3. ScrollTrigger flow line drawing and stat badges reveal
    if (typeof ScrollTrigger !== 'undefined') {
      const drawLines = document.querySelectorAll('.sf-draw-line');
      if (drawLines.length) {
        const flowTl = gsap.timeline({
          scrollTrigger: {
            trigger: '#signal-flow',
            start: 'top 80%',
            once: true,
          },
        });

        flowTl.to(drawLines, {
          strokeDashoffset: 0,
          duration: 1.4,
          stagger: 0.14,
          ease: 'power2.out',
        });

        flowTl.from('.sf-stat', {
          y: 24,
          opacity: 0,
          stagger: 0.12,
          duration: 0.6,
          ease: 'power3.out',
        }, '-=0.5');

        this.gsapTimelines.push(flowTl);
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SCRAMBLE TEXT ANIMATION
  // ──────────────────────────────────────────────────────────────────────────
  private initScrambleText(): void {
    const scrambleEls = document.querySelectorAll<HTMLElement>('.scramble-text');
    if (!scrambleEls.length) return;

    const chars = '!<>-_\\/[]{}—=+*^?#________0123456789';

    const runScramble = (el: HTMLElement) => {
      const targetText = el.getAttribute('data-target') || el.innerText.trim();
      let iteration = 0;
      const totalSteps = targetText.length;
      const speed = 32;

      const intervalId = setInterval(() => {
        el.innerText = targetText
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iteration) {
              return targetText[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('');

        if (iteration >= totalSteps) {
          clearInterval(intervalId);
          el.innerText = targetText;
        }

        iteration += 0.5;
      }, speed);

      this.scrambleIntervals.push(intervalId);
    };

    if (typeof ScrollTrigger !== 'undefined') {
      scrambleEls.forEach((el) => {
        ScrollTrigger.create({
          trigger: el,
          start: 'top 85%',
          once: true,
          onEnter: () => runScramble(el),
        });
      });
    } else {
      scrambleEls.forEach((el) => runScramble(el));
    }
  }
}

