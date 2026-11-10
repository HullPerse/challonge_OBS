import Logger from "@/lib/server/logger.utils";
import { attempt } from "@hullperse/hp_utils/attempt";

const logger = new Logger("BROWSER");

/** Opens the default browser for the standalone app. */
export default class BrowserUtils {
  private static command(): string[] {
    if (process.platform === "win32") return ["cmd.exe", "/c", "start", ""];
    if (process.platform === "darwin") return ["open"];

    return ["xdg-open"];
  }

  static async open(url: string): Promise<void> {
    const [command, ...args] = BrowserUtils.command();
    const [, error] = await attempt(
      Bun.spawn([command, ...args, url], {
        stdin: "ignore",
        stdout: "ignore",
        stderr: "ignore",
        windowsHide: true,
      }).exited,
    );

    if (error) logger.warn("could not open the browser", { error, url });
  }
}
