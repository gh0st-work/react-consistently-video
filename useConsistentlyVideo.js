import React, {useState, useEffect, useRef} from "react";

const useConsistentlyVideo = ({
  id = 0,
  videoUrl = false,
  preload = 'auto',
  playsInline = true,
  style = {},
  className = '',
  beforeFrameUpdate = async (timestamp, currentTime) => {},
  volume = 100,
  timeouts = 10,
}) => {

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingPercent, setLoadingPercent] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [loadingError, setLoadingError] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [waitingEvent, setWaitingEvent] = useState(false)
  const [performedEvent, setPerformedEvent] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const videoRef = useRef()
  const duration = videoRef?.current?.duration

  // Helpers

  const insertSrc = (element, blob) => {
    if ('srcObject' in element) {
      try {
        element.srcObject = blob;
      } catch (err) {
        if (err.name !== "TypeError") {
            throw err;
        }
        // Even if they do, they may only support MediaStream
        element.src = URL.createObjectURL(blob);
      }
    } else {
      element.src = URL.createObjectURL(blob);
    }
  }

  const cleanVolume = (volume) => {
    if (volume < 0) {
      return 0
    } else if (volume > 100) {
      return 1
    } else {
      return volume / 100
    }
  }

  const sleep = (timeout) => {
    return new Promise(resolve => {
      setTimeout(() => resolve(true), timeout)
    })
  }


  // Events control

  useEffect(() => {
    if (waitingEvent) {
      if (waitingEvent.startsWith('seek-')) {
        if (waitingEvent.split('-').pop() === currentTime.toString()) {
          setWaitingEvent(false)
        }
      }
    }
  }, [currentTime])

  const performedEventChange = async () => {
    switch (performedEvent) {
      case 'play':
        await setPlaying(true)
        break
      case 'pause':
        await setPlaying(false)
        break
    }
    if (performedEvent === waitingEvent) {
      await setWaitingEvent(false)
    }
  }

  useEffect(() => {
    performedEventChange(performedEvent)
  }, [performedEvent])

  useEffect(() => {
    if (videoRef?.current && !mounted) {
      setMounted(true)
      videoRef.current.onplaying = () => setPerformedEvent('play')
      videoRef.current.onpause = () => setPerformedEvent('pause')
    }
  }, [videoRef])

  const waitReady = async () => {
    if (waitingEvent) {
      if (timeouts) {
        await sleep(timeouts)
      }
      await waitReady()
    }
    return true
  }

  const onTimeUpdateCallback = async (timestamp) => {
    let nextCurrentTime = videoRef?.current?.currentTime
    await beforeFrameUpdate(timestamp, nextCurrentTime)
    await setCurrentTime(nextCurrentTime)
    window.requestAnimationFrame(onTimeUpdateCallback)
  }

  useEffect(() => {
    if (mounted && loaded && videoRef?.current) {
      videoRef.current.volume = cleanVolume(volume)
    }
  }, [volume])

  // Usage

  const load = async (axiosInstance = null) => {
    await setLoadingError(false)
    await setLoading(true)
    try {
      if (axiosInstance !== null) {
        let response = await axiosInstance({
          url: videoUrl,
          method: 'GET',
          responseType: 'blob',
          onDownloadProgress: (progressEvent) => {
            setLoadingPercent(parseInt(progressEvent.loaded / progressEvent.total * 100))
          }
        })
        let mime = 'video/' + videoUrl.split('.').slice(-1)[0]
        insertSrc(videoRef.current, new Blob([response.data], {type: mime}))
        videoRef.current.volume = cleanVolume(volume)
        window.requestAnimationFrame(onTimeUpdateCallback)
      } else {
        console.log('useConsistentlyVideo WARNING: you called load on video with id ' + id + ' without axiosInstance, that can lead to inconsistently work of your app and this library')
        videoRef.current.src = videoUrl
        videoRef.current.volume = cleanVolume(volume)
        videoRef.current.load()
        window.requestAnimationFrame(onTimeUpdateCallback)
      }
      await setLoaded(true)
      await setLoading(false)
      return true
    } catch (e) {
      console.log('useConsistentlyVideo ERROR: video with id ' + id + ' failed to load, error: ', e)
      await setLoadingError(true)
      await setLoading(false)
      return false
    }
  }

  const play = async () => {
    await setWaitingEvent('play')
    await videoRef.current.play()
    await waitReady()
  }

  const pause = async () => {
    await setWaitingEvent('pause')
    videoRef.current.pause()
    await waitReady()
  }

  const seek = async (seconds) => {
    if (seconds >= 0 && seconds <= videoRef?.current?.duration && currentTime !== seconds) {
      await setWaitingEvent('seek-'+seconds)
      videoRef.current.currentTime = seconds
      await waitReady()
    }
  }


  const renderVideo = () => {
    return (
      <video
        className={className}
        preload={preload}
        playsInline={playsInline}
        ref={videoRef}
        style={style}
        onMouseMove={() => setHovered(true)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
    )
  }

  return {
    renderVideo: renderVideo,
    load: load,
    play: play,
    pause: pause,
    seek: seek,
    videoRef: videoRef,
    mounted: mounted,
    waitingEvent: waitingEvent,
    currentTime: currentTime,
    duration: duration,
    loading: loading,
    loadingPercent: loadingPercent,
    loaded: loaded,
    loadingError: loadingError,
    playing: playing,
    hovered: hovered,
  }
}


export default useConsistentlyVideo