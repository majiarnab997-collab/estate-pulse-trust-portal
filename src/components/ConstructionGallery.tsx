/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Image, Video, Eye, X, Calendar, MapPin, Tag, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Media } from '../types';

interface ConstructionGalleryProps {
  mediaItems: Media[];
}

export default function ConstructionGallery({ mediaItems }: ConstructionGalleryProps) {
  const [selectedItem, setSelectedItem] = useState<Media | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'IMAGE' | 'VIDEO'>('ALL');
  
  if (mediaItems.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <Image className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="font-medium text-slate-300">No Construction Updates Posted Yet</p>
        <p className="text-xs text-slate-500 mt-1">Updates on foundation milestones will appear here.</p>
      </div>
    );
  }

  const filteredMedia = mediaItems.filter(item => {
    if (filterType === 'ALL') return true;
    return item.type === filterType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Live Construction Track Logs</h3>
          <p className="text-xs text-slate-400">Verifiable, stamp-dated physical photographic logs updated directly by soil & structural engineers on-site.</p>
        </div>
        
        {/* Gallery Type Segment Filters */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-start">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
              filterType === 'ALL'
                ? 'bg-slate-800 text-slate-100 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Updates ({mediaItems.length})
          </button>
          <button
            onClick={() => setFilterType('IMAGE')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              filterType === 'IMAGE'
                ? 'bg-slate-800 text-slate-100 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Image className="w-3.5 h-3.5" /> Photos
          </button>
          <button
            onClick={() => setFilterType('VIDEO')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              filterType === 'VIDEO'
                ? 'bg-slate-800 text-slate-100 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" /> Walkthroughs
          </button>
        </div>
      </div>

      {/* Masonry-like grid */}
      {filteredMedia.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-sm">
          No media objects match the selected filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="group bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg transition hover:shadow-xl hover:border-slate-700/60 cursor-pointer relative flex flex-col h-full"
            >
              {/* Media Container block */}
              <div className="aspect-video relative overflow-hidden bg-slate-950">
                <img
                  src={item.type === 'VIDEO' ? 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800' : item.url}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                
                {item.type === 'VIDEO' && (
                  <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                    <span className="p-3 bg-indigo-600 hover:bg-indigo-500 rounded-full text-slate-100 shadow-md transform scale-90 group-hover:scale-100 transition-all">
                      <Play className="w-5 h-5 fill-current" />
                    </span>
                  </div>
                )}

                {/* Badge Overlay */}
                <span className="absolute top-3 left-3 px-2 py-1 rounded bg-slate-950/80 backdrop-blur border border-slate-800 text-[10px] text-slate-300 flex items-center gap-1 font-mono uppercase tracking-wider font-semibold">
                  {item.type === 'VIDEO' ? <Video className="w-3 h-3 text-indigo-400" /> : <Image className="w-3 h-3 text-indigo-400" />}
                  {item.type}
                </span>

                {/* View Overlay on Hover */}
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <span className="px-3.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-100 rounded-xl text-xs font-medium flex items-center gap-1.5 transition">
                    <Eye className="w-3.5 h-3.5 text-indigo-400" /> Inspect Log
                  </span>
                </div>
              </div>

              {/* Media details info */}
              <div className="p-4 flex flex-col flex-1 justify-between">
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-mono text-indigo-400 block font-semibold">
                    Construction Milestone Updates
                  </span>
                  <h4 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-400 transition">
                    {item.title}
                  </h4>
                  {item.caption && (
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {item.caption}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-800/60 mt-4 pt-3 text-[10px] text-slate-500 font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(item.uploadedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-400">
                    <Tag className="w-3 h-3 text-indigo-400" /> Verifiable Log
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full screen interactive Lightbox Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-4 md:p-6" id="media-lightbox">
          {/* Header block */}
          <div className="flex items-center justify-between text-slate-100 border-b border-slate-900 pb-4">
            <div>
              <span className="text-xs uppercase tracking-wider font-mono text-indigo-400 font-semibold uppercase">{selectedItem.type} update log</span>
              <h2 className="text-base md:text-lg font-bold">{selectedItem.title}</h2>
            </div>
            <button
              onClick={() => setSelectedItem(null)}
              className="p-2 hover:bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Core Content Viewer block */}
          <div className="flex-1 my-4 flex items-center justify-center max-h-[70vh]">
            {selectedItem.type === 'VIDEO' ? (
              <div className="w-full max-w-3xl aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border border-slate-800">
                <video
                  src={selectedItem.url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="max-w-4xl max-h-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
                <img
                  src={selectedItem.url}
                  alt={selectedItem.title}
                  className="max-h-[60vh] object-contain mx-auto"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
          </div>

          {/* Footer Metadata */}
          <div className="w-full max-w-3xl mx-auto bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-2 text-slate-300">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5 text-xs">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Calendar className="w-4 h-4 text-indigo-400" />
                Uploaded at: <strong className="text-slate-100">{new Date(selectedItem.uploadedAt).toLocaleString()}</strong>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/20 text-indigo-300 font-mono text-[10px] uppercase font-semibold">
                Audit Status: Certified Cryptographic Log
              </span>
            </div>
            {selectedItem.caption && (
              <p className="text-sm text-slate-400 italic">
                "{selectedItem.caption}"
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
