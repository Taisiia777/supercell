import { CatalogSkeleton } from '@/components/skeletons/skeleton';
import Header from '@/components/header/header';
import GoBack from '@/components/back/back';
import '../../transitions.scss';

export default function ProductLoading() {
  return (
    <div className="page-transition">
      <Header />
      <GoBack />
      <CatalogSkeleton />
    </div>
  );
}