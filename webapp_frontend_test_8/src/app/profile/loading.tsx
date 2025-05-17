import { ProfileSkeleton } from '@/components/skeletons/skeleton';
import Header from '@/components/header/header';
import GoBack from '@/components/back/back';
import '../transitions.scss';

export default function ProfileLoading() {
  return (
    <div className="page-transition">

      <Header 
      />
      <GoBack />
      <ProfileSkeleton />
    </div>
  );
}