import type { Config } from "./types"

export const emptyConfig: Config = {
  frames: [],
  expressions: [],
  scripts: [],
  boop: {
    enabled: false,
    transitionIn: "",
    transitionOut: "",
    boopAnimationName: "",
    transictionOnlyOnAnimation: "",
    transictionInOnlyOnSpecificFrame: 0,
  },
}
