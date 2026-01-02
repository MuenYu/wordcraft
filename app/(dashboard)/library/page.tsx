import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { LibraryView } from './LibraryView';

export default async function LibraryPage() {
  const user = await getUser();

  if (!user) {
    redirect('/sign-in');
  }

  return <LibraryView />;
}
