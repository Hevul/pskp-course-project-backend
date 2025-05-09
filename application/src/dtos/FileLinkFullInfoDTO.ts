export interface FileLinkFullInfoDTO {
  filename: string;
  size: number;
  owner: string;
  createAt: Date;
  downloadCount: number;
  path: string;
  name?: string;
  description?: string;
}
