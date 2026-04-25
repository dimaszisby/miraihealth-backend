import {
  api,
  buildUserPayload,
  createTestUser,
} from "../helpers/test-utils.js";
import { models } from "@/infrastructure/db/models.js";
import {
  buildAuthFeature,
  type AuthFeatureOverrides,
} from "@/features/auth/feature.js";
import { overrideAuthFeatureForTest } from "@/features/auth/infrastructure/http/controller.js";
import {
  EmailMessage,
  EmailSender,
} from "@/features/auth/application/ports/EmailSender.js";

class CapturingEmailSender implements EmailSender {
  public messages: EmailMessage[] = [];

  async send(message: EmailMessage): Promise<void> {
    this.messages.push(message);
  }
}

const installCapturingSender = (overrides?: AuthFeatureOverrides) => {
  const sender = new CapturingEmailSender();
  overrideAuthFeatureForTest(
    buildAuthFeature({ emailSender: sender, ...overrides }),
  );
  return sender;
};

const restoreFeature = () => {
  overrideAuthFeatureForTest(buildAuthFeature());
};

const extractTokenFromLink = (link: string): string => {
  const match = link.match(/[?&]token=([^&\s"]+)/);
  if (!match) throw new Error(`No token in link: ${link}`);
  return decodeURIComponent(match[1]);
};

describe("Password reset API", () => {
  afterEach(() => {
    restoreFeature();
  });

  describe("POST /auth/forgot-password", () => {
    it("returns 200 and creates a token row when the email is registered", async () => {
      const sender = installCapturingSender();
      const { payload } = await createTestUser();

      const res = await api
        .post("/api/v1/auth/forgot-password")
        .send({ email: payload.email });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data).toBeNull();
      expect(res.body.message).toMatch(/if an account exists/i);

      const tokens = await models.PasswordResetToken.findAll({
        where: { usedAt: null },
      });
      expect(tokens).toHaveLength(1);
      expect(tokens[0].tokenHash).toMatch(/^[0-9a-f]{64}$/);

      expect(sender.messages).toHaveLength(1);
      expect(sender.messages[0].to).toBe(payload.email);
      expect(sender.messages[0].text).toContain("?token=");
    });

    it("returns 200 with no token row and no email when the address is unknown (anti-enumeration)", async () => {
      const sender = installCapturingSender();

      const res = await api
        .post("/api/v1/auth/forgot-password")
        .send({ email: "missing@example.com" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.message).toMatch(/if an account exists/i);

      const tokens = await models.PasswordResetToken.findAll();
      expect(tokens).toHaveLength(0);
      expect(sender.messages).toHaveLength(0);
    });

    it("invalidates prior unused tokens on subsequent requests", async () => {
      installCapturingSender();
      const { payload } = await createTestUser();

      await api
        .post("/api/v1/auth/forgot-password")
        .send({ email: payload.email });
      await api
        .post("/api/v1/auth/forgot-password")
        .send({ email: payload.email });

      const tokens = await models.PasswordResetToken.findAll({
        order: [["createdAt", "ASC"]],
      });
      expect(tokens).toHaveLength(2);
      expect(tokens[0].usedAt).not.toBeNull();
      expect(tokens[1].usedAt).toBeNull();
    });

    it("rejects non-POST methods with 405", async () => {
      const res = await api.get("/api/v1/auth/forgot-password");
      expect(res.status).toBe(405);
    });

    it("validates email format", async () => {
      installCapturingSender();
      const res = await api
        .post("/api/v1/auth/forgot-password")
        .send({ email: "not-an-email" });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /auth/reset-password", () => {
    it("resets the password with a valid token, then login succeeds with the new password", async () => {
      const sender = installCapturingSender();
      const { payload } = await createTestUser();

      const forgotRes = await api
        .post("/api/v1/auth/forgot-password")
        .send({ email: payload.email });
      expect(forgotRes.status).toBe(200);
      const rawToken = extractTokenFromLink(sender.messages[0].text);

      const newPassword = "BrandNewPass123!";
      const resetRes = await api.post("/api/v1/auth/reset-password").send({
        token: rawToken,
        password: newPassword,
        passwordConfirmation: newPassword,
      });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.status).toBe("success");
      expect(resetRes.body.data).toBeNull();
      expect(resetRes.body.message).toMatch(/please log in/i);

      const tokenRows = await models.PasswordResetToken.findAll();
      expect(tokenRows.every((t) => t.usedAt !== null)).toBe(true);

      const loginRes = await api.post("/api/v1/auth/login").send({
        email: payload.email,
        password: newPassword,
      });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data).toHaveProperty("token");
    });

    it("rejects token reuse with a generic 400", async () => {
      const sender = installCapturingSender();
      const { payload } = await createTestUser();

      await api
        .post("/api/v1/auth/forgot-password")
        .send({ email: payload.email });
      const rawToken = extractTokenFromLink(sender.messages[0].text);

      const newPassword = "BrandNewPass123!";
      const first = await api.post("/api/v1/auth/reset-password").send({
        token: rawToken,
        password: newPassword,
        passwordConfirmation: newPassword,
      });
      expect(first.status).toBe(200);

      const replay = await api.post("/api/v1/auth/reset-password").send({
        token: rawToken,
        password: "AnotherPass123!",
        passwordConfirmation: "AnotherPass123!",
      });
      expect(replay.status).toBe(400);
      expect(replay.body.message).toBe("Invalid or expired reset token");
    });

    it("rejects an expired token with the same generic 400", async () => {
      const sender = installCapturingSender();
      const { payload } = await createTestUser();

      await api
        .post("/api/v1/auth/forgot-password")
        .send({ email: payload.email });
      const rawToken = extractTokenFromLink(sender.messages[0].text);

      await models.PasswordResetToken.update(
        { expiresAt: new Date(Date.now() - 60 * 1000) },
        { where: {} },
      );

      const res = await api.post("/api/v1/auth/reset-password").send({
        token: rawToken,
        password: "BrandNewPass123!",
        passwordConfirmation: "BrandNewPass123!",
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid or expired reset token");
    });

    it("rejects an unknown token with the same generic 400", async () => {
      installCapturingSender();
      const res = await api.post("/api/v1/auth/reset-password").send({
        token: "this-token-was-never-issued",
        password: "BrandNewPass123!",
        passwordConfirmation: "BrandNewPass123!",
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid or expired reset token");
    });

    it("rejects mismatched password and confirmation", async () => {
      installCapturingSender();
      const res = await api.post("/api/v1/auth/reset-password").send({
        token: "anything",
        password: "abcdef",
        passwordConfirmation: "ghijkl",
      });
      expect(res.status).toBe(400);
    });

    it("rejects non-POST methods with 405", async () => {
      const res = await api.get("/api/v1/auth/reset-password");
      expect(res.status).toBe(405);
    });
  });
});

describe("Password reset — sanity check on user payload helper", () => {
  it("buildUserPayload yields a unique email per call", () => {
    expect(buildUserPayload().email).not.toBe(buildUserPayload().email);
  });
});
