import { useEffect, useRef, useState, useCallback } from 'react';

const YT_API_URL = 'https://www.youtube.com/iframe_api';
const YT_STATE_ENDED = 0;
const YT_STATE_PLAYING = 1;
const YT_STATE_PAUSED = 2;

function loadYouTubeAPI() {
  return new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve();
      return;
    }
    if (window.__ytAPIResolve) {
      window.__ytAPIResolve.push(resolve);
      return;
    }
    window.__ytAPIResolve = [resolve];
    window.onYouTubeIframeAPIReady = () => {
      window.__ytAPIResolve?.forEach((r) => r());
      window.__ytAPIResolve = null;
    };
    const script = document.createElement('script');
    script.src = YT_API_URL;
    script.async = true;
    const first = document.getElementsByTagName('script')[0];
    first?.parentNode?.insertBefore(script, first);
  });
}

function getThumbnailUrl(videoId) {
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export default function useYouTubePlayer(
  queue,
  currentIndex,
  isPlaying,
  setQueue,
  setCurrentIndex,
  setIsPlaying
) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const [currentTitle, setCurrentTitle] = useState('');
  const isReadyRef = useRef(false);
  const queueRef = useRef(queue);
  const currentIndexRef = useRef(currentIndex);
  queueRef.current = queue;
  currentIndexRef.current = currentIndex;

  const videoId = Array.isArray(queue) && queue[currentIndex] ? queue[currentIndex] : null;

  const syncPlayerToQueue = useCallback(() => {
    const player = playerRef.current;
    if (!player || !videoId) return;
    player.cueVideoById(videoId);
    setCurrentTitle('');
  }, [videoId]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let mounted = true;
    let player = null;

    loadYouTubeAPI().then(() => {
      if (!mounted || !containerRef.current) return;
      player = new window.YT.Player(containerRef.current, {
        width: 1,
        height: 1,
        videoId: videoId || undefined,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady(event) {
            if (!mounted) return;
            playerRef.current = event.target;
            isReadyRef.current = true;
            if (videoId) {
              event.target.cueVideoById(videoId);
            }
          },
          onStateChange(event) {
            if (!mounted) return;
            if (event.data === YT_STATE_ENDED) {
              const q = queueRef.current;
              const idx = currentIndexRef.current;
              const next = idx + 1;
              if (Array.isArray(q) && next < q.length) {
                setCurrentIndex(next);
                setIsPlaying(true);
              } else {
                setIsPlaying(false);
              }
            } else if (event.data === YT_STATE_PLAYING || event.data === YT_STATE_PAUSED) {
              const data = event.target.getVideoData?.();
              if (data?.title) setCurrentTitle(data.title);
            }
          },
        },
      });
    });

    return () => {
      mounted = false;
      const p = playerRef.current;
      if (p?.destroy) p.destroy();
      playerRef.current = null;
      isReadyRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isReadyRef.current || !playerRef.current) return;
    if (!videoId) {
      return;
    }
    syncPlayerToQueue();
  }, [videoId, syncPlayerToQueue]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player?.getPlayerState) return;
    if (isPlaying && videoId) {
      player.playVideo();
    } else {
      player.pauseVideo();
    }
  }, [isPlaying, videoId]);

  const play = useCallback(() => {
    if (videoId) setIsPlaying(true);
  }, [videoId, setIsPlaying]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, [setIsPlaying]);

  const next = useCallback(() => {
    if (!Array.isArray(queue) || queue.length === 0) return;
    const nextIndex = Math.min(currentIndex + 1, queue.length - 1);
    if (nextIndex !== currentIndex) {
      setCurrentIndex(nextIndex);
      setIsPlaying(true);
    }
  }, [queue, currentIndex, setCurrentIndex, setIsPlaying]);

  const prev = useCallback(() => {
    if (!Array.isArray(queue) || queue.length === 0) return;
    const player = playerRef.current;
    const currentTime = player?.getCurrentTime?.() ?? 0;
    if (currentTime > 3) {
      player?.seekTo?.(0);
      return;
    }
    const prevIndex = Math.max(currentIndex - 1, 0);
    if (prevIndex !== currentIndex) {
      setCurrentIndex(prevIndex);
      setIsPlaying(true);
    }
  }, [queue, currentIndex, setCurrentIndex, setIsPlaying]);

  const currentThumbnail = getThumbnailUrl(videoId);

  return {
    playerContainerRef: containerRef,
    play,
    pause,
    next,
    prev,
    currentTitle: currentTitle || (videoId ? 'Loading…' : ''),
    currentThumbnail,
    currentVideoId: videoId,
    hasTrack: !!videoId,
  };
}
