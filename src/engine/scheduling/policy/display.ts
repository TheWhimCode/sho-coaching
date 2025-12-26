export type DisplayPolicy = {
  displayStepMin: number;
};

export const DEFAULT_DISPLAY_POLICY: DisplayPolicy = {
  displayStepMin: 30,
};

export function isDisplayableStart(d: Date, policy = DEFAULT_DISPLAY_POLICY) {
  return d.getUTCMinutes() % policy.displayStepMin === 0;
}
