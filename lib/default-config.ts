import type { Config } from "./types"

export const defaultConfig: Config = {
  frames: [
    { name: "frames_normal", flip_left: true, images: [] },
    { name: "frames_noise", flip_left: false, images: [] },
    { name: "frames_amogus", flip_left: true, images: [] },
    { name: "frames_boop", flip_left: true, images: [] },
    { name: "frames_boop_transition", flip_left: true, images: [] },
  ],
  expressions: [
    { name: "normal", frames: "frames_normal", animation: [1, 2, 1, 2, 1, 2, 3, 4, 3], duration: 250 },
    { name: "sus", frames: "frames_amogus", animation: "auto", duration: 200 },
    {
      name: "noise",
      frames: "frames_noise",
      animation: "auto",
      duration: 5,
      onEnter:
        "ledsStackCurrentBehavior()  ledsSegmentBehavior(0, BEHAVIOR_NOISE) ledsSegmentBehavior(1, BEHAVIOR_NOISE)",
      onLeave: "ledsPopBehavior()",
    },
    { name: "boop", frames: "frames_boop", animation: [1, 2, 3, 2], duration: 250 },
    { name: "boop_begin", frames: "frames_boop_transition", animation: [1, 2, 3], duration: 250, transition: true },
    { name: "boop_end", frames: "frames_boop_transition", animation: [3, 2, 1], duration: 250, transition: true },
  ],
  scripts: [
    { name: "lidar test", file: "/scripts/lidartest.lua" },
    { name: "color test", file: "/scripts/colortest.lua" },
    { name: "screen test", file: "/scripts/screentest.lua" },
    { name: "controls test", file: "/scripts/controls.lua" },
    { name: "snake", file: "/scripts/snake.lua" },
    { name: "jumping wah", file: "/scripts/wah.lua" },
    { name: "tetris", file: "/scripts/tetris.lua" },
    { name: "proximity game", file: "/scripts/proximitygame.lua" },
    { name: "breakout", file: "/scripts/breakout.lua" },
    { name: "color shift", file: "/scripts/colorshift.lua" },
    { name: "FFT", file: "/scripts/fft.lua" },
  ],
  boop: {
    enabled: true,
    transitionIn: "boop_begin",
    transitionOut: "boop_end",
    boopAnimationName: "boop",
    transictionOnlyOnAnimation: "normal",
    transictionInOnlyOnSpecificFrame: 1,
  },
}
