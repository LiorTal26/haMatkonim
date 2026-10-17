This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Recipe sections and serving adjustments

The editor can add named ingredient and instruction dividers (for example, Dough,
Sauce, and Assembly). Ingredient headings use `kind: "section"` in the existing
JSON array; instruction headings use the reserved `::recipe-section::` text prefix.
No database migration is required, and legacy recipes remain readable. Empty
headings are omitted on save; headings are not counted as numbered cooking steps.

Serving changes never modify the saved recipe. Practical measurement rounding is
optional and display-only, marks changed amounts with `≈`, and limits the rounding
difference to 2%. Piece quantities are not rounded to whole items. Disable practical
rounding to see the underlying calculated quantities.

## Recipe AI setup

The recipe editor supports camera/gallery import and creating recipes from a text request.
Attach up to six photos of one recipe, in a single gallery selection or by adding
photos one at a time. Preview, reorder, or remove individual pages before generating
one combined draft. Images are compressed locally, with a combined 3 MiB decoded
upload limit to fit Vercel's request limit after base64 encoding. No recipe photos
are sent until the generation button is pressed. Already-open clients that send
the old single-image request remain supported by the server.
Results are drafts: review the ingredients, quantities and steps, fill the regular editor,
then press Save to persist through the existing Supabase recipe flow. Importing a photo
does not upload the original page to your public recipe image bucket.

Create a free API key at https://aistudio.google.com/api-keys using a Free Tier project
with no billing account linked. Set `GEMINI_API_KEY` in `.env.local` for local use,
and as a secret environment variable in Vercel for deployment. Never prefix it with
`NEXT_PUBLIC_` or commit it. Optionally set `GEMINI_RECIPE_MODEL` to
`gemini-3.5-flash-lite` (default). Google limits Gemini 2.5 access to existing users;
`gemini-2.5-flash` and `gemini-2.5-flash-lite` remain optional for legacy projects.
See https://ai.google.dev/gemini-api/docs/deprecations for current availability.
Paid-only models and floating aliases are rejected;
there is no fallback to a paid provider. Free-tier limits still apply: exhausted quota
shows an error and does not cause an upgrade. Restart the dev server, or redeploy
after changing Vercel environment variables. See `.env.example` for variable names.

The endpoint verifies the Supabase user, limits image/request size, requests a strict
JSON schema and validates the returned draft. Images and prompts are sent to Google
Gemini only when the user presses the generation button. Google's free tier may use
submitted content to improve its products; the UI discloses this before submission.
See https://ai.google.dev/gemini-api/docs/pricing for current free-tier terms. The in-memory
limit is five requests per user per ten minutes **per server instance**; for a public
deployment with multiple instances, add a shared rate limiter and provider budget limits.
Missing API configuration leaves manual recipe entry available.

Run `npm test`, `npm run lint`, and `npm run build` before publishing.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
