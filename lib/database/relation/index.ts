import { defineRelations } from 'drizzle-orm';
import * as schema from '../schema/index.schema';

export const relations = defineRelations(schema, (r) => ({
  sitesTable: {
    memberships: r.many.membershipsTable(),
    authors: r.many.authorsTable(),
    categories: r.many.categoriesTable(),
    posts: r.many.postsTable(),
    jobs: r.many.jobsTable(),
    applications: r.many.applicationsTable(),
  },
  membershipsTable: {
    site: r.one.sitesTable({
      from: r.membershipsTable.siteId,
      to: r.sitesTable.id,
    }),
  },
  authorsTable: {
    site: r.one.sitesTable({
      from: r.authorsTable.siteId,
      to: r.sitesTable.id,
    }),
  },
  categoriesTable: {
    site: r.one.sitesTable({
      from: r.categoriesTable.siteId,
      to: r.sitesTable.id,
    }),
    posts: r.many.postsTable(),
  },
  postsTable: {
    site: r.one.sitesTable({
      from: r.postsTable.siteId,
      to: r.sitesTable.id,
    }),
    category: r.one.categoriesTable({
      from: r.postsTable.categoryId,
      to: r.categoriesTable.id,
    }),
  },
  jobsTable: {
    site: r.one.sitesTable({
      from: r.jobsTable.siteId,
      to: r.sitesTable.id,
    }),
    applications: r.many.applicationsTable(),
  },
  applicationsTable: {
    site: r.one.sitesTable({
      from: r.applicationsTable.siteId,
      to: r.sitesTable.id,
    }),
    job: r.one.jobsTable({
      from: r.applicationsTable.jobId,
      to: r.jobsTable.id,
    }),
  },
}));
