# New style: a cookbook, not a software dashboard

## Skill and scope

Installed and applied [Anthropic's frontend-design](https://github.com/anthropics/skills/tree/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/frontend-design), pinned to `dbd4588f9e1033efb41dad4bef2f7947c8993d44`, through Codex's skill installer. It is installed locally at `C:/Users/Lior/.codex/skills/frontend-design`; it contains instructions and a license, not an application dependency.

Implementation stays on `new-style`. No database, authentication, AI-provider, or ingredient-scaling behavior changes. Do not merge or promote to production without the owner's approval.

## Design plan

Audience: home cooks collecting their own recipes, often cooking from a phone. Primary jobs: find a saved dish, read ingredients, adjust servings, and add a recipe from photos.

Palette (light): rice `#FAFBF7`, porcelain `#FFFFFF`, basil `#245C43`, ink `#20392D`, lemon `#E5D978`, sage `#EAF0E7`. Dark mode uses deep evergreen surfaces with subdued mint and warm yellow; existing theme preferences and the Choo palette remain supported.

Typography: one self-hosted variable Rubik family for Hebrew and English. Body text stays comfortable; display headings use weight and generous line-height instead of a competing Latin-only font.

Layout: align content to the reading direction. One open-cookbook composition on the landing page, then practical grids, generous form spacing, and a quiet sidebar inside the application.

```text
Desktop, RTL:
[account actions                         book identity]
[open recipe spread              headline + main action]
[photo import / category organization / cooking tools]

Application, RTL:
[search and actions                            sidebar]
[collection title + add recipe                 sidebar]
[filters                                      sidebar]
[recipe photo] [recipe photo] [recipe photo]    sidebar]

Phone: navigation, heading, cookbook preview, then tools.
Application: search, collection, filters, cards, bottom navigation.
```

## Review before implementation

An initial cream-and-serif editorial direction would be an interchangeable food-site template. Revised it to a recognizable recipe binder: green binding, real recipe content, and a lemon-colored note explaining photo import. The spread is the single expressive moment; no floating emoji, decorative gradients, fake usage numbers, testimonials, or repeated animated panels.

## Principles

- Let the recipe, not the interface, be the center of attention.
- Borders group content; shadows belong to the book and overlays.
- Preserve RTL/LTR, both themes, ingredient readability, and 44px touch targets.
- Use semantic links and descriptive labels; respect reduced motion.
- Keep existing capabilities and user data untouched.

## Inside the book, second pass

Carry the existing rice/basil/sage/lemon tokens and Rubik typography into the authenticated workspace, not just its entry pages. Keep the collection practical; make the individual recipe the expressive surface: photograph and title on its cover, ingredients and instructions on facing reading pages, and the user's existing sticky notes below.

```text
[back + categories                       favourite / edit / delete]
[photograph                        title / description / recipe facts]
[serving controls                                                   ]
[ingredients                  |  preparation steps                    ]
[personal sticky notes                                              ]
```

On phones the pages stack in reading order, with full-width ingredient-name fields and reachable actions. Category management becomes a tidy recipe index; recipe creation/editing uses separated form chapters. New class names and markup replace inline presentation, while existing handlers, state, calculations, data access, Choo triggers, birthday celebration, and secret-recipe guards stay intact. Regression fingerprints check the logic separately from the JSX.

The landing recipe is explicitly a display example, not user data. Its illustrative food photo is served from Unsplash; no private recipe photos are used.

## Verification

- Browser checks at desktop, 375px, and 320px: Hebrew/RTL, English/LTR, light and dark appearances; no horizontal overflow in the checked layouts.
- Real recipe-form component, using only a temporary local QA page: ingredient names remain readable at 16px; local serving controls update; mobile menu opens/closes and is hidden from keyboard navigation when closed.
- Recipe cards have independent favourite controls and real links that open with Enter. The existing authentication guard still redirects unauthenticated recipe navigation to login.
- Component regression tests cover labels, favourite state, legacy categories, missing photos, and unknown values, alongside the existing recipe and AI tests.
- No live database records, user recipes, or Gemini inference requests were created by these visual checks. Temporary QA pages are removed before commit and build.

### Authenticated-surface pass

- Mounted the actual dashboard layout, collection, recipe detail, editor, category manager, and existing celebration in temporary local review routes. This verifies the same UI components used after sign-in without creating an account or changing live records; it is not an authenticated end-to-end database-write test.
- Verified the existing five-click logo trigger, `choo` and `צ'ו` search triggers, birthday palette, greeting, and secret recipe. Its edit and favourite guards still show the original messages. The final deletion confirmation was not executed; its guard remains covered by the unchanged-logic regression check.
- In the real detail component, increasing servings from 2 to 4 doubles quantified ingredients; ingredient check-off still works. Recipe reading pages stack on phones. Category icon search/selection, note colour preview, and cancellation were checked without saving.
- Added 21 preservation checks against commit `2df0c9e`: component logic and event handlers are fingerprinted separately from JSX; celebration, preference persistence, data hooks, authentication guard, AI, scaling, and section serialization remain unchanged.
- The birthday component itself is untouched. A surrounding CSS variable scope keeps its original dark overlay readable even when opened from the light theme. Zero-valued times no longer leave a stray `0` in the visual metadata strip; stored times and calculations are unchanged.
- Existing ESLint `set-state-in-effect` feedback in the secret-recipe effect is intentionally not refactored as part of a visual-only change.
