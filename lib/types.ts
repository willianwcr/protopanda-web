export interface Frame {
  name: string
  flip_left: boolean
  images: string[] // Array of image IDs from storage
}

export interface Expression {
  name: string
  frames: string
  animation: "auto" | number[]
  duration: number
  transition?: boolean
  onEnter?: string
  onLeave?: string
  hidden?: boolean
  intro?: string
  outro?: string
}

export interface Script {
  name: string
  file: string
}

export interface Config {
  frames: Frame[]
  expressions: Expression[]
  scripts: Script[]
  boop: {
    enabled: boolean
    transitionIn: string
    transitionOut: string
    boopAnimationName: string
    transictionOnlyOnAnimation: string
    transictionInOnlyOnSpecificFrame: number
  }
}
