import React, { useState } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  FolderDown, 
  Upload, 
  HardDrive, 
  FileCheck2, 
  Copy, 
  Download, 
  Search, 
  Check, 
  FileCode2,
  Sparkles,
  Share2
} from 'lucide-react';
import { sounds } from '../../lib/soundFx';
import { toast } from 'sonner';

export const FileDropVaultView: React.FC = () => {
  const { files, addSharedFile, currentUser } = useWevids();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  // Upload state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<any>('ROM / Kernel');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('24.5 MB');
  const [checksum, setChecksum] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = ['All', 'ROM / Kernel', 'APK / Mod', 'LUTs / Preset', '3D Model / Shader', 'Document'];

  const filteredFiles = files.filter(f => {
    const matchesCat = selectedCategory === 'All' || f.category === selectedCategory;
    const matchesSearch = f.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          f.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCopyChecksum = (id: string, cs: string) => {
    sounds.click();
    navigator.clipboard.writeText(cs);
    setCopiedId(id);
    toast.success('SHA256 Checksum copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !fileName) {
      toast.error('Please enter title and file name');
      return;
    }

    addSharedFile({
      title,
      fileName,
      fileSize: fileSize || '15.8 MB',
      category,
      uploaderId: currentUser.id,
      uploaderName: currentUser.name,
      downloadUrl: '#',
      checksum: checksum || '3ef982c091a18274d'
    });

    setIsUploadOpen(false);
    setTitle('');
    setFileName('');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Banner */}
      <div className="p-6 rounded-3xl liquid-glass border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e5ff]/20 border border-[#00e5ff]/30 text-[#00e5ff] font-bold text-xs mb-2">
            <FolderDown className="w-3.5 h-3.5" />
            <span>GLOBAL SOCIAL FILE DROP VAULT</span>
          </div>
          <h1 className="text-3xl font-bold font-orbitron neon-gradient-text tracking-wide">
            Decentralized File Sharing
          </h1>
          <p className="text-xs text-[#8a8aa8]">
            Share recovery ZIPs, video LUT presets, 3D blender assets, and APK tools with integrity hashes.
          </p>
        </div>

        <button
          onClick={() => {
            sounds.pop();
            setIsUploadOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs shadow-lg hover:scale-105 transition-transform"
        >
          <Upload className="w-4 h-4" />
          <span>UPLOAD FILE PACKAGE</span>
        </button>
      </div>

      {/* Filters */}
      <div className="liquid-glass-card rounded-2xl p-4 border border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8aa8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files by name or creator..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-[#8a8aa8] focus:outline-none focus:border-[#00e5ff]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => {
                sounds.click();
                setSelectedCategory(c);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === c
                  ? 'bg-[#00e5ff] text-slate-900 font-bold'
                  : 'bg-white/5 text-[#8a8aa8] hover:text-white border border-white/5'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFiles.map(file => (
          <div
            key={file.id}
            className="liquid-glass-card rounded-3xl p-5 border border-white/10 flex flex-col justify-between space-y-4 hover:border-[#00e5ff]/50 transition-all shadow-xl"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-full bg-[#00e5ff]/15 text-[#00e5ff] border border-[#00e5ff]/30 text-[10px] font-orbitron font-bold">
                  {file.category}
                </span>
                <span className="text-[10px] text-[#8a8aa8]">{file.uploadedAt}</span>
              </div>

              <h3 className="text-base font-bold text-white tracking-wide leading-snug mb-1">
                {file.title}
              </h3>
              <div className="text-xs text-[#8a8aa8] font-mono truncate">{file.fileName}</div>

              <div className="mt-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[#8a8aa8]">
                  <span>Uploaded by:</span>
                  <span className="text-white font-semibold">{file.uploaderName}</span>
                </div>
                <div className="flex items-center justify-between text-[#8a8aa8]">
                  <span>Package Size:</span>
                  <span className="text-[#00e5ff] font-orbitron font-semibold">{file.fileSize}</span>
                </div>
                <div className="flex items-center justify-between text-[#8a8aa8]">
                  <span>Downloads:</span>
                  <span className="text-[#10b981] font-bold">{file.downloads.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/10 text-[11px]">
                <span className="text-[#8a8aa8] truncate max-w-[170px] font-mono">
                  SHA256: {file.checksum}
                </span>
                <button
                  onClick={() => handleCopyChecksum(file.id, file.checksum)}
                  className="p-1 text-[#00e5ff] hover:text-white"
                  title="Copy Hash"
                >
                  {copiedId === file.id ? <Check className="w-3.5 h-3.5 text-[#10b981]" /> : <Copy className="w-3.5 h-3.5 text-[#00e5ff]" />}
                </button>
              </div>

              <a
                href={file.downloadUrl}
                onClick={(e) => {
                  e.preventDefault();
                  sounds.success();
                  toast.success(`Downloading "${file.fileName}"...`);
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs flex items-center justify-center gap-1.5 shadow-md hover:scale-102 transition-transform"
              >
                <Download className="w-3.5 h-3.5" />
                DOWNLOAD FILE
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass rounded-3xl p-6 border border-white/20 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-orbitron font-bold text-base text-white">Upload to File Vault</h3>
              <button onClick={() => setIsUploadOpen(false)} className="text-xs text-[#8a8aa8] hover:text-white">✕</button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[#8a8aa8] font-bold block mb-1">Package Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Snapdragon 8 Gen 3 Thermal Gov"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[#8a8aa8] font-bold block mb-1">File Name</label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g. thermal_gen3.zip"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-[#8a8aa8] font-bold block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                >
                  <option value="ROM / Kernel" className="bg-[#0a0a1a]">ROM / Kernel</option>
                  <option value="APK / Mod" className="bg-[#0a0a1a]">APK / Mod</option>
                  <option value="LUTs / Preset" className="bg-[#0a0a1a]">LUTs / Preset</option>
                  <option value="3D Model / Shader" className="bg-[#0a0a1a]">3D Model / Shader</option>
                  <option value="Document" className="bg-[#0a0a1a]">Document</option>
                </select>
              </div>

              <div>
                <label className="text-[#8a8aa8] font-bold block mb-1">SHA256 Checksum</label>
                <input
                  type="text"
                  value={checksum}
                  onChange={(e) => setChecksum(e.target.value)}
                  placeholder="Hash for tamper-proof download"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-[#8a8aa8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold shadow-md"
                >
                  Publish Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};