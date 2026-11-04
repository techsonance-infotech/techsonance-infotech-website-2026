export const applicationRelations = (r: any) => ({
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
});
