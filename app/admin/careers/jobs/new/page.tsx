"use client";

import React from "react";
import JobEditorPage from "../[id]/page";

export default function NewJobPage() {
  return <JobEditorPage params={Promise.resolve({ id: "new" })} />;
}
