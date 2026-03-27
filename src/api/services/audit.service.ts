import { insertAuditLog, listAuditLogs } from '../../db/audit.db.js';

export async function writeAuditLog(input: {
    flagConfigId: string;
    actor: string;
    action: string;
    before: any;
    after: any;
}) {
    // return void but awaited → ensures ordering in write flow
    await insertAuditLog(input);
}

export async function getAuditLogs(flagId: string, limit?: number, offset?: number) {
    const l = limit ?? 20;
    const o = offset ?? 0;

    return await listAuditLogs(flagId, l, o);
}
