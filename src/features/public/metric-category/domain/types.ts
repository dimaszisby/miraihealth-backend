export type SortField = "createdAt" | "updatedAt" | "name" | "metricCount";
export type SortParam = SortField | `-${SortField}`;

export type ListFilter = { name?: string };
export type ListQuery = {
  userId: string;
  limit: number;
  sort: SortParam;
  q?: string;
  filter?: ListFilter;
  after?: string; // opaque cursor
  includeTotal?: boolean; // careful: can be costly
};
export type ListResult<T> = {
  items: T[];
  nextCursor?: string;
  sort: SortParam;
  limit: number;
  q?: string;
  filter?: ListFilter;
  totalCount?: number;
};
