import React, { useState } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  Cpu, 
  Download, 
  Upload, 
  ShieldCheck, 
  Copy, 
  Github, 
  ExternalLink, 
  Check, 
  Search, 
  Filter, 
  Sparkles,
  Terminal,
  FileCode,
  HardDrive
} from 'lucide-react';
import { RomItem } from '../../types/wevids';
import { sounds } from '../../lib/soundFx';
import { toast } from 'sonner';

export const RomVaultView: React.FC = () => {
  const { roms, addRom } = useWevids();
  
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Submit modal
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [device, setDevice] = useState('');
  const [brand, setBrand] = useState<RomItem['brand']>('Xiaomi / Redmi');
  const [romType, setRomType] = useState<RomItem['romType']>('China ROM Port');
  const [version, setVersion] = useState('');
  const [fileSize, setFileSize] = useState('4.5 GB');
  const [checksum, setChecksum] = useState('');
  const [changelog, setChangelog] = useState('');

  const brands = ['All', 'Xiaomi / Redmi', 'Pixel', 'Samsung', 'Honor', 'GSI Generic', 'Kernel / Module'];
  const types = ['All', 'China ROM Port', 'Global Official', 'Custom Kernel', 'Magisk Module', 'HyperOS Port'];

  const filteredRoms = roms.filter((r) => {
    const matchesBrand = selectedBrand === 'All' || r.brand === selectedBrand;
    const matchesType = selectedType === 'All' || r.romType === selectedType;
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.device.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.maintainer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBrand && matchesType && matchesSearch;
  });

  const handleCopyChecksum = (romId: string, cs: string) => {
    sounds.click();
    navigator.clipboard.writeText(cs);
    setCopiedId(romId);
    toast.success('MD5 / SHA256 Checksum copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (rom: RomItem) => {
    sounds.success();
    toast.success(`Starting download for ${rom.title}`);
  };

  const handleCreateRom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !device || !version) {
      toast.error('Please fill required ROM fields');
      return;
    }

    addRom({
      title,
      device,
      brand,
      romType,
      status: 'Official',
      maintainer: 'Alex Vance (@alex_vance)',
      maintainerHandle: '@alex_vance',
      version,
      androidVersion: 'Android 15 (Vanilla Ice Cream)',
      fileSize: fileSize || '5.2 GB',
      checksum: checksum || '98fc7b2a9e14d80a45f90bc12984ef2a',
      downloadUrl: 'https://github.com/wevids/rom-vault/releases',
      githubUrl: 'https://github.com/wevids/rom-vault',
      changelog: changelog ? changelog.split('\n') : ['Initial public release build', 'Security updates backported']
    });

    setIsSubmitOpen(false);
    setTitle('');
    setDevice('');
    setVersion('');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Hero Vault Banner */}
      <div className="p-6 rounded-3xl liquid-glass border border-white/10 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e5ff]/20 border border-[#00e5ff]/30 text-[#00e5ff] font-bold text-xs mb-2">
            <Cpu className="w-3.5 h-3.5" />
            <span>DEVELOPER KERNEL & ROM VAULT</span>
          </div>
          <h1 className="text-3xl font-bold font-orbitron neon-gradient-text tracking-wide">
            HyperOS, GSI & Kernel Hub
          </h1>
          <p className="text-xs text-[#8a8aa8] mt-1 max-w-xl">
            Verified ROM packages, overclocked gaming kernels, TWRP recovery scripts, and Magisk modules with full MD5 integrity verification.
          </p>
        </div>

        <button
          onClick={() => {
            sounds.pop();
            setIsSubmitOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs hover:scale-105 transition-transform shadow-lg"
        >
          <Upload className="w-4 h-4" />
          <span>SUBMIT ROM BUILD</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="liquid-glass-card rounded-2xl p-4 border border-white/10 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8aa8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Xiaomi 14, GSI, Kernel..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-[#8a8aa8] focus:outline-none focus:border-[#00e5ff]"
            />
          </div>

          {/* Brand Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none">
            {brands.map((b) => (
              <button
                key={b}
                onClick={() => {
                  sounds.click();
                  setSelectedBrand(b);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedBrand === b
                    ? 'bg-[#00e5ff] text-slate-900 font-bold'
                    : 'bg-white/5 text-[#8a8aa8] hover:text-white border border-white/5'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ROM Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoms.map((rom) => (
          <div
            key={rom.id}
            className="liquid-glass-card rounded-3xl p-5 border border-white/10 flex flex-col justify-between space-y-4 hover:border-[#ff2d95]/40 transition-all shadow-xl"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-full bg-[#00e5ff]/15 text-[#00e5ff] border border-[#00e5ff]/30 text-[10px] font-orbitron font-bold">
                  {rom.brand}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#ff2d95]/15 text-[#ff2d95] border border-[#ff2d95]/30 text-[10px] font-bold">
                  {rom.romType}
                </span>
              </div>

              <h3 className="text-base font-bold text-white tracking-wide leading-snug mb-1">
                {rom.title}
              </h3>
              <p className="text-xs text-[#8a8aa8] mb-3">{rom.device}</p>

              {/* Specs Meta */}
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[#8a8aa8]">
                  <span>Maintainer:</span>
                  <span className="text-white font-semibold">{rom.maintainer}</span>
                </div>
                <div className="flex items-center justify-between text-[#8a8aa8]">
                  <span>Version:</span>
                  <span className="text-[#00e5ff] font-orbitron font-semibold">{rom.version}</span>
                </div>
                <div className="flex items-center justify-between text-[#8a8aa8]">
                  <span>File Size:</span>
                  <span className="text-white font-semibold">{rom.fileSize}</span>
                </div>
                <div className="flex items-center justify-between text-[#8a8aa8]">
                  <span>Downloads:</span>
                  <span className="text-[#10b981] font-bold">{rom.downloadCount.toLocaleString()}</span>
                </div>
              </div>

              {/* Changelog snippets */}
              <div className="mt-3">
                <div className="text-[11px] font-bold text-[#8a8aa8] uppercase mb-1">Changelog</div>
                <ul className="text-xs text-[#e8e8f4]/80 space-y-1 list-disc list-inside">
                  {rom.changelog.slice(0, 2).map((log, i) => (
                    <li key={i} className="truncate">{log}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Checksum & Download Action */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/10 text-[11px]">
                <span className="text-[#8a8aa8] truncate max-w-[170px] font-mono">
                  SHA256: {rom.checksum.slice(0, 16)}...
                </span>
                <button
                  onClick={() => handleCopyChecksum(rom.id, rom.checksum)}
                  className="p-1 text-[#00e5ff] hover:text-white transition-colors"
                  title="Copy Full Checksum"
                >
                  {copiedId === rom.id ? <Check className="w-3.5 h-3.5 text-[#10b981]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex gap-2">
                <a
                  href={rom.downloadUrl}
                  onClick={() => handleDownload(rom)}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs flex items-center justify-center gap-1.5 shadow-md hover:scale-102 transition-transform"
                >
                  <Download className="w-3.5 h-3.5" />
                  DOWNLOAD ZIP
                </a>
                {rom.githubUrl && (
                  <a
                    href={rom.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
                    title="Source GitHub"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Submit ROM Modal */}
      {isSubmitOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass rounded-3xl p-6 border border-white/20 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-orbitron font-bold text-base text-white">Submit New ROM / Kernel</h3>
              <button onClick={() => setIsSubmitOpen(false)} className="text-xs text-[#8a8aa8] hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateRom} className="space-y-3 text-xs">
              <div>
                <label className="text-[#8a8aa8] font-bold block mb-1">Package Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. HyperOS 2.0 Ultra Fastboot Port"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[#8a8aa8] font-bold block mb-1">Device Codename</label>
                  <input
                    type="text"
                    value={device}
                    onChange={(e) => setDevice(e.target.value)}
                    placeholder="e.g. Xiaomi 14 (houji)"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-[#8a8aa8] font-bold block mb-1">Version String</label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="e.g. v2.0.24.1"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[#8a8aa8] font-bold block mb-1">Brand Category</label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                >
                  <option value="Xiaomi / Redmi" className="bg-[#0a0a1a]">Xiaomi / Redmi</option>
                  <option value="Pixel" className="bg-[#0a0a1a]">Pixel</option>
                  <option value="Samsung" className="bg-[#0a0a1a]">Samsung</option>
                  <option value="GSI Generic" className="bg-[#0a0a1a]">GSI Generic</option>
                  <option value="Kernel / Module" className="bg-[#0a0a1a]">Kernel / Module</option>
                </select>
              </div>

              <div>
                <label className="text-[#8a8aa8] font-bold block mb-1">SHA256 Checksum</label>
                <input
                  type="text"
                  value={checksum}
                  onChange={(e) => setChecksum(e.target.value)}
                  placeholder="Checksum hash for file verification"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[#8a8aa8] font-bold block mb-1">Changelog (1 item per line)</label>
                <textarea
                  value={changelog}
                  onChange={(e) => setChangelog(e.target.value)}
                  rows={3}
                  placeholder="De-bloated system apps&#10;Unlocked 120 FPS in games"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-[#8a8aa8] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold shadow-md"
                >
                  Publish to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};