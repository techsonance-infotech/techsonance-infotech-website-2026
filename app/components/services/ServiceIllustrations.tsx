import React from "react";
import Image from "next/image";

export function ServiceIllustration({ slug }: { slug: string }) {
  const animations = (
    <style
      dangerouslySetInnerHTML={{
        __html: `
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
    `,
      }}
    />
  );

  const wrapperClass =
    "w-full aspect-[4/3] rounded-[32px] bg-gradient-to-br from-slate-50 to-blue-50/40 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden group";

  switch (slug) {
    case "custom-software-development":
      return (
        <div className={wrapperClass}>
          {animations}
          {/* Safari Browser Mockup containing real Logistics platform screenshot */}
          <div className="flex h-full w-full transform flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl transition-transform duration-500 group-hover:scale-[1.01]">
            {/* Safari Window Header */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-slate-50 px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-rose-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
              </div>
              <div className="flex h-5 w-1/2 max-w-[200px] items-center justify-center rounded-md border border-gray-200/80 bg-white font-mono text-[9px] text-gray-400">
                admin.freightflow.io
              </div>
              <div className="w-8" />
            </div>
            {/* Browser Content */}
            <div className="relative flex flex-grow items-center justify-center overflow-hidden bg-white">
              <Image
                src="/images/projects/freightflow/freightflow-logistics-fleet-management-dashboard.png"
                alt="FreightFlow Dashboard"
                width={600}
                height={400}
                className="h-full w-full object-contain"
              />
              {/* Glassmorphic overlay */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/5 to-transparent" />
            </div>
          </div>
        </div>
      );

    case "ai-automation":
      return (
        <div className={wrapperClass}>
          {animations}
          {/* Safari Browser Mockup containing n8n AI Automation workflow screenshot */}
          <div className="flex h-full w-full transform flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl transition-transform duration-500 group-hover:scale-[1.01]">
            {/* Window Header */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-slate-50 px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-rose-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
              </div>
              <div className="flex h-5 w-1/2 max-w-[200px] items-center justify-center rounded-md border border-gray-200/80 bg-white font-mono text-[9px] text-gray-400">
                workflows.techsonance.com
              </div>
              <div className="w-8" />
            </div>
            {/* Browser Content */}
            <div className="relative flex flex-grow items-center justify-center overflow-hidden bg-white p-2">
              <Image
                src="/images/AI Automation.png"
                alt="AI Automation Workflow"
                width={600}
                height={400}
                className="h-full w-full object-contain"
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
          <div className="flex w-[90%] max-w-[280px] flex-col items-center">
            {/* Screen */}
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-xl border-[4px] border-slate-800 bg-slate-950 p-0.5 shadow-2xl">
              {/* Web screen content */}
              <Image
                src="/images/projects/syncserve/syncserve-retail-pos-sales-analytics.png"
                alt="SaaS Analytics Dashboard"
                width={500}
                height={320}
                className="h-full w-full object-cover"
              />
            </div>
            {/* MacBook Bottom Body */}
            <div className="relative flex h-3.5 w-[115%] items-center justify-center rounded-b-xl border-t border-slate-300 bg-slate-400 shadow-md">
              {/* Display opening indent notch */}
              <div className="h-1.5 w-12 rounded-b-md bg-slate-500" />
            </div>
          </div>
        </div>
      );

    case "web-development":
      return (
        <div className={wrapperClass}>
          {animations}
          {/* Card containing clean illustration of Web Development */}
          <div className="flex h-full w-full transform items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-xl transition-transform duration-500 group-hover:scale-[1.01]">
            <Image
              src="/images/Web development.png"
              alt="Web Development"
              width={500}
              height={350}
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      );

    case "mobile-development":
      return (
        <div className={wrapperClass}>
          {animations}
          {/* Card containing clean illustration of two iPhones side by side */}
          <div className="flex h-full w-full transform items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-xl transition-transform duration-500 group-hover:scale-[1.01]">
            <Image
              src="/images/mobile app.png"
              alt="Mobile App Development"
              width={500}
              height={350}
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      );

    case "cloud-devops":
      return (
        <div className={wrapperClass}>
          {animations}
          {/* DevOps Pipeline Monitor Terminal */}
          <div className="flex h-full w-full flex-col rounded-2xl border border-slate-800 bg-[#0F172A] p-4 font-mono text-[9px] text-slate-300 shadow-xl sm:text-[10px]">
            {/* Header */}
            <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </div>
              <span className="text-[9px] font-bold tracking-wider text-slate-500 uppercase">
                production-deploy.sh
              </span>
              <div className="w-6" />
            </div>
            {/* CLI Output Logs */}
            <div className="flex-grow space-y-1.5 text-emerald-400">
              <p>
                <span className="text-slate-500">~</span> npx next build
              </p>
              <p className="text-slate-400">▲ Next.js 16.2 (Turbopack)</p>
              <p className="text-slate-400">✓ Compiled successfully in 4.2s</p>
              <p className="text-cyan-400">✓ Generating static pages (20/20)...</p>
              <p className="text-slate-400">
                <span className="text-emerald-500">[INFO]</span> docker build -t techsonance-prod .
              </p>
              <p>
                <span className="text-slate-500">~</span> push image to AWS ECR registry...
              </p>
              <p className="inline-block rounded bg-slate-800/80 px-1 py-0.5 text-white">
                <span className="text-emerald-500">[K8S]</span> deployment/web-app replica running{" "}
                <span className="anim-cursor">█</span>
              </p>
            </div>
            {/* Floating Kubernetes / Docker badges */}
            <div className="mt-2 flex items-center justify-end gap-2 border-t border-slate-800/80 pt-2.5 text-[8px] font-bold text-slate-500">
              <span className="rounded border border-slate-700/60 bg-slate-800 px-1.5 py-0.5">
                DOCKER
              </span>
              <span className="rounded border border-blue-900/60 bg-blue-950 px-1.5 py-0.5 text-blue-400">
                KUBERNETES
              </span>
              <span className="rounded border border-amber-900/60 bg-amber-950 px-1.5 py-0.5 text-amber-500">
                AWS
              </span>
            </div>
          </div>
        </div>
      );

    case "api-integrations":
      return (
        <div className={wrapperClass}>
          {animations}
          {/* Safari Browser Mockup containing third-party API integration workflow SVG */}
          <div className="flex h-full w-full transform flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl transition-transform duration-500 group-hover:scale-[1.01]">
            {/* Window Header */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-slate-50 px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-rose-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
              </div>
              <div className="flex h-5 w-1/2 max-w-[200px] items-center justify-center rounded-md border border-gray-200/80 bg-white font-mono text-[9px] text-gray-400">
                api.techsonance.com
              </div>
              <div className="w-8" />
            </div>
            {/* Browser Content */}
            <div className="relative flex flex-grow items-center justify-center overflow-hidden bg-white p-3">
              <Image
                src="/images/third-party-api-integration-services.svg"
                alt="API & Systems Integration"
                width={500}
                height={350}
                className="h-full w-full object-contain"
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
          <div className="flex h-full w-full flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                Agile Roadmap
              </span>
              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-[#22B6F6]">
                Sprint 24
              </span>
            </div>

            <div className="flex-grow space-y-3">
              {/* Task 1 */}
              <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-slate-50 p-2.5 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-emerald-500">✓</span>
                  <div>
                    <h5 className="mb-1 text-[10px] leading-none font-bold text-gray-800">
                      Architecture setup
                    </h5>
                    <p className="text-[8px] leading-none text-gray-400">Completed by Lead Dev</p>
                  </div>
                </div>
                <span className="rounded bg-slate-200/60 px-1 py-0.5 font-mono text-[8px] text-slate-500">
                  2d ago
                </span>
              </div>

              {/* Task 2 */}
              <div className="flex items-center justify-between rounded-lg border border-[#22B6F6]/30 bg-[#E6F4FE]/20 p-2.5 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full border-2 border-[#22B6F6]">
                    <span className="h-1 w-1 animate-ping rounded-full bg-[#22B6F6]" />
                  </span>
                  <div>
                    <h5 className="mb-1 text-[10px] leading-none font-bold text-gray-900">
                      Payment API integration
                    </h5>
                    <p className="text-[8px] leading-none text-gray-500">In progress (80%)</p>
                  </div>
                </div>
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[8px] font-bold text-amber-700">
                  ACTIVE
                </span>
              </div>

              {/* Task 3 */}
              <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-2.5">
                <div className="flex items-center gap-2.5 opacity-50">
                  <span className="h-2.5 w-2.5 rounded-full border border-gray-300" />
                  <div>
                    <h5 className="mb-1 text-[10px] leading-none font-bold text-gray-700">
                      Load testing & deployment
                    </h5>
                    <p className="text-[8px] leading-none text-gray-400">Pending QA approval</p>
                  </div>
                </div>
                <span className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[8px] text-slate-400">
                  Sprint 25
                </span>
              </div>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}
