// Renderer-seitiger Telemetrie-Wrapper. Reicht Ereignisse an den Main-Prozess weiter,
// der gegen die Einwilligung prüft und (nur dann) an Aptabase sendet.
// No-op im Browser/Dev/Tests (kein window.api.telemetry) und niemals werfend.
export function track(event, props) {
  try {
    window.api?.telemetry?.track?.(event, props);
  } catch {
    /* ignore */
  }
}
