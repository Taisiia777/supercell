import styles from './skeleton.module.scss';

export const ProductSkeleton = () => (
  <div className={styles.skeleton_product}>
    <div className={styles.type} />
    <div className={styles.content}>
      <div className={styles.img} />
      <div className={styles.container}>
        <div className={styles.info}>
          <div className={styles.category} />
          <div className={styles.name} />
        </div>
        <div className={styles.actions}>
          <div className={styles.price} />
          <div className={styles.button} />
        </div>
      </div>
    </div>
  </div>
);

const CatalogItem = () => (
  <div className={styles.item}>
    <div className={styles.types}>
      <div className={styles.type}>
        <div className={styles.badge} />
      </div>
      <div className={styles.type}>
        <div className={styles.badge} />
      </div>
    </div>
    <div className={styles.content}>
      <div className={styles.img} />
      <div className={styles.container}>
        <div className={styles.title} />
        <div className={styles.actions}>
          <div className={styles.price} />
          <div className={styles.button} />
        </div>
      </div>
    </div>
  </div>
);

export const CatalogSkeleton = () => (
  <div className={styles.skeleton_catalog}>
    <div className={styles.items}>
    <CatalogItem key={1} />
    <CatalogItem key={2} />
    <CatalogItem key={3} />
    <CatalogItem key={4} />
    </div>
  </div>
);

export const CartSkeleton = () => (
  <div className={styles.skeleton_cart}>
    {[1, 2].map((i) => (
      <div key={i} className={styles.item}>
        <div className={styles.content}>
          <div className={styles.img} />
          <div className={styles.info}>
            <div className={styles.name} />
            <div className={styles.category} />
            <div className={styles.actions}>
              <div className={styles.price} />
              <div className={styles.counter} />
            </div>
          </div>
        </div>
        <div className={styles.input} />
      </div>
    ))}
  </div>
);

const InputSkeleton = () => (
  <div className={styles.input_container}>
    <div className={styles.label} />
    <div className={styles.input}>
      <div className={styles.game_icon} />
      <div className={styles.field} />
    </div>
  </div>
);

export const ProfileSkeleton = () => (
  <div className={styles.skeleton_profile}>
    <div className={styles.form}>
      <div className={styles.header}>
        <div className={styles.icon} />
        <div className={styles.text} />
      </div>
      <div className={styles.inputs}>
        <InputSkeleton />
        <InputSkeleton />
        <InputSkeleton />
        <InputSkeleton />
      </div>
    </div>
  </div>
);

export const HomePageSkeleton = () => (
  <div className={styles.skeleton}>
    <div className={styles.hero} />
    <div className={styles.categories}>
      {[1, 2, 3, 4].map((i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  </div>
);