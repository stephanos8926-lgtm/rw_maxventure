import { getSimulationEngine } from "@/lib/simulation-engine";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const engine = getSimulationEngine();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial snapshot immediately
      const initialPayload = JSON.stringify(engine.getState());
      controller.enqueue(encoder.encode(`event: enterprise_update\ndata: ${initialPayload}\n\n`));

      // Periodic heartbeat loop
      const interval = setInterval(() => {
        try {
          const currentState = engine.getState();
          // Advance cycle if active and not paused
          if (currentState.phase === "autonomous_execution" && currentState.simulation_speed > 0) {
            engine.advanceSimulationCycle();
          }

          const updatedPayload = JSON.stringify(engine.getState());
          controller.enqueue(encoder.encode(`event: enterprise_update\ndata: ${updatedPayload}\n\n`));
        } catch (err) {
          console.error("SSE stream tick error:", err);
          clearInterval(interval);
          controller.close();
        }
      }, 2500);

      // Clean up when client disconnects
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // ignore if already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
