# Choreography

## One move per element

Describe each entrance with one verb: slides, scales, types, wipes. If the sentence needs "and", cut a layer. Fade plus slide plus scale plus blur on every element is the mark of generated video.

| Token | Feel | Use for |
|---|---|---|
| `smooth` | Fast start, long settle | Default. Titles, logos, cards |
| `snappy` | Faster start, short settle | Lists, feature cards, anything in a `loud` film |
| `gentle` | Even, slow | Title sequences, closing beats |
| `linear` | Constant | Progress bars, tickers. Never for position of a card or a title |
| `bouncy` | Overshoots, then rests | One element per film, at most |

Every value comes from the token file. Never type a duration or a curve by hand.

## Sequences

- Elements in a `sequence` arrive in reading order: left to right, top to bottom.
- With music, one element per music beat.
- With no music, use the stagger gap and keep the whole sequence inside the stagger cap, 0.6s. Shrink each gap by the acceleration value so arrivals speed up, like cards being dealt.
- After the last arrival, everything rests for the hold.
- Moving elements land in real slots of the layout. Nothing floats above the scene for good.

## Overlap

An element starts moving before the one ahead of it has stopped. Start the next at the overlap fraction of the move before it. Motion with no overlap reads as a slide deck.

## Cut continuity

Scenes built alone feel like slides. The viewer's eye has momentum. Keep it across every cut.

1. **One direction per film.** The plan header sets it. Every `push` follows it.
2. **Same axis, same direction.** When the old scene leaves to the left, the new scene arrives from the right and travels left. Never mirror.
3. **Zoom keeps its sign.** In a `zoom in`, the old scene grows and the new scene also grows into place. In a `zoom out`, both shrink.
4. **Cut while both sides move.** The old scene speeds up on the way out with the `exit` curve. The new scene slows down on the way in with `smooth`. The cut sits at peak speed.
5. **`carry <element>`.** One element stays on screen through the cut at the same position and size. Everything around it changes.
6. **`dissolve` once.** It is the only cut with overlap. Keep it for a change of mood.
7. **`hard` needs no motion.** Use it after a full hold, into a beat with a strong first frame.
8. **Two or three cut types per film.** List them in the plan header. A film with six kinds of cut has no voice.

Camera shake, whole-frame flashes and whole-frame pulses: three per film at most. Music moves elements, never the camera.

The idea of matching direction and speed across a cut follows the HyperFrames team's public writing on seams. The wording and values here are reelcn's own.
