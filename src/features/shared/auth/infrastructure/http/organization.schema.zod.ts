import { z } from "zod";
import { zUUID, zEmail } from "@/constants/zod/zod-rules.js";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const inviteRoleEnum = z.enum(["admin", "member"]);

export const membershipRoleEnum = z.enum(["owner", "admin", "member"]);

export const createInviteBody = z.object({
  email: zEmail,
  role: inviteRoleEnum.openapi({ example: "member" }),
});

export const acceptInviteBody = z.object({
  token: z
    .string()
    .min(1, { message: "Invitation token is required" })
    .openapi({ example: "some-raw-token-value" }),
});

export const changeMemberRoleBody = z.object({
  role: inviteRoleEnum.openapi({ example: "admin" }),
});

export const orgIdParam = z.object({
  id: zUUID,
});

export const membershipIdParam = z.object({
  id: zUUID,
});

export const createInviteSchema = {
  body: createInviteBody,
  params: orgIdParam,
};
export const acceptInviteSchema = { body: acceptInviteBody };
export const changeMemberRoleSchema = {
  body: changeMemberRoleBody,
  params: membershipIdParam,
};
export const removeMembershipSchema = { params: membershipIdParam };
export const listMembersSchema = { params: orgIdParam };
