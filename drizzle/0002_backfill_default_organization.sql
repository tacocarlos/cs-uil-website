-- Move every existing user into the default school (Groveton High School).
-- Keep the ID, name, and slug in sync with DEFAULT_ORGANIZATION in
-- src/lib/auth/organizations.ts, and the role mapping with memberRoleFor().
INSERT INTO "uil_organization" ("id", "name", "slug", "created_at")
VALUES ('groveton-hs', 'Groveton High School', 'groveton', now())
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "uil_member" ("id", "organization_id", "user_id", "role", "created_at")
SELECT
	gen_random_uuid()::text,
	'groveton-hs',
	"id",
	CASE "role"
		WHEN 'site-admin' THEN 'owner'
		WHEN 'teacher' THEN 'admin'
		ELSE 'member'
	END,
	now()
FROM "uil_user"
ON CONFLICT ("organization_id", "user_id") DO NOTHING;
--> statement-breakpoint
-- Existing sessions start in the default school, like new ones do.
UPDATE "uil_session"
SET "active_organization_id" = 'groveton-hs'
WHERE "active_organization_id" IS NULL;
