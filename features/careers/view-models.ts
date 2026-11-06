import type { CareerApplyResponseDto } from "@/lib/contracts/careers.contract";

export type CareerApplicationViewModel = {
  applicationId: string;
  status: string;
  isSuccess: boolean;
  trackingMessage: string;
};

export function toCareerApplicationViewModel(dto: CareerApplyResponseDto): CareerApplicationViewModel {
  return {
    applicationId: dto.applicationId,
    status: dto.status,
    isSuccess: Boolean(dto.applicationId),
    trackingMessage: `Your application has been received (Ref: ${dto.applicationId}). Our talent acquisition team will review your qualifications and contact you.`,
  };
}
