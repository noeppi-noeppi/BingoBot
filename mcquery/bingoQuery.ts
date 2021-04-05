import { status } from "minecraft-server-util"
import {StatusResponse} from "minecraft-server-util/dist/model/StatusResponse";

let failedQueryFastTimeout = 0;
let fastQueryTimeout: NodeJS.Timeout | null = null

let queryAcceptorCache: ((query: StatusResponse) => Promise<void>) | null = null

export async function startQuery(queryAcceptor: (query: StatusResponse) => Promise<void>): Promise<void> {
    queryAcceptorCache = queryAcceptor
    setInterval(async () => {
        if (failedQueryFastTimeout > 0) {
            if (fastQueryTimeout == null) {
                fastQueryTimeout = setInterval(() => fastQuery(queryAcceptor), 1000 * 30)
            }
        } else {
            if (fastQueryTimeout != null) {
                clearInterval(fastQueryTimeout)
                fastQueryTimeout = null
            }
            await doQuery(queryAcceptor)
        }
    }, 1000 * 60 * 10)
}

async function fastQuery(queryAcceptor: (query: StatusResponse) => Promise<void>): Promise<void> {
    if (!await doQuery(queryAcceptor)) {
        if (failedQueryFastTimeout > 0) failedQueryFastTimeout -= 1
    } else if (failedQueryFastTimeout < 3) {
        failedQueryFastTimeout = 3
    }
}

async function doQuery(queryAcceptor: (query: StatusResponse) => Promise<void>): Promise<boolean> {
    try {
        const q = await status("bingo.castcrafter.de")
        await queryAcceptor(q)
        return true
    } catch (err) {
        return false;
    }
}

export function enableFastQuery() {
    failedQueryFastTimeout = 20;
    if (fastQueryTimeout == null) {
        fastQueryTimeout = setInterval(() => {
            if (queryAcceptorCache != null) {
                fastQuery(queryAcceptorCache)
            }
        }, 1000 * 15)
    }
}