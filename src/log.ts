import { ILogObj, Logger } from "tslog"

const log: Logger<ILogObj> = new Logger()
log.settings.hideLogPositionForProduction = true
export { log }
