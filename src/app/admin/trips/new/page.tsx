import { TripForm } from '@/components/admin/TripForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create New Trip',
};

export default function NewTripPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <TripForm />
    </div>
  );
}
