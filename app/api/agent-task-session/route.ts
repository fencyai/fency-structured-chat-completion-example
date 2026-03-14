import { createSession } from '../createSession'

export async function POST() {
    return await createSession({
        createAgentTask: { taskType: 'STRUCTURED_CHAT_COMPLETION' },
    })
}
