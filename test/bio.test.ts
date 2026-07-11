import { strict as assert } from "node:assert";
import test from "node:test";
import { generateBio } from "../src/lib/bio";
import { mapLinkedInProfile } from "../src/lib/linkedin-profile";
import { LINKEDIN_PROFILE_FIXTURE } from "../src/data/linkedin-profile.fixture";

test("generates a bio from the sample fixture", () => {
  const snapshot = mapLinkedInProfile(LINKEDIN_PROFILE_FIXTURE);
  const bio = generateBio(snapshot);
  assert.ok(bio.includes("Alex Rivera"));
  assert.ok(bio.includes("Northwind Labs"));
  assert.ok(bio.includes("TypeScript"));
});

test("degrades cleanly on an empty snapshot", () => {
  const bio = generateBio({ name: "LinkedIn profile", headline: "", work: [], education: [], skills: [] });
  assert.ok(bio.length > 0);
  assert.ok(bio.includes("Here to build"));
});
