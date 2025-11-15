// src/app/page.js

"use client";

import { useFileStats } from "@/hooks/useFileStats";
import { useFileUpload } from "@/hooks/useFileUpload";
import { UploadDropzone } from "@/components/app/UploadDropzone";
import { StatsDisplay } from "@/components/app/StatsDisplay";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { stats } = useFileStats();

  const {
    onDrop,
    isUploading,
    getRootProps,
    getInputProps,
    isDragActive,
    lastUploadedFile,
  } = useFileUpload({});

  const HEADER_COLOR = "bg-orange-600 text-white";

  return (
    // Home Page Theme: white background, black text
    <div className="min-h-screen flex flex-col w-full bg-white text-black">
      {/* Navbar/Header (Full Width) */}
      <header
        className={`p-4 flex justify-between items-center shrink-0 ${HEADER_COLOR}`}
      >
        <a href="/" className="text-xl font-bold">
          Home Brand
        </a>
        <StatsDisplay stats={stats} isHome={true} />
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 grid place-items-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl w-full">
          {/* Text Content Area */}
          <div className="flex flex-col justify-center space-y-6">
            <h1 className="text-6xl font-extrabold text-black">
              Knowledge Base Searcher
            </h1>
            <p className="text-xl text-gray-600">
              store all your files in an organized way with smart searches
            </p>
            <Button
              asChild
              className="w-fit text-lg px-8 py-3 bg-orange-500 hover:bg-orange-700 transition-colors shadow-lg"
            >
              <a href="/files">Get Started</a>
            </Button>
          </div>

          {/* Upload Dropzone Area (Two-column component) */}
          <div className="relative flex items-center justify-center">
            <UploadDropzone
              getRootProps={getRootProps}
              getInputProps={getInputProps}
              isDragActive={isDragActive}
              isUploading={isUploading}
              lastUploadedFile={lastUploadedFile}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
