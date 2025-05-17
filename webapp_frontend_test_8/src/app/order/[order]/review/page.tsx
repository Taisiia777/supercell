import OrderReview from "@/components/review/review";

export default function ReviewPage({ params }: { params: { order: string } }) {
    return <OrderReview order={params.order} />;
}