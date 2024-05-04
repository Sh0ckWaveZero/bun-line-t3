export interface Config {
  radius: number;
  hue: boolean;
  lightness: number;
  chroma: number;
  hueBase: number;
  hueDestination: number;
  speed: number;
  distance: number;
  scale: boolean;
  alternate: boolean;
}

export const CONFIG: Config = {
  radius: 35,
  hue: true,
  lightness: 0.5,
  chroma: 2,
  hueBase: 180,
  hueDestination: 320,
  speed: 2.5,
  distance: 8,
  scale: false,
  alternate: false,
};