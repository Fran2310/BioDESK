// /src/user/dto/create-lab.dto.ts
export interface UserCache {
  labId: number;
  permissions: {
    id: number;
    role: string;
    description: string;
    permissions: {
      actions: string;
      subject: string;
      fields?: string;
    }[];
  };
}
