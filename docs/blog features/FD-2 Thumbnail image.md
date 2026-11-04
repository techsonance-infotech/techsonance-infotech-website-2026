# FD-2 Thumbnail image agent

This document settles how a post gets its thumbnail, where the file lives, and what happens when no image provider is available.

## 1. Purpose and traceability

| Item | Value |
| --- | --- |
| Requirements | FR-2 (thumbnail), NFR-6 (quality checks) |
| Owner component | Image agent inside the worker |
| Inputs | Image prompt from the metadata step, site style guide |
| Output | A stored image file and its URL on the post, or `thumbnail_missing = true` |

## 2. Decisions

| Decision | Options considered | Choice | Why |
| --- | --- | --- | --- |
| Image source | AI image model only; AI with stock fallback; template card | Ordered chain: AI image model, then generated template card, then placeholder | Text is never blocked by image quota, and the site never shows a broken image |
| Text inside the image | Allow; forbid | Forbid, and put the title on the card in HTML/CSS instead | Image models spell badly. Text stays editable and translatable |
| Image prompt author | Hand-written template; writer agent | Metadata agent writes it, wrapped by a fixed style prefix from `site_settings` | Fits the article, stays on-brand |
| Storage | Provider URL; own object storage | Download and store in own S3-compatible bucket | Provider links expire; one stable URL per post |
| Formats | Original only; variants | Store a 1200x630 original, plus WebP and a small 400 px variant | Fast pages and correct social previews |
| Review before saving | None; automated checks | Automated size, aspect and file-type checks; admin sees it in the approval email | Catches broken files early |

## 3. Structure

| Part | Responsibility |
| --- | --- |
| Prompt composer | Style prefix + article image prompt + negative rules (no text, no logos, no real people) |
| Image runner | Calls the router with `capability: 'image'` |
| Fetcher | Downloads the result, checks type and size |
| Processor | Crops to 1200x630, makes WebP and small variant |
| Uploader | Puts files in object storage, returns a public URL |
| Card renderer | Fallback: renders a branded card from title and category colour |

## 4. Flow

1. After the `meta` step the image step starts. It does not wait for validation, so text and image can run in parallel.
2. The composer builds the final prompt and stores it with the post for traceability.
3. The router picks an image-capable account. On quota failure, FD-4 switches account or image model.
4. The fetcher downloads the file. It is rejected if smaller than 800 px wide, over 5 MB, or not PNG, JPEG or WebP.
5. The processor makes the variants and the uploader saves them. The post stores `thumbnail_url`, `thumbnail_provider`, `thumbnail_prompt`.
6. If every image account is exhausted, the card renderer makes a fallback and the post is flagged `thumbnail_missing = true`. The approval email says so.
7. A scheduled retry job upgrades flagged posts with a real AI image when quota returns, but only while the post is still pending or when the admin presses Regenerate image.

## 5. Implementation

```ts
const chain: ImageSource[] = [aiImageSource, cardSource, placeholderSource];

for (const source of chain) {
  try {
    const file = await source.make(prompt, { jobId, idempotencyKey: `${jobId}:thumb:${version}` });
    await assertImage(file, { minWidth: 800, maxBytes: 5_000_000 });
    return await store(file);   // original + webp + small
  } catch (e) {
    audit('thumbnail_source_failed', { source: source.name, error: String(e) });
  }
}
```

File naming: `posts/<post-id>/v<version>/hero-1200x630.webp`. A new version never overwrites an old one, so a rejected change can be rolled back.

## 6. Advanced control

| Setting | Default | Effect |
| --- | --- | --- |
| `image_style_prefix` | Flat illustration, brand colours | Prepended to every prompt |
| `image_negative_rules` | No text, no logos, no real people | Appended to every prompt |
| `image_chain` | AI, card, placeholder | Order and on/off per source |
| `image_regen_limit` | 3 per post | Stops endless regeneration on free quota |
| `max_image_mb` | 5 | Upload limit |

Admin actions on the review page: **Regenerate image**, **Upload my own**, **Use card**.

## 7. Automation hooks

- Event `thumbnail.fallback_used` lets FD-7 queue a quiet upgrade when quota returns.
- A nightly job finds published posts with `thumbnail_missing = true` and offers an upgrade to the admin instead of changing live content silently.
- Alt text is generated from the image prompt and article title and stored as `thumbnail_alt`.

## 8. Failure modes and acceptance

| Failure | Handling |
| --- | --- |
| Image provider returns an unsafe or empty result | Count as model failure, switch, then fall back to card |
| Download link expired | Retry once immediately, then treat as failure |
| Bucket upload fails | Retry with backoff; the post stays `DRAFTING` until a URL exists or the card is used |
| Wrong aspect ratio | Processor crops; if impossible, reject and retry |

**Acceptance:** with every image account disabled, a post still reaches approval with a card and `thumbnail_missing = true`; with one account healthy, the image appears at a stable URL within the job.
