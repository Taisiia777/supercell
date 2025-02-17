import { CartSkeleton } from '@/components/skeletons/skeleton';
import Header from '@/components/header/header';
import GoBack from '@/components/back/back';
import '../transitions.scss';

export default function CartLoading() {
  return (
    <div className="page-transition">
      <Header title="Корзина" />
      <GoBack />
      <CartSkeleton />
    </div>
  );
}