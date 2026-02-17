
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  TrackStats, SafetyAlert, AlertSeverity, HistoryData 
} from './types';
import { 
  INITIAL_TRACK_STATS, MOCK_HISTORY, ICONS 
} from './constants';
import StatCard from './components/StatCard';
import AlertsPanel from './components/AlertsPanel';
import HistoryChart from './components/HistoryChart';
import { analyzeSafetyFrame, getSmartAlertMessage, SafetyAnalysisResponse } from './services/geminiService';

const App: React.FC = () => {
  const [stats, setStats] = useState<TrackStats>(INITIAL_TRACK_STATS);
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [history, setHistory] = useState<HistoryData[]>(MOCK_HISTORY);
  const [isSystemActive, setIsSystemActive] = useState(true);
  const [lastAnalysis, setLastAnalysis] = useState<SafetyAnalysisResponse | null>(null);
  const [smartDirective, setSmartDirective] = useState("System online. Monitoring track vectors...");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Buzzer Audio Context on first user interaction
  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playBuzzer = useCallback(() => {
    initAudio();
    if (!audioCtxRef.current) return;

    const ctx = audioCtxRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'square'; // Harsh buzzer-like sound
    oscillator.frequency.setValueAtTime(550, ctx.currentTime);

    // Create a pulsing effect for 5 seconds
    const duration = 5;
    const pulseRate = 0.5; // 0.5s on, 0.5s off
    for (let t = 0; t < duration; t += pulseRate * 2) {
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime + t);
      gainNode.gain.setValueAtTime(0, ctx.currentTime + t + pulseRate);
    }

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  }, []);

  // Initialize Camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access failed:", err);
      }
    };
    initCamera();
    
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Simulation Logic
  useEffect(() => {
    if (!isSystemActive) return;

    const interval = setInterval(() => {
      setStats(prev => {
        const fogChange = (Math.random() - 0.5) * 2;
        const newFog = Math.max(0, Math.min(100, prev.fogLevel + fogChange));
        
        // Randomly trigger an intrusion for simulation
        const intrusionRoll = Math.random();
        const intrusionDetected = intrusionRoll > 0.98;

        if (intrusionDetected) {
          const newAlert: SafetyAlert = {
            id: Date.now().toString(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            type: 'Intrusion',
            message: 'Unidentified object detected on main track.',
            severity: AlertSeverity.CRITICAL,
            location: 'Sector 4-B'
          };
          setAlerts(prevA => [newAlert, ...prevA].slice(0, 20));
          playBuzzer(); // Trigger audio warning
        }

        return {
          ...prev,
          fogLevel: newFog,
          visibility: 100 - newFog,
          speed: 120 + (Math.random() - 0.5) * 10,
          intrusionDetected: intrusionDetected || prev.intrusionDetected
        };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isSystemActive, playBuzzer]);

  // Periodic Smart Analysis
  const performAnalysis = useCallback(async () => {
    if (!canvasRef.current || !videoRef.current || isAnalyzing) return;
    
    setIsAnalyzing(true);
    const context = canvasRef.current.getContext('2d');
    if (context) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      
      const base64Image = canvasRef.current.toDataURL('image/jpeg', 0.8).split(',')[1];
      const result = await analyzeSafetyFrame(base64Image);
      const directive = await getSmartAlertMessage(stats);
      
      if (result) {
        setLastAnalysis(result);
        if (result.hazardProbability > 50) {
           const newAlert: SafetyAlert = {
            id: Date.now().toString(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'Track Fault',
            message: result.assessment,
            severity: result.hazardProbability > 80 ? AlertSeverity.CRITICAL : AlertSeverity.HIGH,
            location: 'Remote Analysis Node'
          };
          setAlerts(prev => [newAlert, ...prev].slice(0, 20));
          playBuzzer(); // Trigger audio warning
        }
      }
      setSmartDirective(directive);
    }
    setIsAnalyzing(false);
  }, [isAnalyzing, stats, playBuzzer]);

  useEffect(() => {
    const analysisTimer = setInterval(performAnalysis, 15000);
    return () => clearInterval(analysisTimer);
  }, [performAnalysis]);

  const toggleSystem = () => {
    initAudio(); // Priming audio context
    setIsSystemActive(!isSystemActive);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" onClick={initAudio}>
      {/* Header */}
      <header className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-lg shadow-blue-500/20">
            {ICONS.Train}
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">SafeRail Vision</h1>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Autonomous Safety Monitoring System v3.2</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
             <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isSystemActive ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-500'}`}></span>
                <span className="text-xs font-semibold uppercase">{isSystemActive ? 'System Active' : 'Maintenance Mode'}</span>
             </div>
             <span className="text-[10px] text-slate-500 font-mono">ID: RLY-9942-EXP</span>
          </div>
          <button 
            onClick={toggleSystem}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${isSystemActive ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500 text-white'}`}
          >
            {isSystemActive ? 'Emergency Halt Simulation' : 'Resume Monitoring'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Feed and Analytics */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* Top Row: Video Feed & Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 relative bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl group">
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline 
                className="w-full aspect-video object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Overlays */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-4 left-4 flex gap-2">
                   <span className="bg-black/60 backdrop-blur-md text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold border border-emerald-500/30 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      LIVE STREAM
                   </span>
                   {isAnalyzing && (
                     <span className="bg-blue-600/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold border border-blue-400/30 flex items-center gap-2 animate-pulse">
                        ANALYZING...
                     </span>
                   )}
                </div>
                
                {/* Visual Scanning Lines */}
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-[scan_4s_linear_infinite] opacity-50"></div>
                
                <div className="absolute bottom-4 left-4 right-4 bg-slate-900/80 backdrop-blur-lg border border-slate-700 p-3 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500/20 text-blue-400 w-8 h-8 rounded-lg flex items-center justify-center">
                      {ICONS.Pulse}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Safety Directive</p>
                      <p className="text-xs text-blue-100 font-medium italic">{smartDirective}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2 mb-4">
                    {ICONS.Shield} Track Diagnostic
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500 uppercase tracking-tighter">Track Stability</span>
                        <span className="text-emerald-400 font-bold">{stats.trackHealth}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${stats.trackHealth}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500 uppercase tracking-tighter">Fog Density</span>
                        <span className={`${stats.fogLevel > 60 ? 'text-rose-400' : 'text-blue-400'} font-bold`}>{stats.fogLevel.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ${stats.fogLevel > 60 ? 'bg-rose-500' : 'bg-blue-500'}`} style={{ width: `${stats.fogLevel}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-800">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-3">Detected Entities</h4>
                  <div className="flex flex-wrap gap-2">
                    {lastAnalysis?.detectedObjects.map((obj, i) => (
                      <span key={i} className="bg-slate-800 px-3 py-1 rounded-full text-[10px] border border-slate-700">
                        {obj}
                      </span>
                    )) || <span className="text-slate-600 text-[10px]">Scanning for patterns...</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard 
              label="Intrusion Status" 
              value={stats.intrusionDetected ? "WARNING" : "CLEAR"} 
              icon={ICONS.Shield} 
              colorClass={stats.intrusionDetected ? "text-rose-500" : "text-emerald-500"}
              isAlert={stats.intrusionDetected}
            />
            <StatCard 
              label="Fog Level" 
              value={stats.fogLevel.toFixed(1)} 
              unit="%" 
              icon={ICONS.Cloud} 
              colorClass="text-slate-400"
              trend={stats.fogLevel > 50 ? 'down' : 'up'}
            />
            <StatCard 
              label="Train Speed" 
              value={stats.speed.toFixed(0)} 
              unit="km/h" 
              icon={ICONS.Pulse} 
              colorClass="text-blue-400"
            />
          </div>

          {/* Bottom Row: Graph and Manual Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                   <h2 className="text-sm font-bold flex items-center gap-2">
                     <i className="fas fa-chart-line text-blue-500"></i>
                     Safety Performance History
                   </h2>
                   <div className="flex gap-2">
                      <button className="bg-slate-800 px-2 py-1 rounded text-[10px] text-slate-400">24H</button>
                      <button className="bg-blue-600 px-2 py-1 rounded text-[10px] text-white">7D</button>
                   </div>
                </div>
                <HistoryChart data={history} />
             </div>
             
             <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-sm font-bold flex items-center gap-2 mb-6">
                   <i className="fas fa-sliders-h text-slate-400"></i>
                   System Diagnostics
                </h2>
                <div className="space-y-4">
                   <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-800">
                      <span className="text-xs">GPS Telemetry Link</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">LOCKED</span>
                   </div>
                   <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-800 opacity-50">
                      <span className="text-xs">Acoustic Sensors</span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold">WARMING</span>
                   </div>
                   <button 
                    onClick={() => performAnalysis()}
                    disabled={isAnalyzing}
                    className="w-full mt-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                   >
                     {isAnalyzing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sync-alt"></i>}
                     Manual Deep Audit
                   </button>
                </div>
             </div>
          </div>
        </div>

        {/* Right: Alerts Panel */}
        <div className="lg:col-span-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 h-full shadow-2xl sticky top-24">
            <AlertsPanel alerts={alerts} />
          </div>
        </div>

      </main>

      {/* Footer Branding */}
      <footer className="mt-auto px-6 py-4 border-t border-slate-900 bg-slate-950/80 backdrop-blur-sm text-center">
        <p className="text-[10px] text-slate-500 flex items-center justify-center gap-2 font-mono">
          <i className="fas fa-shield-alt"></i>
          RAILWAY SAFETY CLUSTER — OPERATIONAL STATUS: NOMINAL — (C) 2024 SAFERAIL GLOBAL
        </p>
      </footer>

      {/* Custom styles for animations & scrollbars */}
      <style>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0f172a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default App;
