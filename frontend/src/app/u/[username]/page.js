import { api } from "../../../services/api";
import ProfileClient from "./ProfileClient";

// 1. Dynamic Metadata for Share Cards (OG Tags)
export async function generateMetadata({ params }) {
  const { username } = params;
  try {
    const profileRes = await api.getPublicCareerProfile(username);
    if (!profileRes?.success) return { title: 'Profile Not Found | Zeeklect' };

    const { user, stats } = profileRes.data;
    const score = Math.round(stats.hiringScore * 100);
    
    return {
      title: `${user.name} | Professional Career Profile`,
      description: `Verified Career Profile of ${user.name} (@${user.username}). Hiring Readiness Score: ${score}% in ${stats.targetRole}.`,
      openGraph: {
        title: `${user.name} - ${stats.targetRole} Readiness`,
        description: `Verified Expertise: ${score}% Hiring Score | Zeeklect Career Engine`,
        images: [user.avatar || '/og-placeholder.png'],
        type: 'profile',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${user.name}'s Professional Identity`,
        description: `Market Readiness: ${score}% | ${stats.targetRole} Pathway`,
      }
    };
  } catch (err) {
    return { title: 'Career Profile | Zeeklect' };
  }
}

// 2. Server-side Profile Rendering Entry
export default async function PublicProfilePage({ params }) {
  const { username } = params;
  
  let profile = null;
  try {
    const profileRes = await api.getPublicCareerProfile(username);
    profile = profileRes?.success ? profileRes.data : null;
  } catch (err) {
    console.error("Failed to fetch profile on server", err);
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[var(--site-bg)] flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-3xl font-black text-[var(--site-text)] mb-2">Profile Not Found</h1>
        <p className="text-[var(--site-text-muted)] max-w-sm">
          This user profile is either private or does not exist.
        </p>
      </div>
    );
  }

  return <ProfileClient profile={profile} username={username} />;
}
