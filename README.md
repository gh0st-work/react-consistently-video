# **react-consistently-video**

**React hook that allows you to work consistently with HTML5 video, such as using stable asynchronous functions with additional execution checking, convenience states and accurate data**

## Purpose
Shortly, HTML5 + js video is outdated shit:
- Uses the play function as asynchronous, leaving all functions synchronous
- Timeupdate event is not called on every frame update, and you need to use requestAnimationFrame
- "x() was interrupted by y()" error
- URL.createObjectURl() deprecated / overload resolution failed, while sometimes srcObject is not supported
- Another nonsense, that you have encountered, if you tried to work (work, not stupidly play a video in 2 lines) with js media, you probably notice how control disappears with each line of code and you understand what I mean, if not, follow another plugin that will draw some shit for your landing page

## Install
```npm i react-consistently-video --save```

## Usage
```jsx
import useConsistentlyVideo from "react-consistently-video"

const video = useConsistentlyVideo({
  id: 0,
  videoUrl: '...',
  preload: 'auto',
  playsInline: true,
  style: {...},
  className: '...',
  beforeFrameUpdate: async (timestamp, currentTime) => {}, // called in requestAnimationFrame callback
  volume: 100,
  timeouts: 10, // checking timeouts
})

// video.renderVideo() - to render video component in your code
// await video.load(axiosInstance) - to load video fully using blob
// await video.play() - play video
// await video.pause() - pause video
// await video.seek(2.57) - go to second 2.57
// video.videoRef - video ref
// video.mounted - bool (mounted or not)
// video.waitingEvent - if some event is in progress
// video.currentTime - accurate currentTime (every frame result and can be used normally)
// video.duration - just video duration
// video.loading - is loading or not
// video.loadingPercent - percent loaded
// video.loaded - video fully loaded
// video.loadingError - if video loading error occured
// video.playing - if playing or not (accurate and can be used normally)
// video.hovered - if hovered
...

```