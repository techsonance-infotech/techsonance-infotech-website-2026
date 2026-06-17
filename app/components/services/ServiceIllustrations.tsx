import React from "react";

export function ServiceIllustration({ slug }: { slug: string }) {
  const animations = (
    <style dangerouslySetInnerHTML={{ __html: `
      @keyframes pulseCursor {
        0%, 100% { opacity: 0; }
        50% { opacity: 1; }
      }
      @keyframes dashFlow {
        to { stroke-dashoffset: -20; }
      }
      @keyframes spinSlow {
        to { transform: rotate(360deg); }
      }
      .anim-cursor { animation: pulseCursor 1s infinite; }
      .anim-dash { stroke-dasharray: 4, 4; animation: dashFlow 1.5s linear infinite; }
      .anim-spin-slow { animation: spinSlow 12s linear infinite; transform-origin: center; }
    `}} />
  );

  const wrapperClass = "w-full aspect-[4/3] rounded-[32px] bg-gradient-to-br from-slate-50 to-blue-50/40 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden group";

  switch (slug) {
    case "custom-software-development":
      return (
        <div className={wrapperClass}>
          {animations}
          {/* Safari Browser Mockup containing real Logistics platform screenshot */}
          <div className="w-full h-full flex flex-col bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden transform group-hover:scale-[1.01] transition-transform duration-500">
            {/* Safari Window Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-gray-200">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="w-1/2 max-w-[200px] h-5 bg-white border border-gray-200/80 rounded-md flex items-center justify-center text-[9px] text-gray-400 font-mono">
                admin.freightflow.io
              </div>
              <div className="w-8" />
            </div>
            {/* Browser Content */}
            <div className="flex-grow relative overflow-hidden bg-white flex items-center justify-center">
              <img
                src="/images/projects/freightflow/freightflow-logistics-fleet-management-dashboard.png"
                alt="FreightFlow Dashboard"
                className="w-full h-full object-contain"
              />
              {/* Glassmorphic overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/5 to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      );

    case "ai-automation":
      return (
        <div className={wrapperClass}>
          {animations}
          {/* Safari Browser Mockup containing n8n AI Automation workflow screenshot */}
          <div className="w-full h-full flex flex-col bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden transform group-hover:scale-[1.01] transition-transform duration-500">
            {/* Window Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-gray-200">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="w-1/2 max-w-[200px] h-5 bg-white border border-gray-200/80 rounded-md flex items-center justify-center text-[9px] text-gray-400 font-mono">
                workflows.techsonance.com
              </div>
              <div className="w-8" />
            </div>
            {/* Browser Content */}
            <div className="flex-grow relative overflow-hidden bg-white flex items-center justify-center p-2">
              <img
                src="/images/AI Automation.png"
                alt="AI Automation Workflow"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      );

    case "saas-product-development":
      return (
        <div className={wrapperClass}>
          {animations}
          {/* MacBook Laptop Mockup displaying Sales Analytics dashboard */}
          <div className="w-[90%] max-w-[280px] flex flex-col items-center">
            {/* Screen */}
            <div className="w-full aspect-[16/10] bg-slate-950 rounded-t-xl border-[4px] border-slate-800 p-0.5 shadow-2xl relative overflow-hidden">
              {/* Web screen content */}
              <img
                src="/images/projects/syncserve/syncserve-retail-pos-sales-analytics.png"
                alt="SaaS Analytics Dashboard"
                className="w-full h-full object-cover"
              />
            </div>
            {/* MacBook Bottom Body */}
            <div className="w-[115%] h-3.5 bg-slate-400 rounded-b-xl border-t border-slate-300 relative flex items-center justify-center shadow-md">
              {/* Display opening indent notch */}
              <div className="w-12 h-1.5 bg-slate-500 rounded-b-md" />
            </div>
          </div>
        </div>
      );

    case "web-development":
      return (
        <div className={wrapperClass}>
          {animations}
          {/* Card containing clean illustration of Web Development */}
          <div className="w-full h-full bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden flex items-center justify-center transform group-hover:scale-[1.01] transition-transform duration-500 p-2">
            <img
              src="/images/Web development.png"
              alt="Web Development"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      );

    case "mobile-development":
      return (
        <div className={wrapperClass}>
          {animations}
          {/* Card containing clean illustration of two iPhones side by side */}
          <div className="w-full h-full bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden flex items-center justify-center transform group-hover:scale-[1.01] transition-transform duration-500 p-2">
            <img
              src="/images/mobile app.png"
              alt="Mobile App Development"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      );

    case "cloud-devops":
      return (
        <div className={wrapperClass}>
          {animations}
          {/* DevOps Pipeline Monitor Terminal */}
          <div className="w-full h-full bg-[#0F172A] rounded-2xl border border-slate-800 shadow-xl p-4 flex flex-col font-mono text-[9px] sm:text-[10px] text-slate-300">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">production-deploy.sh</span>
              <div className="w-6" />
            </div>
            {/* CLI Output Logs */}
            <div className="flex-grow space-y-1.5 text-emerald-400">
              <p><span className="text-slate-500">~</span> npx next build</p>
              <p className="text-slate-400">▲ Next.js 16.2 (Turbopack)</p>
              <p className="text-slate-400">✓ Compiled successfully in 4.2s</p>
              <p className="text-cyan-400">✓ Generating static pages (20/20)...</p>
              <p className="text-slate-400"><span className="text-emerald-500">[INFO]</span> docker build -t techsonance-prod .</p>
              <p><span className="text-slate-500">~</span> push image to AWS ECR registry...</p>
              <p className="text-white bg-slate-800/80 px-1 py-0.5 rounded inline-block"><span className="text-emerald-500">[K8S]</span> deployment/web-app replica running <span className="anim-cursor">█</span></p>
            </div>
            {/* Floating Kubernetes / Docker badges */}
            <div className="flex items-center gap-2 border-t border-slate-800/80 pt-2.5 mt-2 justify-end text-[8px] text-slate-500 font-bold">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/60">DOCKER</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-950 border border-blue-900/60 text-blue-400">KUBERNETES</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-900/60 text-amber-500">AWS</span>
            </div>
          </div>
        </div>
      );

    case "api-integrations":
      return (
        <div className={wrapperClass}>
          {animations}
          {/* Safari Browser Mockup containing third-party API integration workflow SVG */}
          <div className="w-full h-full flex flex-col bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden transform group-hover:scale-[1.01] transition-transform duration-500">
            {/* Window Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-gray-200">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="w-1/2 max-w-[200px] h-5 bg-white border border-gray-200/80 rounded-md flex items-center justify-center text-[9px] text-gray-400 font-mono">
                api.techsonance.com
              </div>
              <div className="w-8" />
            </div>
            {/* Browser Content */}
            <div className="flex-grow relative overflow-hidden bg-white flex items-center justify-center p-3">
              <img
                src="/images/third-party-api-integration-services.svg"
                alt="API & Systems Integration"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      );

    case "product-engineering":
      return (
        <div className={wrapperClass}>
          {animations}
          {/* Gantt & Sprint Roadmap board */}
          <div className="w-full h-full bg-white rounded-2xl border border-gray-200 shadow-xl p-4 flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Agile Roadmap</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-[#008BD9] font-bold">Sprint 24</span>
            </div>

            <div className="flex-grow space-y-3">
              {/* Task 1 */}
              <div className="p-2.5 rounded-lg border border-gray-150/80 bg-slate-50 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="text-emerald-500 text-xs">✓</span>
                  <div>
                    <h5 className="text-[10px] font-bold text-gray-800 leading-none mb-1">Architecture setup</h5>
                    <p className="text-[8px] text-gray-400 leading-none">Completed by Lead Dev</p>
                  </div>
                </div>
                <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-slate-200/60 text-slate-500">2d ago</span>
              </div>

              {/* Task 2 */}
              <div className="p-2.5 rounded-lg border border-[#008BD9]/30 bg-[#E6F4FE]/20 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-[#008BD9] flex items-center justify-center"><span className="w-1 h-1 rounded-full bg-[#008BD9] animate-ping" /></span>
                  <div>
                    <h5 className="text-[10px] font-bold text-gray-900 leading-none mb-1">Payment API integration</h5>
                    <p className="text-[8px] text-gray-500 leading-none">In progress (80%)</p>
                  </div>
                </div>
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">ACTIVE</span>
              </div>

              {/* Task 3 */}
              <div className="p-2.5 rounded-lg border border-gray-100 bg-white flex items-center justify-between">
                <div className="flex items-center gap-2.5 opacity-50">
                  <span className="w-2.5 h-2.5 rounded-full border border-gray-300" />
                  <div>
                    <h5 className="text-[10px] font-bold text-gray-700 leading-none mb-1">Load testing & deployment</h5>
                    <p className="text-[8px] text-gray-400 leading-none">Pending QA approval</p>
                  </div>
                </div>
                <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-slate-100 text-slate-400">Sprint 25</span>
              </div>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}
