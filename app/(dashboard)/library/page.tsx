import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { getLibraryOverview } from '@/lib/db/library';
import { LibraryView } from './LibraryView';

export default async function LibraryPage() {
  const user = await getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const data = await getLibraryOverview(user.id);

  return <LibraryView data={data} />;
}
