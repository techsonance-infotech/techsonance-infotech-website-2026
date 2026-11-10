/**
 * Contact inquiry source channel / type.
 * Dependency-free TypeScript enum per Rule 01 §3.
 */
export enum ContactInquiryType {
  CONTACT_PAGE = "contact_page",
  SCOPING = "scoping",
}

export const CONTACT_INQUIRY_TYPE_VALUES = Object.values(ContactInquiryType) as [
  ContactInquiryType,
  ...ContactInquiryType[],
];
