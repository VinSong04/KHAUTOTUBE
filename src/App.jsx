import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, Volume2, Wand2, Music, Headphones, Sparkles,
  Download, Share2, FileText, Captions, Youtube, Video,
  ImageIcon, Tags, ChevronDown, KeyRound, Radio, SlidersHorizontal,
  Mic2, Activity
} from 'lucide-react';

// --- MOCK DATA ---
const TRENDING_TRACKS = [
  { id: 1, title: "ទឹកភ្នែកអ្នកអត់សង្សារ", prompt: "Sad acoustic guitar with emotional male vocals about being single", genre: "Sad Acoustic", duration: "4:12", views: "1.2M", color: "from-blue-500 to-cyan-400" },
  { id: 2, title: "រាំវង់អ័រកាដង់", prompt: "Upbeat Khmer Romvong for New Year party with heavy bass", genre: "Romvong", duration: "3:45", views: "850K", color: "from-pink-500 to-rose-400" },
  { id: 3, title: "ក្មេងស្ទាវភូមិខ្ញុំ", prompt: "Modern Kantrum mixed with trap beats and fast rap", genre: "Kantrum Hip Hop", duration: "3:10", views: "2.1M", color: "from-violet-500 to-purple-400" },
  { id: 4, title: "សង្សារលួចលាក់", prompt: "Dramatic Khmer pop ballad about secret love", genre: "Khmer Pop", duration: "4:30", views: "500K", color: "from-amber-500 to-orange-400" },
];

const GENRES = ["Khmer Pop", "Romvong", "Kantrum", "Saravan", "Pleng Kar", "Sad Acoustic", "Hip Hop", "EDM", "Cinematic"];
const MOODS = ["Sad / Emotional", "Party / Dance", "Chill / Cafe", "Romantic", "Epic / Cinematic", "Aggressive"];

export default function App() {
  // --- STATE ---
  const [prompt, setPrompt] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
  const [genre, setGenre] = useState('Khmer Pop');
  const [mood, setMood] = useState('Sad / Emotional');
  const [vocals, setVocals] = useState('Male');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Player & Export State
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [waveformBars, setWaveformBars] = useState([]);

  // Export Loaders
  const [isExportingSRT, setIsExportingSRT] = useState(false);
  const [isExportingVideo, setIsExportingVideo] = useState(false);

  const playbackInterval = useRef(null);
  const audioRef = useRef(null);

  // --- EFFECTS ---

  useEffect(() => {
    generateWaveform();
    // If a real audio URL is returned, we could mount it here.
    if (currentSong?.audioUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio(currentSong.audioUrl);
      } else {
        audioRef.current.src = currentSong.audioUrl;
      }
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setPlaybackProgress(0);
      };
      audioRef.current.ontimeupdate = () => {
        const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
        setPlaybackProgress(progress || 0);
      };
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
      }
    };
  }, [currentSong]);

  useEffect(() => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.error("Playback failed", e));
      } else {
        // Mock progression if no real audio
        playbackInterval.current = setInterval(() => {
          setPlaybackProgress(prev => {
            if (prev >= 100) {
              setIsPlaying(false);
              return 0;
            }
            return prev + 0.5;
          });
        }, 100);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      clearInterval(playbackInterval.current);
    }
    return () => clearInterval(playbackInterval.current);
  }, [isPlaying]);

  // --- HANDLERS ---
  const generateWaveform = () => {
    const bars = Array.from({ length: 48 }, () => Math.floor(Math.random() * 70) + 30);
    setWaveformBars(bars);
  };

  const handleGenerateLyrics = async (e) => {
    if (e) e.preventDefault();
    if (!prompt) return;

    setIsGeneratingLyrics(true);

    try {
      const aiQuery = `Write 4 stanzas of song lyrics in Khmer script and some english for a song about: ${prompt}. Provide lyrics only. Make it emotional and fit a ${genre} genre.`;
      const response = await fetch("https://text.pollinations.ai/", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are a professional music lyricist. Output ONLY the raw lyrics. No conversational text, no markdown, no warnings.' },
            { role: 'user', content: aiQuery }
          ]
        })
      });
      if (!response.ok) throw new Error('API Error');
      let data = await response.text();
      setLyrics(data.trim());
    } catch (error) {
      console.error(error);
      setLyrics(`[លោកអ្នកមានបញ្ហាអ៊ីនធឺណិត...]\n(Error generating lyrics)`);
    } finally {
      setIsGeneratingLyrics(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt) return;

    // Reset player state
    setCurrentSong(null);
    setIsPlaying(false);
    setPlaybackProgress(0);
    setGenerationProgress(0);

    let currentLyrics = lyrics;

    // Step 1: Start Lyrics Generation (if lyrics box is empty)
    if (lyrics.trim() === '') {
      setIsGeneratingLyrics(true);
      try {
        const aiQuery = `Write 4 stanzas of song lyrics in Khmer script and some english for a song about: ${prompt}. Provide lyrics only. Make it emotional and fit a ${genre} genre.`;
        const response = await fetch("https://text.pollinations.ai/", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: 'You are a professional music lyricist. Output ONLY the raw lyrics. No conversational text, no markdown, no warnings.' },
              { role: 'user', content: aiQuery }
            ]
          })
        });
        if (!response.ok) throw new Error('API Error');
        let data = await response.text();

        currentLyrics = data.trim();
        setLyrics(currentLyrics);
      } catch (err) {
        currentLyrics = "[Error generating lyrics]";
        setLyrics(currentLyrics);
      }
      setIsGeneratingLyrics(false);
    }

    // Step 2: Start Music Generation
    setIsGenerating(true);
    setGenerationProgress(5);

    try {
      const apiKey = import.meta.env.VITE_KIE_API_KEY;
      if (!apiKey) {
        console.warn("VITE_KIE_API_KEY is not set. Falling back to simulated generation.");
        throw new Error("No API Key");
      }

      const apiUrl = import.meta.env.VITE_KIE_API_URL || "https://api.kie.ai/api/v1/generate";
      const songTags = `${genre}, ${mood}, ${vocals}`;

      const payload = {
        customMode: true,
        instrumental: false,
        model: "V4_5",
        callBackUrl: "https://khmertube.ai/mock/callback", // Dummy callback as it is required
        prompt: (currentLyrics && currentLyrics.length > 5) ? currentLyrics.substring(0, 4999) : prompt.substring(0, 4999),
        style: songTags.substring(0, 999),
        title: (prompt.substring(0, 75) || "Generated Track")
      };

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.msg || "API Request Failed");
      }

      const data = await res.json();
      const taskId = data.data?.taskId;

      if (!taskId) throw new Error("No task ID returned");

      let status = "PENDING";
      let audioUrl = null;
      let finalTitle = prompt.substring(0, 30) || "ចិត្តនៅសច្ចា (Chit Nov Sacha)";
      let attempts = 0;

      // Poll until SUCCESS or FAILED (max 100 attempts, 5 mins)
      while (status !== "SUCCESS" && status !== "FAILED" && attempts < 100) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        attempts++;
        setGenerationProgress(Math.min(95, 5 + attempts));

        const pollRes = await fetch(`https://api.kie.ai/api/v1/generate/record-info?taskId=${taskId}`, {
          headers: { "Authorization": `Bearer ${apiKey}` }
        });

        if (pollRes.ok) {
          const pollData = await pollRes.json();
          if (pollData && pollData.data) {
            status = pollData.data.status;
            if (status === "SUCCESS") {
              let results = pollData.data.data;
              if (results && Array.isArray(results) && results.length > 0) {
                audioUrl = results[0].audio_url || results[0].stream_audio_url || results[0].image_url;
                if (results[0].title) finalTitle = results[0].title;
              } else if (results && results.audio_url) {
                audioUrl = results.audio_url || results.stream_audio_url;
              }
            }
          }
        }
      }

      setGenerationProgress(100);
      setIsGenerating(false);

      if (status !== "SUCCESS") {
        throw new Error("Generation polling timeout or failed");
      }

      const generatedTitle = mood.includes("Sad")
        ? "បទសេដល្បីក្នុង TikTok - " + prompt.substring(0, 15) + "... (Official Audio)"
        : "បទថ្មីកំពុងល្បី - " + prompt.substring(0, 15) + "... (Official Lyric Video)";

      setCurrentSong({
        title: finalTitle,
        youtubeTitle: generatedTitle,
        tags: `#KhmerSong #${genre.replace(/\s+/g, '')} #បទសេដ #KhmerMusic2026`,
        prompt: prompt,
        genre: genre,
        mood: mood,
        duration: "4:15",
        lyrics: currentLyrics,
        coverColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
        audioUrl: audioUrl
      });
      setIsPlaying(true);

    } catch (err) {
      console.log(err);
      // Fallback to simulated generation
      const interval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsGenerating(false);

            const generatedTitle = mood.includes("Sad")
              ? "បទសេដល្បីក្នុង TikTok - " + prompt.substring(0, 15) + "... (Official Audio)"
              : "បទថ្មីកំពុងល្បី - " + prompt.substring(0, 15) + "... (Official Lyric Video)";

            setCurrentSong({
              title: prompt.substring(0, 30) || "ចិត្តនៅសច្ចា (Chit Nov Sacha)",
              youtubeTitle: generatedTitle,
              tags: `#KhmerSong #${genre.replace(/\s+/g, '')} #បទសេដ #KhmerMusic2026`,
              prompt: prompt,
              genre: genre,
              mood: mood,
              duration: "4:15",
              lyrics: currentLyrics,
              coverColor: `hsl(${Math.random() * 360}, 70%, 50%)`
            });
            setIsPlaying(true);
            return 100;
          }
          return prev + Math.floor(Math.random() * 15) + 5;
        });
      }, 400);
    }
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  const formatTime = (progressPercent) => {
    let totalSeconds = 255;
    if (audioRef.current && !isNaN(audioRef.current.duration)) {
      totalSeconds = audioRef.current.duration;
    } else if (currentSong && currentSong.duration) {
      const parts = currentSong.duration.split(':').map(Number);
      if (parts.length === 2) {
        totalSeconds = (parts[0] * 60) + parts[1];
      }
    }
    const currentSeconds = Math.floor((progressPercent / 100) * totalSeconds);
    const mins = Math.floor(currentSeconds / 60);
    const secs = Math.floor(currentSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExportWAV = async () => {
    if (!currentSong) return;

    if (currentSong.audioUrl) {
      try {
        const response = await fetch(currentSong.audioUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `KhmerTube_${currentSong.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (e) {
        alert('Failed to download real audio file.');
      }
    } else {
      const dummyBlob = new Blob(["RIFF dummy wav data"], { type: 'audio/wav' });
      const url = URL.createObjectURL(dummyBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Khmer_Generated_${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleExportVideo = () => {
    setIsExportingVideo(true);
    setTimeout(() => {
      const dummyBlob = new Blob(["mock mp4 video data"], { type: 'video/mp4' });
      const url = URL.createObjectURL(dummyBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `KhmerTube_Video_${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsExportingVideo(false);
    }, 2500);
  };

  const handleExportSRT = () => {
    if (!currentSong || !currentSong.lyrics) return;
    setIsExportingSRT(true);

    setTimeout(() => {
      const lines = currentSong.lyrics.split('\n').filter(line => line.trim() !== '' && !line.startsWith('['));
      let srtContent = '';
      let startTime = 0;

      lines.forEach((line, index) => {
        const startMins = Math.floor(startTime / 60).toString().padStart(2, '0');
        const startSecs = (startTime % 60).toString().padStart(2, '0');
        const endTime = startTime + 3;
        const endMins = Math.floor(endTime / 60).toString().padStart(2, '0');
        const endSecs = (endTime % 60).toString().padStart(2, '0');

        srtContent += `${index + 1}\n00:${startMins}:${startSecs},000 --> 00:${endMins}:${endSecs},000\n${line}\n\n`;
        startTime += 4;
      });

      const blob = new Blob([srtContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Khmer_Song_Captions.srt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsExportingSRT(false);
    }, 1500);
  };

  // --- PREMIUM UI COMPONENTS ---
  const GlowingBackground = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-neonRed/20 rounded-full blur-[120px] mix-blend-screen"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] mix-blend-screen"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-neonOrange/10 rounded-full blur-[150px] mix-blend-screen"
      />
      <div className="absolute inset-0 bg-darkBg/90 backdrop-blur-[80px]"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-darkBg text-gray-100 font-sans selection:bg-neonRed/30 overflow-x-hidden relative">
      <GlowingBackground />

      {/* Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="border-b border-glassBorder bg-glassBg backdrop-blur-2xl sticky top-0 z-50 transition-all shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
      >
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-neonRed to-neonOrange flex items-center justify-center shadow-[0_0_20px_rgba(255,42,77,0.3)] group-hover:shadow-[0_0_30px_rgba(255,42,77,0.6)] transition-all">
              <Youtube className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              KhmerTube<span className="text-neonRed">.ai</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-400">
            <a href="#" className="text-white hover:text-neonRed transition-colors">Workspace</a>
            <a href="#" className="hover:text-white transition-colors">Catalog</a>
            <a href="#" className="hover:text-white transition-colors">Monetize</a>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-800 to-gray-700 border border-white/10 ring-2 ring-white/5"></div>
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-10 relative z-10 grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* LEFT COLUMN: STUDIO (8 cols) */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="xl:col-span-8 space-y-8"
        >

          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-black tracking-tight flex flex-col md:flex-row md:items-center gap-4">
              AI Music Studio
              <motion.span
                animate={{ boxShadow: ['0 0 10px rgba(255,42,77,0.2)', '0 0 30px rgba(255,42,77,0.6)', '0 0 10px rgba(255,42,77,0.2)'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-fit px-3 py-1 text-xs font-bold uppercase tracking-widest bg-neonRed/10 text-neonRed rounded-full border border-neonRed/20"
              >
                Powered by Fuzz-2.0
              </motion.span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">
              Craft viral Khmer hits instantly. Leverage deep Gemini lyrics and Producer AI engine to instantly synthesize ready-to-publish YouTube tracks.
            </p>
          </div>

          <div className="bg-glassBg border border-glassBorder rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden group/form">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover/form:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            <form onSubmit={handleGenerate} className="space-y-8 relative z-10">



              {/* Prompt Input */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  What are we creating today?
                </label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-neonRed to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                  <textarea
                    className="relative w-full bg-[#111116] border border-glassBorder rounded-2xl p-5 text-white text-lg placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-neonRed/50 transition-all resize-none shadow-inner"
                    rows="2"
                    placeholder="e.g. A romantic Khmer acoustic song about a girl waiting under the rain in Phnom Penh..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isGenerating || isGeneratingLyrics}
                  ></textarea>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Advanced Controls */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-white flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                      Sonic Print
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <select className="w-full bg-[#15151a] border border-white/10 hover:border-white/20 rounded-xl p-3.5 text-sm text-white focus:outline-none appearance-none cursor-pointer transition-colors font-medium shadow-sm"
                          value={genre} onChange={(e) => setGenre(e.target.value)} disabled={isGenerating || isGeneratingLyrics}>
                          {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
                      </div>
                      <div className="relative">
                        <select className="w-full bg-[#15151a] border border-white/10 hover:border-white/20 rounded-xl p-3.5 text-sm text-white focus:outline-none appearance-none cursor-pointer transition-colors font-medium shadow-sm"
                          value={mood} onChange={(e) => setMood(e.target.value)} disabled={isGenerating || isGeneratingLyrics}>
                          {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-white flex items-center gap-2">
                      <Mic2 className="w-4 h-4 text-green-400" />
                      Vocal Assignment
                    </label>
                    <div className="relative">
                      <select className="w-full bg-[#15151a] border border-white/10 hover:border-white/20 rounded-xl p-3.5 text-sm text-white focus:outline-none appearance-none cursor-pointer transition-colors font-medium shadow-sm"
                        value={vocals} onChange={(e) => setVocals(e.target.value)} disabled={isGenerating || isGeneratingLyrics}>
                        <option value="Male">Male Vocals</option>
                        <option value="Female">Female Vocals</option>
                        <option value="Duet">Duet (Male & Female)</option>
                        <option value="None">Instrumental (Karaoke)</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-4 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Lyrics Input */}
                <div className="space-y-3 flex flex-col h-full">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-400" />
                      Lyrics Sheet
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateLyrics}
                      disabled={isGeneratingLyrics || isGenerating}
                      className="text-xs flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-1.5 px-3 rounded-full transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 font-medium font-sans"
                    >
                      {isGeneratingLyrics ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Thinking...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3 h-3" />
                          AI Auto-Write
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    className="flex-1 w-full bg-[#15151a] border border-white/10 rounded-2xl p-4 text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all resize-none font-sans leading-relaxed text-sm shadow-inner min-h-[160px]"
                    placeholder="Provide lyrics or let our AI generate emotionally accurate Khmer lyrics for you based on the vibe above..."
                    value={lyrics}
                    onChange={(e) => setLyrics(e.target.value)}
                    disabled={isGenerating || isGeneratingLyrics}
                  ></textarea>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <motion.button
                  whileHover={{ scale: (isGenerating || isGeneratingLyrics || !prompt) ? 1 : 1.02 }}
                  whileTap={{ scale: (isGenerating || isGeneratingLyrics || !prompt) ? 1 : 0.98 }}
                  type="submit"
                  disabled={isGenerating || isGeneratingLyrics || !prompt}
                  className={`relative w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all duration-300 overflow-hidden group
                    ${(isGenerating || isGeneratingLyrics)
                      ? 'bg-glassBg text-gray-400 border border-glassBorder cursor-not-allowed'
                      : !prompt
                        ? 'bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed'
                        : 'bg-neonRed text-white shadow-[0_0_40px_rgba(255,42,77,0.4)] hover:shadow-[0_0_60px_rgba(255,42,77,0.6)]'
                    }
                  `}
                >
                  {/* Subtle shine effect */}
                  {(!isGenerating && !isGeneratingLyrics && prompt) && (
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
                  )}

                  {isGeneratingLyrics ? (
                    <>
                      <div className="w-5 h-5 border-[3px] border-white/20 border-t-white rounded-full animate-spin"></div>
                      Writing Khmer Lyrics with AI...
                    </>
                  ) : isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-[3px] border-white/20 border-t-white rounded-full animate-spin"></div>
                      Rendering Custom Track... {Math.floor(generationProgress)}%
                    </>
                  ) : (
                    <>
                      <Activity className="w-6 h-6 animate-pulse" />
                      Synthesize Track
                    </>
                  )}
                </motion.button>

                {isGenerating && (
                  <div className="w-full h-2 bg-darkBg rounded-full mt-4 overflow-hidden border border-glassBorder shadow-inner">
                    <motion.div
                      className="h-full bg-gradient-to-r from-neonRed to-neonOrange relative"
                      initial={{ width: 0 }}
                      animate={{ width: `${generationProgress}%` }}
                      transition={{ ease: "linear" }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </motion.div>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* ACTIVE PLAYER & YOUTUBE EXPORT KIT SECTION */}
          {currentSong && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">

              {/* Premium Player Card */}
              <div className="bg-[#0f0f13]/80 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>

                <div className="flex flex-col md:flex-row gap-8 items-center md:items-stretch relative z-10">
                  <div
                    className="w-40 h-40 rounded-2xl shadow-2xl shadow-black/50 flex items-center justify-center flex-shrink-0 relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500"
                    style={{ background: `linear-gradient(135deg, ${currentSong.coverColor}, #1a0b12)` }}
                  >
                    <div className="absolute inset-0 bg-black/20"></div>
                    <Headphones className="w-12 h-12 text-white/50 drop-shadow-2xl z-10" />

                    {/* Fake animated rings */}
                    {isPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-24 h-24 border border-white/20 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between w-full">
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h2 className="text-2xl font-black text-white leading-tight">{currentSong.title}</h2>
                        <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors shrink-0">
                          <Share2 className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-6">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-300 bg-white/10 px-3 py-1 rounded-full">{currentSong.genre}</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-300 bg-white/10 px-3 py-1 rounded-full">{vocals}</span>
                      </div>
                    </div>

                    <div>
                      {/* Premium Waveform */}
                      <div className="h-12 flex items-end justify-between gap-1 mb-3 relative group/wave cursor-pointer">
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-neonRed/20 to-neonOrange/20 z-0 pointer-events-none rounded-sm transition-all duration-100 ease-linear"
                          style={{ width: `${playbackProgress}%` }}
                        ></div>
                        {waveformBars.map((height, i) => (
                          <div
                            key={i}
                            className={`w-full rounded-full z-10 transition-all duration-150 ${(i / waveformBars.length) * 100 <= playbackProgress ? 'bg-gradient-to-t from-neonRed to-neonOrange' : 'bg-white/10'
                              }`}
                            style={{
                              height: `${height}%`,
                              opacity: isPlaying && (i / waveformBars.length) * 100 > playbackProgress ? 0.3 + (Math.random() * 0.4) : 1
                            }}
                          ></div>
                        ))}
                      </div>

                      <div className="flex justify-between text-xs font-mono font-medium text-gray-500 mb-4">
                        <span className="text-white">{formatTime(playbackProgress)}</span>
                        <span>{formatTime(100)}</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <button
                          onClick={togglePlay}
                          className="w-14 h-14 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all"
                        >
                          {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                        </button>

                        <div className="flex-1"></div>

                        <button onClick={handleExportWAV} className="text-sm font-bold flex items-center gap-2 bg-neonRed/10 hover:bg-neonRed/20 text-neonRed border border-neonRed/20 py-2.5 px-5 rounded-xl transition-all">
                          <Download className="w-4 h-4" /> Download Audio Track
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* YouTube Publishing Kit */}
              <div className="bg-[#0f0f13]/60 border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-neonRed/10 flex items-center justify-center border border-neonRed/20">
                    <Youtube className="w-5 h-5 text-neonRed" />
                  </div>
                  <h3 className="text-xl font-bold text-white">YouTube Distribution Kit</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* SEO & Metadata */}
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Auto-Generated Title</label>
                      <div className="bg-black/40 border border-white/10 p-4 rounded-xl text-sm font-medium text-white flex justify-between items-center group/copy hover:border-white/20 transition-colors cursor-text">
                        <span className="truncate pr-4">{currentSong.youtubeTitle}</span>
                        <button className="text-gray-500 hover:text-white opacity-0 group-hover/copy:opacity-100 transition-opacity bg-white/10 px-2 py-1 rounded text-xs">Copy</button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2"><Tags className="w-3 h-3" /> Trending Hashtags</label>
                      <div className="bg-black/40 border border-white/10 p-4 rounded-xl text-sm text-blue-400 font-mono break-all leading-relaxed hover:border-white/20 transition-colors">
                        {currentSong.tags}
                      </div>
                    </div>
                  </div>

                  {/* Export Actions */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Publishing Assets</label>

                    <button
                      onClick={handleExportVideo}
                      disabled={isExportingVideo}
                      className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 p-4 rounded-xl transition-all text-sm font-semibold group/btn"
                    >
                      <span className="flex items-center gap-3 text-white">
                        {isExportingVideo ? <div className="w-5 h-5 border-[3px] border-white/20 border-t-white rounded-full animate-spin"></div> : <Video className="w-5 h-5 text-indigo-400 group-hover/btn:scale-110 transition-transform" />}
                        Render Lyric Video (.mp4)
                      </span>
                      <Download className="w-4 h-4 text-gray-500 group-hover/btn:text-white transition-colors" />
                    </button>

                    <button
                      onClick={handleExportSRT}
                      disabled={isExportingSRT || !currentSong.lyrics}
                      className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 p-4 rounded-xl transition-all text-sm font-semibold group/btn"
                    >
                      <span className="flex items-center gap-3 text-white">
                        {isExportingSRT ? <div className="w-5 h-5 border-[3px] border-white/20 border-t-white rounded-full animate-spin"></div> : <Captions className="w-5 h-5 text-emerald-400 group-hover/btn:scale-110 transition-transform" />}
                        Generate YouTube Subtitles (.srt)
                      </span>
                      <Download className="w-4 h-4 text-gray-500 group-hover/btn:text-white transition-colors" />
                    </button>

                    <button className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 p-4 rounded-xl transition-all text-sm font-semibold group/btn">
                      <span className="flex items-center gap-3 text-white">
                        <ImageIcon className="w-5 h-5 text-pink-400 group-hover/btn:scale-110 transition-transform" />
                        AI Thumbnail Generator
                      </span>
                      <Wand2 className="w-4 h-4 text-gray-500 group-hover/btn:text-white transition-colors" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* RIGHT COLUMN: DISCOVER */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="xl:col-span-4 mt-12 xl:mt-0"
        >
          <div className="bg-glassBg border border-glassBorder rounded-3xl p-6 h-full backdrop-blur-md sticky top-28 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  Top Charts
                </h3>
                <p className="text-sm text-gray-500 mt-1">Trending right now in Cambodia</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-glassBorder flex items-center justify-center">
                <Music className="w-5 h-5 text-neonOrange animate-pulse" />
              </div>
            </div>

            <div className="space-y-3">
              {TRENDING_TRACKS.map((track, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                  key={track.id}
                  className="group relative bg-black/20 border border-glassBorder hover:border-neonRed/30 rounded-2xl p-3 flex items-center gap-4 cursor-pointer transition-all hover:bg-white/5"
                >

                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${track.color} flex items-center justify-center flex-shrink-0 relative overflow-hidden shadow-lg`}>
                    <div className="absolute inset-0 bg-black/10"></div>
                    <span className="text-white/80 font-black text-xl italic absolute -bottom-1 -right-1 opacity-20">{track.id}</span>
                    <Play className="w-6 h-6 text-white z-10 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 drop-shadow-lg fill-current" />
                  </div>

                  <div className="flex-1 min-w-0 pr-2">
                    <h4 className="text-base font-bold text-white truncate group-hover:text-neonRed transition-colors leading-tight mb-1">{track.title}</h4>
                    <p className="text-xs text-gray-500 truncate mb-2">{track.prompt}</p>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <span className="text-neonRed block px-2 py-0.5 bg-neonRed/10 rounded-sm">{track.views} views</span>
                      <span>{track.genre}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-gradient-to-br from-neonRed/10 to-neonOrange/5 border border-neonRed/20 rounded-2xl text-center relative overflow-hidden group">
              <div className="absolute -inset-2 bg-gradient-to-r from-neonRed/0 via-neonRed/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>

              <div className="w-12 h-12 rounded-full bg-neonRed/20 flex items-center justify-center mx-auto mb-4 border border-neonRed/30">
                <Radio className="w-6 h-6 text-neonRed" />
              </div>
              <h4 className="font-bold text-white text-lg mb-2">Studio Pro License</h4>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">Unlock commercial rights, 8K render exports, and auto-distribution to Apple Music & Spotify.</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full py-3.5 bg-white text-black font-bold rounded-xl text-sm shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                Upgrade Workspace
              </motion.button>
            </div>
          </div>
        </motion.div>

      </main>

      {/* Styles for animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}
