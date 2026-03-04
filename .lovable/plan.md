

## Plan: Make Syntax Saga Mobile-Friendly and Deployable

### Problem
The game uses a fixed 960×600 canvas and keyboard-only controls, making it unplayable on mobile devices. It also needs deployment preparation.

### Changes Required

#### 1. Add Touch Controls Overlay (`src/components/TouchControls.tsx` — new file)
- Create a transparent overlay with touch-friendly virtual buttons:
  - **Left/Right D-pad** (bottom-left) for movement
  - **Jump button** (bottom-right, large circular button)
  - **Action button** (E/interact, smaller, next to jump)
- Buttons inject into the same `keysRef` Set used by keyboard input
- Only render on touch-capable devices (`'ontouchstart' in window`)
- Use `onTouchStart`/`onTouchEnd` to simulate key press/release

#### 2. Responsive Canvas (`src/pages/Index.tsx`)
- Make canvas scale to fit the viewport while maintaining 960×600 aspect ratio
- Use CSS `object-fit: contain` or a wrapper with `aspect-ratio: 960/600` and `width: 100%`
- Pass touch control callbacks that add/remove from `keysRef`

#### 3. Expose keysRef from useGameEngine (`src/game/useGameEngine.ts`)
- Return `keysRef` from the hook so `TouchControls` can inject virtual key events

#### 4. Mobile-Friendly UI Screens
- **TitleScreen**: Reduce font sizes on small screens, replace keyboard hint text with "Tap controls on screen"
- **GameHUD**: Stack vertically or reduce spacing on narrow screens; the `ml-20` on player name needs to be responsive
- **CodingChallenge**: Ensure the modal scrolls on small screens (`overflow-y-auto`, `max-h-[90vh]`)
- **PauseMenu, GameOverScreen, PlayerNameEntry, LanguageSelect**: Add responsive padding/font adjustments

#### 5. Viewport & HTML Meta (`index.html`)
- Ensure `viewport` meta prevents zoom: `user-scalable=no, viewport-fit=cover`
- Add `<meta name="apple-mobile-web-app-capable" content="yes">`
- Update title to "Syntax Saga"

#### 6. Deployment Readiness
- Update `index.html` title and meta tags to "Syntax Saga"
- The app is already a Vite SPA — deployable via Lovable's Publish button with no additional config needed

### File Summary
| File | Action |
|------|--------|
| `src/components/TouchControls.tsx` | Create — virtual d-pad + buttons |
| `src/game/useGameEngine.ts` | Expose `keysRef` |
| `src/pages/Index.tsx` | Add TouchControls, responsive canvas |
| `src/components/GameHUD.tsx` | Responsive layout fixes |
| `src/components/CodingChallenge.tsx` | Scrollable on small screens |
| `src/components/TitleScreen.tsx` | Mobile text adjustments |
| `index.html` | Meta tags for mobile + updated title |
| Other screen components | Minor responsive tweaks |

