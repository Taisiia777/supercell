import { CatalogSkeleton } from '@/components/skeletons/skeleton';
import Header from '@/components/header/header';
import '../../transitions.scss';

export default function CatalogLoading() {
  return (
    <div className="page-transition">

      <Header />
      <CatalogSkeleton />
    </div>
  );
}