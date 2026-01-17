import { defineConfig } from "@osdk/widget.client";

// Any updates to the widget configuration in this file such as new parameters
// and events will not be reflected in dev mode. Publish a new version of the
// widget set to start developing against configuration changes.

export default defineConfig({
  id: "flashCardsWidget",
  name: "Foundry Flash Cards",
  description: "Interactive flash cards to learn about Palantir's Foundry platform",
  type: "workshop",
  parameters: {},
  events: {},
});
