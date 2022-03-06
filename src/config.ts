export enum Stage {
  Live = "live",
  Local = "local",
}

export const config = {
  /**
   * AWS region
   */
  region: process.env.REGION ?? "ap-southeast-2",
  /**
   * One of:
   * * `live`
   * * `local`
   */
  stage: process.env.STAGE === Stage.Local ? Stage.Local : Stage.Live,
};
