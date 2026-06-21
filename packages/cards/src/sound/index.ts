// @house-manager/cards/sound — portable Web Audio for card interactions.
//
//   import { createCardSoundService, cardSoundFeedback } from "@house-manager/cards/sound";
//   const sound = createCardSoundService({ overrides: { "card.drop": { src: "/my-drop.mp3" } } });
//   <Draggable {...cardSoundFeedback(sound)} ... />

export {
  type CardSoundServiceOptions,
  createCardSoundService,
  DEFAULT_CARD_SOUNDS,
} from "./default-registry";
export { type CardSoundMap, cardSoundFeedback } from "./feedback";
export * from "./registry";
export * from "./schema";
export { createSoundService, type SoundService, type SoundServiceOptions } from "./service";
