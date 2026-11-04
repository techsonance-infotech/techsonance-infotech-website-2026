import fs from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { blogPosts } from "../data/blog";
import { legacyJobs } from "../lib/content/jobs";

// ─── Environment Loader ───────────────────────────────────────────────────────
export function loadEnvironment() {
  for (const envFile of [".env.local", ".env"]) {
    const envPath = path.resolve(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      try {
        if (typeof process.loadEnvFile === "function") {
          process.loadEnvFile(envPath);
        } else {
          const content = fs.readFileSync(envPath, "utf-8");
          for (const line of content.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;
            const eqIdx = trimmed.indexOf("=");
            if (eqIdx !== -1) {
              const key = trimmed.slice(0, eqIdx).trim();
              const val = trimmed
                .slice(eqIdx + 1)
                .trim()
                .replace(/^["']|["']$/g, "");
              if (!process.env[key]) {
                process.env[key] = val;
              }
            }
          }
        }
      } catch {
        // Continue if reading fails
      }
    }
  }
}

export function getScriptSupabaseClient(): SupabaseClient | null {
  loadEnvironment();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export interface SeedResult {
  siteId: string;
  authorsCount: number;
  categoriesCount: number;
  postsCount: number;
  jobsCount: number;
}

export async function seedCmsContent(client?: SupabaseClient): Promise<SeedResult> {
  const supabase = client || getScriptSupabaseClient();
  if (!supabase) {
    throw new Error(
      "Supabase client unavailable. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.",
    );
  }

  // 1. Ensure Default Agency Site exists
  const siteSlug = "techsonance";
  let siteId: string | null = null;

  const { data: existingSite } = await supabase
    .from("ts_admin_sites")
    .select("id")
    .eq("slug", siteSlug)
    .maybeSingle();

  if (existingSite?.id) {
    siteId = existingSite.id;
  } else {
    const { data: newSite, error: siteError } = await supabase
      .from("ts_admin_sites")
      .upsert(
        {
          name: "TechSonance Infotech",
          slug: siteSlug,
          domain: "techsonance.com",
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();

    if (siteError || !newSite) {
      throw new Error(`Failed to initialize site: ${siteError?.message || "Unknown error"}`);
    }
    siteId = newSite.id;
  }

  if (!siteId) {
    throw new Error("Failed to determine site id for seeding.");
  }

  // 2. Seed Authors
  const distinctAuthors = [
    { name: "Sajeshkumar Adeya", role: "CTO TechSonance", avatar: "SA" },
    { name: "Manish Kushwaha", role: "Lead Developer", avatar: "MK" },
    { name: "Someshwari Adeya", role: "CEO", avatar: "SO" },
  ];

  const authorNameToId: Record<string, string> = {};

  for (const author of distinctAuthors) {
    // Check if author already exists for this site
    const { data: existingAuthor } = await supabase
      .from("ts_content_authors")
      .select("id")
      .eq("site_id", siteId)
      .eq("name", author.name)
      .maybeSingle();

    if (existingAuthor?.id) {
      authorNameToId[author.name] = existingAuthor.id;
      await supabase
        .from("ts_content_authors")
        .update({ role: author.role, avatar: author.avatar })
        .eq("id", existingAuthor.id);
    } else {
      const { data: newAuthor, error: authorErr } = await supabase
        .from("ts_content_authors")
        .insert({
          site_id: siteId,
          name: author.name,
          role: author.role,
          avatar: author.avatar,
        })
        .select("id")
        .single();

      if (!authorErr && newAuthor) {
        authorNameToId[author.name] = newAuthor.id;
      }
    }
  }

  // 3. Seed Categories (All 4 supported categories)
  const categoriesToSeed = [
    {
      name: "Software Engineering",
      slug: "software-engineering",
      description: "Architecture, frameworks, and system engineering.",
    },
    {
      name: "AI & Automation",
      slug: "ai-automation",
      description: "RAG, LLMs, autonomous agents, and intelligence pipelines.",
    },
    {
      name: "Product Design",
      slug: "product-design",
      description: "UI/UX, interactions, accessibility, and design systems.",
    },
    {
      name: "Culture",
      slug: "culture",
      description: "Engineering culture, remote teams, and company values.",
    },
  ];

  const categoryNameToId: Record<string, string> = {};

  for (const cat of categoriesToSeed) {
    const { data: upsertedCat, error: catErr } = await supabase
      .from("ts_content_categories")
      .upsert(
        {
          site_id: siteId,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
        },
        { onConflict: "site_id,slug" },
      )
      .select("id")
      .single();

    if (!catErr && upsertedCat) {
      categoryNameToId[cat.name] = upsertedCat.id;
    } else {
      // Fallback query if conflict update didn't return
      const { data: existingCat } = await supabase
        .from("ts_content_categories")
        .select("id")
        .eq("site_id", siteId)
        .eq("slug", cat.slug)
        .maybeSingle();
      if (existingCat?.id) {
        categoryNameToId[cat.name] = existingCat.id;
      }
    }
  }

  // 4. Seed Blog Posts (All 8 articles)
  let seededPostsCount = 0;
  for (const post of blogPosts) {
    const authorIds = post.authors
      .map((a) => authorNameToId[a.name])
      .filter((id): id is string => Boolean(id));

    const categoryId = categoryNameToId[post.category] || null;

    let publishedAt: string;
    try {
      publishedAt = new Date(post.date).toISOString();
    } catch {
      publishedAt = new Date().toISOString();
    }

    const { error: postErr } = await supabase.from("ts_content_posts").upsert(
      {
        site_id: siteId,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        category_id: categoryId,
        hero_image: post.heroImage,
        tags: post.tags,
        author_ids: authorIds,
        read_time: post.readTime,
        faqs: post.faqs || [],
        seo: {
          metaTitle: post.title,
          metaDescription: post.excerpt,
        },
        status: "PUBLISHED",
        published_at: publishedAt,
      },
      { onConflict: "site_id,slug" },
    );

    if (!postErr) {
      seededPostsCount++;
    }
  }

  // 5. Seed Jobs
  let seededJobsCount = 0;
  for (const job of legacyJobs) {
    const { error: jobErr } = await supabase.from("ts_content_jobs").upsert(
      {
        site_id: siteId,
        slug: job.slug,
        title: job.title,
        department: job.department,
        location: job.location,
        type: job.type,
        experience_level: job.experienceLevel || null,
        description: job.description,
        responsibilities: job.responsibilities,
        requirements: job.requirements,
        benefits: job.benefits,
        status: job.status,
      },
      { onConflict: "site_id,slug" },
    );

    if (!jobErr) {
      seededJobsCount++;
    }
  }

  return {
    siteId,
    authorsCount: Object.keys(authorNameToId).length,
    categoriesCount: Object.keys(categoryNameToId).length,
    postsCount: seededPostsCount,
    jobsCount: seededJobsCount,
  };
}

// ─── Direct CLI Execution ─────────────────────────────────────────────────────
const isDirectRun =
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === path.resolve(__filename || "");

if (isDirectRun || process.env.RUN_SEEDER === "true") {
  seedCmsContent()
    .then((result) => {
      console.log("\n==========================================");
      console.log("   TECHSONANCE CMS SEEDER COMPLETED");
      console.log("==========================================");
      console.log(`Site ID:         ${result.siteId}`);
      console.log(`Authors Seeded:  ${result.authorsCount}`);
      console.log(`Cats Seeded:     ${result.categoriesCount}`);
      console.log(`Posts Seeded:    ${result.postsCount}`);
      console.log(`Jobs Seeded:     ${result.jobsCount}`);
      console.log("==========================================\n");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seeding failed with error:", err);
      process.exit(1);
    });
}
