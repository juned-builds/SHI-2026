import React, { useState } from "react";
import { Film, Filter, Layers, ListFilter } from "lucide-react";
import { VideoPackageData } from "../../../types";
import { VideoSceneCard } from "./VideoSceneCard";
import { VideoHook } from "./VideoHook";

interface VideoStoryboardProps {
  data: VideoPackageData;
}

export function VideoStoryboard({ data }: VideoStoryboardProps) {
  const [filterScene, setFilterScene] = useState<number | "all">("all");
  const scenes = data.scenes || [];

  const displayedScenes =
    filterScene === "all" ? scenes : scenes.filter((s) => s.sceneNumber === filterScene);

  return (
    <div className="space-y-4">
      {/* Optional Opening Hook Banner */}
      {data.hook && <VideoHook hook={data.hook} />}

      {/* Filter / Quick Jump Selector */}
      {scenes.length > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <ListFilter className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-slate-700">Scene Sequence:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterScene("all")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                filterScene === "all"
                  ? "bg-purple-600 text-white shadow-2xs font-semibold"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              All Scenes ({scenes.length})
            </button>

            {scenes.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setFilterScene(s.sceneNumber)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  filterScene === s.sceneNumber
                    ? "bg-purple-600 text-white shadow-2xs font-semibold"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                Scene {s.sceneNumber}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Storyboard List of Cards */}
      <div className="space-y-3.5">
        {displayedScenes.map((scene, idx) => (
          <VideoSceneCard
            key={scene.sceneNumber || idx}
            scene={scene}
            index={idx}
            totalScenes={scenes.length}
          />
        ))}
      </div>
    </div>
  );
}
