// src/utils/mappers/generic.mapper.ts

export const extendDomain = <T extends object, U extends object>(
  domain: T,
  extras: Partial<U>,
): T & Partial<U> => ({
  ...domain,
  ...extras,
});
