import type { LinkedInSnapshot } from "@/lib/linkedin-profile";

/**
 * Turn approved LinkedIn profile data into a short intro bio.
 *
 * This is a deterministic template so the demo stays self-contained (no API
 * key, no network). In a real app this is the seam where you'd call an LLM:
 * pass `snapshot` as context and ask for the bio. The point of the walkthrough
 * is that the model only ever sees data the user explicitly approved.
 */
export function generateBio(snapshot: LinkedInSnapshot): string {
  const current = snapshot.work.find((item) => /present/i.test(item.period)) ?? snapshot.work[0];
  const role = current ? `${current.title} at ${current.company}` : snapshot.headline;
  const topSkills = snapshot.skills.slice(0, 3).join(", ");
  const school = snapshot.education[0]?.school;

  const sentences: string[] = [];
  sentences.push(`${snapshot.name}${role ? ` — ${role}.` : "."}`);
  if (snapshot.headline && role !== snapshot.headline) sentences.push(`${snapshot.headline}.`);
  if (topSkills) sentences.push(`Works with ${topSkills}.`);
  if (school) sentences.push(`Studied at ${school}.`);
  sentences.push("Here to build.");

  return sentences.join(" ");
}
