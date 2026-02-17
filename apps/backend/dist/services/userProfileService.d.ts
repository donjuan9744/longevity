export declare function ensureUserProfile(userId: string): Promise<{
    id: string;
    userId: string;
    updatedAt: Date;
    age: number | null;
    goal: string;
    experienceLevel: string;
    createdAt: Date;
}>;
