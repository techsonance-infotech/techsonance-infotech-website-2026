export const siteRelations = (r: any) => ({
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
});
