// src/components/GeneralComponents/LazyOnScroll/LazyOnScroll.jsx
import { Suspense } from 'react';
import { useInView } from 'react-intersection-observer';
import Loading from '../Loading/Loading';

export default function LazyOnScroll({ children, fallback = <Loading text="جار التحميل..." />, threshold = 0.1, triggerOnce = true }) {
  const { ref, inView } = useInView({ threshold, triggerOnce });

  return (
    <div ref={ref}>
      {inView ? <Suspense fallback={fallback}>{children}</Suspense> : fallback}
    </div>
  );
}