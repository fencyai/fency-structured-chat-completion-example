# Fency Structured Chat Completion Example

A Next.js app demonstrating how to extract structured JSON from natural language questions using Fency's Structured Chat Completion task type.

## Overview

- The AI answers questions about a set of actors and returns structured JSON matching a Zod-defined schema
- Each question is a stateless request — no conversation history is carried between turns
- A Zod schema is converted to a JSON Schema string and passed with each task so the model returns data in a predictable shape

## Prerequisites

- Node.js 18+
- A Fency account with a secret key and publishable key

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file in the project root and add your Fency keys:
   ```bash
   NEXT_PUBLIC_PUBLISHABLE_KEY=pk_...
   FENCY_SECRET_KEY=sk_...
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) and ask questions like "what is the age of johnny depp".

## Environment Variables

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_PUBLISHABLE_KEY` | Client | Initializes the Fency SDK via `loadFency` |
| `FENCY_SECRET_KEY` | Server | Authenticates requests to the Fency REST API from API routes |

## Project Structure

```
app/
  page.tsx                         # SDK initialization and FencyProvider setup
  app.tsx                          # Q&A UI component; defines the Zod response schema
  api/
    createSession.ts               # Shared helper: POSTs to Fency sessions API
    stream-session/route.ts        # Creates a stream session (used by FencyProvider)
    agent-task-session/route.ts    # Creates a Structured Chat Completion session
lib/
  fetchCreateStreamClientToken.ts  # Fetches a stream client token from /api/stream-session
  fetchCreateAgentTaskClientToken.ts # Fetches an agent task client token from /api/agent-task-session
  actorInfo.ts                     # Static actor data text used as the system prompt context
hooks/
  useActorQandA.ts                 # Custom hook wrapping useAgentTasks for structured Q&A
```

## How It Works

### 1. SDK Initialization — `app/page.tsx`

The Fency SDK is initialized once at the module level using the publishable key. The `FencyProvider` wraps the app and receives a `fetchCreateStreamClientToken` callback the SDK uses internally to authenticate real-time streams.

```tsx
const fency = loadFency({
    publishableKey: process.env.NEXT_PUBLIC_PUBLISHABLE_KEY!,
})

export default function Home() {
    return (
        <FencyProvider
            fency={fency}
            fetchCreateStreamClientToken={fetchCreateStreamClientToken}
        >
            <App />
        </FencyProvider>
    )
}
```

### 2. Server-Side API Endpoints

#### `app/api/createSession.ts`

A shared utility used by both API routes. It calls `POST https://api.fency.ai/v1/sessions` with the `FENCY_SECRET_KEY` and returns the response (which includes a short-lived `clientToken`). The secret key never leaves the server.

#### `app/api/stream-session/route.ts`

Creates a stream session used by `FencyProvider` for real-time task updates:

```ts
export async function POST() {
    return await createSession({ createStream: {} })
}
```

#### `app/api/agent-task-session/route.ts`

Creates a Structured Chat Completion session:

```ts
export async function POST() {
    return await createSession({
        createAgentTask: { taskType: 'STRUCTURED_CHAT_COMPLETION' },
    })
}
```

### 3. Client-Side Token Fetchers — `lib/`

Both fetchers call their respective API routes and return `{ clientToken }`.

- **`fetchCreateStreamClientToken`** — calls `POST /api/stream-session`; passed to `FencyProvider`
- **`fetchCreateAgentTaskClientToken`** — calls `POST /api/agent-task-session`; passed to `useActorQandA`

### 4. The `useAgentTasks` Hook

`useAgentTasks` from `@fencyai/react` is the core hook. It returns:

- `agentTasks` — a reactive array of task objects, each containing `params`, `error`, and live result state
- `createAgentTask` — an async function that starts a new task and returns its result

The hook requires a `fetchCreateAgentTaskClientToken` callback it uses to obtain an authenticated token before each task.

### 5. Custom Hook — `hooks/useActorQandA.ts`

`useActorQandA` wraps `useAgentTasks` for stateless structured Q&A. Unlike the chat examples, there is no conversation history — every question is an independent request. On each question it:

1. Builds a fresh `[system, user]` message pair: the system message contains the static actor data from `ACTOR_INFO_TEXT`; the user message is the question
2. Calls `createAgentTask` with `type: 'StructuredChatCompletion'`, the messages, the model, and a `jsonSchema` string

The `jsonSchema` is generated in `app.tsx` by converting a Zod schema with `z.toJSONSchema`:

```ts
// app/app.tsx
const actorResponseSchema = z.object({
    actorName: z.string().describe('Name of the actor'),
    age: z.string().describe('Age of the actor'),
})

// Passed to the hook as a JSON string
jsonSchema: JSON.stringify(z.toJSONSchema(actorResponseSchema))
```

The hook call:

```ts
await createAgentTask({
    type: 'StructuredChatCompletion',
    messages,           // [{ role: 'system', content: actorInfoText }, { role: 'user', content: question }]
    model,              // 'anthropic/claude-sonnet-4.5'
    jsonSchema,         // JSON Schema string derived from the Zod schema
})
```

The model returns a JSON object matching the schema (e.g. `{ "actorName": "Johnny Depp", "age": "60" }`), which is displayed via the `AgentTaskProgress` component.
