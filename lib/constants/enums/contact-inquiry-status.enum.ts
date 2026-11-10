/**
 * Contact inquiry lead processing status.
 * Dependency-free TypeScript enum per Rule 01 §3.
 */
export enum ContactInquiryStatus {
  NEW = "new",
  CONTACTED = "contacted",
  ARCHIVED = "archived",
}

export const CONTACT_INQUIRY_STATUS_VALUES = Object.values(ContactInquiryStatus) as [
  ContactInquiryStatus,
  ...ContactInquiryStatus[],
];
