import React from 'react';
import { projectService } from '../../services/projectService';
import { Layers, Users, GitFork, ShieldCheck, ArrowRight } from 'lucide-react';
import { NftProjectAccount } from '../../types';

interface NftProjectsSectionProps {
  onSelectProject?: (project: NftProjectAccount) => void;
  onOpenAuth: () => void;
}

export const NftProjectsSection: React.FC<NftProjectsSectionProps> = ({
  onSelectProject,
  onOpenAuth,
}) => {
  const projects = projectService.getAllProjects();

  return (
    <section id="projects" className="relative py-24 md:py-32 border-t border-white/5 bg-[#060810] overflow-hidden">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/3 left-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="space-y-4 max-w-2xl">
            <span className="text-xs md:text-sm font-bold tracking-[0.2em] text-cyan-400 uppercase">
              COMMUNITY & CREATOR SPACES
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              NFT Projects have a home on Mosaic.
            </h2>
            <p className="text-base sm:text-lg text-slate-300">
              Creators and decentralized communities build verified project hubs to coordinate releases, track multi-branch relays, and rally collectors.
            </p>
          </div>

          <button
            onClick={onOpenAuth}
            className="inline-flex items-center gap-2 text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors self-start md:self-auto cursor-pointer"
          >
            <span>Register your project</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Project Hub Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {projects.slice(0, 3).map((project) => (
            <div
              key={project.id}
              onClick={() => onSelectProject && onSelectProject(project)}
              className="group rounded-3xl bg-[#090c18] border border-white/10 hover:border-purple-500/40 transition-all duration-300 overflow-hidden shadow-xl hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Banner Header */}
                <div className="relative h-44 overflow-hidden bg-slate-900">
                  <img
                    src={project.banner}
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090c18] via-transparent to-black/30" />
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-semibold text-cyan-300 border border-white/10">
                    {project.category}
                  </div>
                </div>

                {/* Content Body with Avatar Offset */}
                <div className="p-6 relative pt-0">
                  <div className="relative -mt-10 mb-4 inline-block">
                    <img
                      src={project.logo}
                      alt={project.name}
                      className="w-16 h-16 rounded-2xl object-cover ring-4 ring-[#090c18] shadow-lg border border-purple-500/30"
                    />
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                      {project.name}
                    </h3>
                    <span title="Verified Project">
                      <ShieldCheck className="w-4.5 h-4.5 text-cyan-400" />
                    </span>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">
                    {project.description}
                  </p>
                </div>
              </div>

              {/* Bottom Metrics Bar */}
              <div className="p-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 bg-[#070914]">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="font-semibold text-slate-200">
                    {project.followersCount.toLocaleString()}
                  </span>
                  <span>members</span>
                </div>

                <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                  <GitFork className="w-4 h-4" />
                  <span>{project.relaysCount} Relays live</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
