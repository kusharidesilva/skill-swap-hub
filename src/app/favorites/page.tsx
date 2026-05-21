import FavoritesPage from "@/components/favorites-page";
import ProfileShell from "@/components/profile-shell";

export default function Favorites() {
  return (
    <ProfileShell role="buyer">
      <FavoritesPage />
    </ProfileShell>
  );
}
